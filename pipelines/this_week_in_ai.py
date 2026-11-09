"""This Week In AI - Automated Social Media Shorts Pipeline.

An end-to-end zero-cost automation pipeline:
1. Scrapes top trending AI news (Google News, Hacker News, Hugging Face).
2. Generates viral Cartoon 3D script (0-2s hook, 2s cuts, spoken numbers with graphic caps).
3. Synthesizes voiceover with Kokoro (free local TTS) and word timestamps with Whisper.
4. Assembles 3D sets, animated 2D cartoon figures, and dynamic stat popups.
5. Composites final 9:16 vertical Short MP4 with sound effects and viral captions.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from agents.news_agent import AINewsScraper
from agents.script_agent import ScriptAgent

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = ROOT_DIR / "projects" / "this_week_in_ai"
SKILL_DIR = ROOT_DIR / "faceless-shorts-skill" / "faceless-shorts"
VENV_PYTHON = Path.home() / ".faceless-shorts" / "venv" / "Scripts" / "python.exe"
OUTPUT_DIR = ROOT_DIR / "output"


def get_python_bin() -> str:
    if VENV_PYTHON.exists():
        return str(VENV_PYTHON)
    return sys.executable


def run_cmd(cmd, cwd=None) -> int:
    print(f"\n[Command] {' '.join(str(c) for c in cmd)} (cwd: {cwd or os.getcwd()})")
    res = subprocess.run(cmd, cwd=cwd)
    if res.returncode != 0:
        print(f"[Error] Command exited with code {res.returncode}", file=sys.stderr)
    return res.returncode


def step_scrape(force: bool = False):
    print("\n========== [Step 1/5] Scraping This Week's Top AI Stories ==========")
    scraper = AINewsScraper(data_dir=ROOT_DIR / "data")
    stories = scraper.get_top_stories(force_refresh=force)
    print(f"\nGathered {len(stories)} stories. Top 3 Candidates for Video:")
    for i, s in enumerate(stories[:3], 1):
        print(f"  [{i}] (Score: {s.score}) {s.title}")
        print(f"      Source: {s.source} | Cues: {', '.join(s.virality_cues)}")
    return stories


def step_script(story_index: int = 0):
    print("\n========== [Step 2/5] Generating High-Retention Cartoon Script ==========")
    scraper = AINewsScraper(data_dir=ROOT_DIR / "data")
    stories = scraper.get_top_stories()
    if not stories:
        stories = scraper.get_top_stories(force_refresh=True)

    selected = stories[story_index] if story_index < len(stories) else stories[0]
    print(f"Selected Story: {selected.title} ({selected.source})")

    agent = ScriptAgent(output_dir=ROOT_DIR / "data")
    script = agent.generate_script_from_story(
        story_title=selected.title,
        story_summary=selected.summary,
        source=selected.source,
    )

    dest = PROJECT_DIR / "script.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    agent.save_script(script, dest)
    print(f"Wrote script to {dest} ({len(script.lines)} cuts).")
    return script


def step_voice():
    print("\n========== [Step 3/5] Synthesizing Voiceover (Kokoro) & Timing (Whisper) ==========")
    py = get_python_bin()
    voice_script = SKILL_DIR / "scripts" / "voice.py"
    words_script = SKILL_DIR / "scripts" / "words.py"

    code1 = run_cmd([py, str(voice_script), str(PROJECT_DIR)])
    if code1 != 0:
        raise RuntimeError("voice.py failed")

    code2 = run_cmd([py, str(words_script), str(PROJECT_DIR)])
    if code2 != 0:
        raise RuntimeError("words.py failed")
    print("Voiceover & Whisper alignment complete!")


def step_mix():
    print("\n========== [Step 4/5] Checking Shots & Mixing Audio Cues ==========")
    py = get_python_bin()
    # Check
    r_check = run_cmd(["node", "tools/capture.mjs", "check"], cwd=PROJECT_DIR)
    if r_check != 0:
        raise RuntimeError("capture.mjs check failed")

    # Cues
    r_cues = run_cmd(["node", "tools/capture.mjs", "cues"], cwd=PROJECT_DIR)
    if r_cues != 0:
        raise RuntimeError("capture.mjs cues failed")

    # Mix audio
    r_mix = run_cmd([py, "tools/mix.py", "."], cwd=PROJECT_DIR)
    if r_mix != 0:
        raise RuntimeError("mix.py failed")
    print("Audio mixing complete!")


def step_render(draft: bool = False, preview_seconds: int = 0):
    print("\n========== [Step 5/5] Rendering Video (1080x1920 9:16 MP4) ==========")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Contact sheet first for review
    print("Generating review contact sheet...")
    run_cmd(["node", "tools/capture.mjs", "sheet", "review/all.jpg", "1", "8"], cwd=PROJECT_DIR)
    sheet_src = PROJECT_DIR / "review" / "all.jpg"
    if sheet_src.exists():
        shutil.copy2(sheet_src, OUTPUT_DIR / "review_contact_sheet.jpg")
        print(f"Saved review contact sheet: {OUTPUT_DIR / 'review_contact_sheet.jpg'}")

    # 2. Render MP4
    mp4_name = "this_week_in_ai.mp4"
    cmd = ["node", "tools/capture.mjs", "video", f"renders/{mp4_name}"]
    if preview_seconds > 0:
        cmd.extend(["0", str(preview_seconds)])
    if draft:
        cmd.append("--draft")

    code = run_cmd(cmd, cwd=PROJECT_DIR)
    if code != 0:
        raise RuntimeError("Video rendering failed")

    rendered = PROJECT_DIR / "renders" / mp4_name
    dest = OUTPUT_DIR / mp4_name
    if rendered.exists():
        shutil.copy2(rendered, dest)
        print(f"\n🎉 SUCCESS! Rendered video ready at: {dest}")
        print(f"File Size: {dest.stat().st_size / (1024*1024):.2f} MB")
    return dest


def main():
    parser = argparse.ArgumentParser(description="'This Week In AI' Automation Pipeline")
    parser.add_argument("--scrape", action="store_true", help="Scrape latest AI news")
    parser.add_argument("--script", action="store_true", help="Generate viral script")
    parser.add_argument("--story-index", type=int, default=0, help="Story index to pick from scraped pool")
    parser.add_argument("--voice", action="store_true", help="Run Kokoro TTS and Whisper timing")
    parser.add_argument("--mix", action="store_true", help="Generate cues and mix sound")
    parser.add_argument("--render", action="store_true", help="Render MP4 video")
    parser.add_argument("--draft", action="store_true", help="Use ultrafast draft mode for video")
    parser.add_argument("--preview", type=int, default=0, help="Render preview clip of N seconds")
    parser.add_argument("--run", action="store_true", help="Run full end-to-end pipeline")
    args = parser.parse_args()

    if args.run:
        step_scrape(force=True)
        step_script(story_index=args.story_index)
        step_voice()
        step_mix()
        step_render(draft=args.draft, preview_seconds=args.preview)
    elif args.scrape:
        step_scrape(force=True)
    elif args.script:
        step_script(story_index=args.story_index)
    elif args.voice:
        step_voice()
    elif args.mix:
        step_mix()
    elif args.render:
        step_render(draft=args.draft, preview_seconds=args.preview)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
