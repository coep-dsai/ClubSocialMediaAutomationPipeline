"""Audio Agent for High-Fidelity Voiceover and Frame-Accurate Captions.

Uses Microsoft Neural TTS (edge-tts) for studio-grade human audio:
- Primary: en-US-GuyNeural (crisp, energetic, modern explainer)
- Fallback: en-US-ChristopherNeural (authoritative broadcast)
- Offline fallback: Kokoro-82M (local model in ~/.faceless-shorts/kokoro)

Features:
- Sentence-level continuous synthesis (+10% rate for natural, readable pacing).
- Zero artificial dead-air between clauses: speech flows naturally across cuts.
- Millisecond-accurate native WordBoundary timestamps directly from the stream.
- Frame-exact concat demuxing with bit-exact silence gaps matching timestamp math.
"""

import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import edge_tts


def NORM(w: str) -> str:
    """Normalize word for robust matching."""
    return re.sub(r"[^a-zA-Z0-9]+", "", w).lower()


def make_silence_wav(path: Path, duration_sec: float, sample_rate: int = 48000):
    """Create a pristine 16-bit stereo silent WAV file of exact duration."""
    num_frames = max(1, int(round(duration_sec * sample_rate)))
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"\x00" * (num_frames * 4))


class AudioAgent:
    """Studio-grade voiceover & millisecond-exact word alignment agent.
    Uses edge-tts (GuyNeural / ChristopherNeural) with continuous sentence-level
    cadence and native WordBoundary timestamp events.
    """

    def __init__(
        self,
        primary_voice: str = "en-US-GuyNeural",
        fallback_voice: str = "en-US-ChristopherNeural",
    ):
        self.primary_voice = primary_voice
        self.fallback_voice = fallback_voice

    async def _synthesize_sentence_edge(
        self, text: str, voice: str, rate: str = "+10%"
    ) -> Tuple[bytes, List[Dict[str, Any]]]:
        """Synthesize a complete sentence with edge-tts and collect audio bytes + word timestamps."""
        comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
        audio_chunks = []
        words = []
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 10_000_000.0
                d = chunk["duration"] / 10_000_000.0
                words.append({
                    "text": chunk["text"],
                    "start": round(s, 3),
                    "end": round(s + d, 3),
                })
        return b"".join(audio_chunks), words

    def synthesize_project(
        self,
        project_dir: Path,
        voice: Optional[str] = None,
        rate: str = "+10%",
        lead: float = 0.3,
        outro: float = 0.9,
    ) -> bool:
        project_dir = Path(project_dir)
        script_file = project_dir / "script.json"
        if not script_file.exists():
            raise FileNotFoundError(f"Missing script.json at {script_file}")

        script_data = json.loads(script_file.read_text(encoding="utf-8"))
        lines = script_data.get("lines", [])
        if not lines:
            raise ValueError("No lines found in script.json")

        target_voice = voice or script_data.get("voice") or self.primary_voice
        if target_voice.startswith("am_") or target_voice.startswith("af_") or target_voice.startswith("bm_"):
            target_voice = self.primary_voice

        speed_val = script_data.get("speed")
        if speed_val and not voice:
            diff = int(round((float(speed_val) - 1.0) * 100))
            rate = f"+{diff}%" if diff >= 0 else f"{diff}%"

        lead = float(script_data.get("lead", lead))
        outro = float(script_data.get("outro", outro))

        print(f"\n[AudioAgent] Synthesizing continuous voiceover with {target_voice} (rate: {rate})...")

        try:
            return asyncio.run(
                self._synthesize_continuous(project_dir, lines, target_voice, rate, lead, outro)
            )
        except Exception as e:
            print(f"[Warning] Failed with primary voice {target_voice}: {e}. Trying fallback {self.fallback_voice}...", file=sys.stderr)
            try:
                return asyncio.run(
                    self._synthesize_continuous(project_dir, lines, self.fallback_voice, rate, lead, outro)
                )
            except Exception as e2:
                print(f"[Error] edge-tts synthesis failed: {e2}. Falling back to local Kokoro...", file=sys.stderr)
                return self._synthesize_with_kokoro(project_dir)

    async def _synthesize_continuous(
        self, project_dir: Path, lines: List[Dict[str, Any]], voice: str, rate: str, lead: float, outro: float
    ) -> bool:
        data_dir = project_dir / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        temp_dir = data_dir / "temp_audio"
        temp_dir.mkdir(parents=True, exist_ok=True)

        # 1. Group lines into sentences (a sentence ends in . ? ! or line['break'])
        groups: List[List[int]] = []
        cur_group: List[int] = []
        for i, ln in enumerate(lines):
            cur_group.append(i)
            text_strip = ln["text"].strip()
            if re.search(r'[.?!]["\')]*$', text_strip) or ln.get("break") or i == len(lines) - 1:
                groups.append(cur_group)
                cur_group = []

        all_words_output: List[Dict[str, Any]] = []
        line_records: List[Dict[str, Any]] = [None] * len(lines)
        audio_segments: List[Path] = []

        # Lead silence segment
        lead_wav = temp_dir / "lead_silence.wav"
        make_silence_wav(lead_wav, lead)
        audio_segments.append(lead_wav)

        current_time = lead

        for g_idx, g in enumerate(groups):
            sentence_text = " ".join(lines[i]["text"].strip() for i in g)
            mp3_path = temp_dir / f"sent_{g_idx:03d}.mp3"
            wav_path = temp_dir / f"sent_{g_idx:03d}.wav"

            audio_bytes, heard_words = await self._synthesize_sentence_edge(sentence_text, voice, rate=rate)
            mp3_path.write_bytes(audio_bytes)

            # Convert to standard 48kHz 16-bit stereo WAV
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(mp3_path), "-ar", "48000", "-ac", "2", str(wav_path)],
                check=True
            )
            with wave.open(str(wav_path), "rb") as wf:
                sentence_dur = wf.getnframes() / float(wf.getframerate())

            audio_segments.append(wav_path)
            sent_start = current_time
            sent_end = current_time + sentence_dur

            # Collect script tokens for each line in this sentence
            line_tokens_list = []
            for i in g:
                toks = [w for w in lines[i]["text"].split() if NORM(w)]
                line_tokens_list.append((i, toks))

            # Match heard_words against line tokens
            h_idx = 0
            for i, toks in line_tokens_list:
                line_words_matched = []
                for tok in toks:
                    norm_tok = NORM(tok)
                    # Find matching word in heard_words
                    found_ev = None
                    search_limit = min(len(heard_words), h_idx + 8)
                    for k in range(h_idx, search_limit):
                        if NORM(heard_words[k]["text"]) == norm_tok:
                            found_ev = heard_words[k]
                            h_idx = k + 1
                            break

                    if found_ev:
                        w_start = round(sent_start + found_ev["start"], 3)
                        w_end = round(sent_start + found_ev["end"], 3)
                    else:
                        # Fallback interpolation if word boundary missed token
                        prev_time = line_words_matched[-1]["e"] if line_words_matched else (all_words_output[-1]["e"] if all_words_output else sent_start)
                        w_start = prev_time
                        w_end = round(prev_time + 0.15, 3)

                    item = {
                        "w": tok,
                        "line": i,
                        "s": w_start,
                        "e": w_end,
                    }
                    line_words_matched.append(item)
                    all_words_output.append(item)

                l_start = line_words_matched[0]["s"] if line_words_matched else sent_start
                l_end = line_words_matched[-1]["e"] if line_words_matched else sent_end
                line_records[i] = {
                    "i": i,
                    "text": lines[i]["text"].strip(),
                    "start": l_start,
                    "end": l_end,
                }

            current_time = sent_end

            # Pause after full sentence if not the last sentence
            if g_idx < len(groups) - 1:
                gap = float(lines[g[-1]].get("gap", 0.22))
                gap_wav = temp_dir / f"gap_{g_idx:03d}.wav"
                make_silence_wav(gap_wav, gap)
                audio_segments.append(gap_wav)
                current_time += gap

        # Outro silence segment
        outro_wav = temp_dir / "outro_silence.wav"
        make_silence_wav(outro_wav, outro)
        audio_segments.append(outro_wav)
        current_time += outro

        total_audio_duration = current_time

        # Combine all audio into narration.wav using exact concat list
        self._combine_segments(audio_segments, data_dir / "narration.wav")

        # Write lines.json
        lines_json = {
            "voice": voice,
            "duration": round(total_audio_duration, 3),
            "lines": line_records,
        }
        (data_dir / "lines.json").write_text(json.dumps(lines_json, indent=2), encoding="utf-8")

        # Write words.json
        (data_dir / "words.json").write_text(json.dumps(all_words_output, indent=2), encoding="utf-8")

        # Write words.txt for debugging
        words_txt_lines = [
            f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}"
            for w in all_words_output
        ]
        (data_dir / "words.txt").write_text("\n".join(words_txt_lines), encoding="utf-8")

        shutil.rmtree(temp_dir, ignore_errors=True)

        print(f"[AudioAgent] Continuous voiceover complete! {len(line_records)} cuts, {len(all_words_output)} words.")
        print(f"            Duration: {total_audio_duration:.2f}s (Frame-accurate sync at {rate}).")
        return True

    def _combine_segments(self, wav_files: List[Path], output_wav: Path):
        concat_file = output_wav.parent / "concat_list.txt"
        with open(concat_file, "w", encoding="utf-8") as f:
            for p in wav_files:
                f.write(f"file '{p.resolve().as_posix()}'\n")

        cmd = [
            "ffmpeg", "-v", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_file),
            "-c", "copy",
            str(output_wav),
        ]
        subprocess.run(cmd, check=True)
        concat_file.unlink(missing_ok=True)

    def _synthesize_with_kokoro(self, project_dir: Path) -> bool:
        base_dir = Path(__file__).resolve().parent.parent
        skills_root = base_dir / "faceless-shorts-skills"
        if not skills_root.exists():
            skills_root = base_dir / "faceless-shorts-skill"
        skill_voice = skills_root / "faceless-shorts" / "scripts" / "voice.py"
        skill_words = skills_root / "faceless-shorts" / "scripts" / "words.py"
        local_py = Path(__file__).resolve().parent.parent / ".venv" / "Scripts" / "python.exe"
        if local_py.exists():
            py = str(local_py)
        else:
            py = str(Path.home() / ".faceless-shorts" / "venv" / "Scripts" / "python.exe")
        subprocess.run([py, str(skill_voice), str(project_dir)], check=True)
        subprocess.run([py, str(skill_words), str(project_dir)], check=True)
        return True


def main():
    agent = AudioAgent()
    proj = Path("projects/this_week_in_ai")
    agent.synthesize_project(proj, voice="en-US-GuyNeural", rate="+10%")


if __name__ == "__main__":
    main()
