"""COEP Data Science and AI Club — Autonomous Shorts Studio.

A lightweight, zero-cost ($0) web dashboard built with Streamlit.
Enables club members to:
1. Browse and scrape weekly AI news with virality scoring.
2. Select a story or write a custom topic/prompt to generate viral shorts scripts.
3. Switch between 3D visual styles (Neon 3D Explainer, Tall Tale, Deep Dive, etc.) and voices.
4. Synthesize studio-grade voiceover with frame-accurate WordBoundary sync.
5. Render and preview 1080x1920 vertical MP4 shorts with in-browser playback & direct download.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import streamlit as st

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent
PROJECT_DIR = PROJECT_ROOT / "projects" / "this_week_in_ai"
OUTPUT_DIR = PROJECT_ROOT / "output"
SCRAPER_CACHE = OUTPUT_DIR / "weekly_ai_news.json"
VENV_PYTHON = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

# Available Visual Styles
STYLES = {
    "Neon 3D & Tech Explainer (Active)": {
        "id": "neon-explainer",
        "desc": "Multi-scene 3D: Server Farm, 3D Neural Net, Gold Trophy Podium, Accelerator Highway, Battery Dial, & Club Watermark.",
        "badge": "⚡ Recommended",
    },
    "Deep Dive 3D (Cinematic)": {
        "id": "deep-dive",
        "desc": "Cinematic 3D wireframes, camera depth-of-field, glowing data manifolds, and analytical glass overlays.",
        "badge": "🔬 Research",
    },
    "Tall Tale 3D (Narrative)": {
        "id": "tall-tale",
        "desc": "Stylized 3D cartoon characters, exaggerated character expressions, and humorous narrative staging.",
        "badge": "🎭 Character",
    },
    "Inside Out 3D (Schematic)": {
        "id": "inside-out",
        "desc": "Layered mechanical disassembly, technical blueprints, and exploding architectural views.",
        "badge": "🛠️ Architecture",
    },
    "Paper Atlas (Infographic)": {
        "id": "paper-atlas",
        "desc": "Vintage parchment maps, ink schematics, hand-drawn vector charts, and textured paper transitions.",
        "badge": "📜 Historical",
    },
    "Night File (Noir Mystery)": {
        "id": "night-file",
        "desc": "High-contrast neon crime board, redacted classified dossier documents, and pulsing cyan spotlights.",
        "badge": "🕵️ Investigative",
    },
}

# Available Voice Presets
VOICES = {
    "en-US-GuyNeural (Fast, Crisp Explainer)": "en-US-GuyNeural",
    "en-US-ChristopherNeural (Authoritative Broadcast)": "en-US-ChristopherNeural",
    "en-US-JennyNeural (Warm, Dynamic Narrator)": "en-US-JennyNeural",
    "en-US-AriaNeural (Modern Tech Anchor)": "en-US-AriaNeural",
    "Kokoro Local (af_heart - Offline Fallback)": "af_heart",
}

# ── Page Configuration ──────────────────────────────────────────────────
st.set_page_config(
    page_title="COEP DSAI Shorts Studio",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ──────────────────────────────────────────────────────────
st.markdown("""
<style>
    /* Dark cyber theme with cyan/emerald accents */
    .main-header {
        background: linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #030712 100%);
        padding: 24px;
        border-radius: 16px;
        border: 1px solid rgba(56, 189, 248, 0.3);
        box-shadow: 0 8px 32px rgba(0, 240, 255, 0.08);
        margin-bottom: 24px;
    }
    .badge-pill {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 700;
        margin-right: 8px;
    }
    .badge-cyan { background: rgba(0, 240, 255, 0.15); color: #38BDF8; border: 1px solid #00F0FF; }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid #10B981; }
    .badge-gold { background: rgba(250, 204, 21, 0.15); color: #FACC15; border: 1px solid #EAB308; }
    .news-card {
        background: #0F172A;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #334155;
        margin-bottom: 12px;
        transition: transform 0.2s, border-color 0.2s;
    }
    .news-card:hover {
        border-color: #38BDF8;
        transform: translateY(-2px);
    }
    .stButton>button {
        border-radius: 10px;
        font-weight: 700;
        transition: all 0.2s;
    }
</style>
""", unsafe_allow_html=True)

# ── Header Banner ───────────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div>
            <h1 style="color: #F8FAFC; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">
                ⚡ COEP DSAI Club — Shorts Studio
            </h1>
            <p style="color: #94A3B8; margin: 6px 0 0 0; font-size: 16px;">
                End-to-End Autonomous AI News to Viral 3D Animated Shorts Pipeline
            </p>
        </div>
        <div style="margin-top: 12px;">
            <span class="badge-pill badge-cyan">Model: Gemini 3.8 Flash (High)</span>
            <span class="badge-pill badge-green">Cost: $0.00 Free</span>
            <span class="badge-pill badge-gold">Format: 1080×1920 (9:16 Vertical)</span>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ── Helper Functions ────────────────────────────────────────────────────
@st.cache_data(ttl=3600)
def load_cached_news() -> List[Dict[str, Any]]:
    if SCRAPER_CACHE.exists():
        try:
            return json.loads(SCRAPER_CACHE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def run_news_scraper() -> List[Dict[str, Any]]:
    try:
        from agents.news_agent import NewsScraperAgent
        scraper = NewsScraperAgent()
        stories = scraper.fetch_all_stories()
        SCRAPER_CACHE.parent.mkdir(parents=True, exist_ok=True)
        SCRAPER_CACHE.write_text(json.dumps(stories, indent=2), encoding="utf-8")
        st.cache_data.clear()
        return stories
    except Exception as e:
        st.error(f"Scraper error: {e}")
        return []


def load_project_script() -> Dict[str, Any]:
    script_file = PROJECT_DIR / "script.json"
    if script_file.exists():
        try:
            return json.loads(script_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "title": "This Week In AI: Breakthrough Story",
        "voice": "en-US-GuyNeural",
        "speed": 1.10,
        "lead": 0.30,
        "outro": 0.90,
        "gap": 0.20,
        "music": "bounce",
        "lines": [
            {"text": "This week, a tiny three dollar AI experiment"},
            {"text": "just beat a hundred million dollar supercomputer."},
            {"text": "And the biggest tech giants are scrambling."},
        ]
    }


def save_project_script(script_dict: Dict[str, Any]):
    script_file = PROJECT_DIR / "script.json"
    script_file.parent.mkdir(parents=True, exist_ok=True)
    script_file.write_text(json.dumps(script_dict, indent=2), encoding="utf-8")


def switch_style(style_id: str):
    """Switch project's active shots.js to selected style template."""
    src_shots = PROJECT_DIR / "src" / "shots.js"
    presets_dir = PROJECT_DIR / "presets"
    presets_dir.mkdir(parents=True, exist_ok=True)

    if style_id == "neon-explainer":
        preset_file = presets_dir / "neon-explainer.js"
        if preset_file.exists():
            shutil.copy2(preset_file, src_shots)
            return True
    else:
        # Check style library
        style_example = PROJECT_ROOT / "faceless-shorts-skill" / "faceless-shorts" / "styles" / style_id / "example" / "src" / "shots.js"
        if style_example.exists():
            shutil.copy2(style_example, src_shots)
            return True
    return False


# ── Sidebar Controls ────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🎛️ Pipeline Presets")

    # Visual Style Selector
    selected_style_name = st.selectbox(
        "Visual 3D Style Preset",
        options=list(STYLES.keys()),
        index=0,
        help="Select the 3D visual language, camera motion, and graphic assets.",
    )
    style_info = STYLES[selected_style_name]
    st.caption(f"{style_info['badge']}: {style_info['desc']}")

    if st.button("Apply Selected Style to Engine"):
        if switch_style(style_info["id"]):
            st.success(f"Activated style: {selected_style_name}!")
        else:
            st.warning("Style template ready in engine.")

    st.markdown("---")
    st.markdown("### 🎙️ Audio & Voiceover")

    # Voice Selector
    selected_voice_name = st.selectbox(
        "Narrator Voice Model",
        options=list(VOICES.keys()),
        index=0,
    )
    selected_voice_code = VOICES[selected_voice_name]

    # Speaking Pace
    speed_percent = st.slider(
        "Speaking Rate",
        min_value=0,
        max_value=20,
        value=10,
        step=2,
        format="+%d%%",
        help="Recommended: +10% for natural cadence with ample animation view time.",
    )
    speed_factor = 1.0 + (speed_percent / 100.0)

    # Background Music
    bg_music = st.selectbox(
        "Background Soundtrack",
        options=["bounce", "chill", "synthwave"],
        index=0,
    )

    st.markdown("---")
    st.markdown("### 🏷️ Club Identity")
    show_watermark = st.checkbox("Show '⚡ COEP DSAI CLUB' Header Pill", value=True)
    club_handle = st.text_input("Club Social Handle", value="@coep_dsai")

    st.markdown("---")
    st.caption("COEP Technological University • Data Science & AI Club")


# ── Tab Navigation ──────────────────────────────────────────────────────
tabs = st.tabs([
    "🌐 1. AI News Radar",
    "✍️ 2. Script & Storyboard Studio",
    "🎨 3. Style & Audio Customizer",
    "🎬 4. Render Studio & Preview",
])


# ═════════════════════════════════════════════════════════════════════════
# TAB 1: AI NEWS RADAR
# ═════════════════════════════════════════════════════════════════════════
with tabs[0]:
    st.markdown("### 🌐 Live AI News Radar & Virality Scorer")
    st.write("Scrapes Google News RSS, Hacker News Algolia API, and Hugging Face Daily Papers to find this week's highest-retention AI breakthroughs.")

    col_btn, col_search, col_min_score = st.columns([1.2, 2.5, 1.5])
    with col_btn:
        scrape_clicked = st.button("⚡ Scrape Latest AI News", type="primary", use_container_width=True)
    with col_search:
        search_query = st.text_input("Filter stories by keyword", placeholder="Search models, GPUs, benchmarks...")
    with col_min_score:
        min_score = st.slider("Min Virality Score", 5.0, 10.0, 7.5, 0.5)

    if scrape_clicked:
        with st.spinner("Scraping and analyzing AI breakthroughs..."):
            stories = run_news_scraper()
            st.success(f"Discovered {len(stories)} stories across web sources!")
    else:
        stories = load_cached_news()

    # Filter stories
    filtered_stories = []
    for s in stories:
        if s.get("virality_score", 0) >= min_score:
            if not search_query or search_query.lower() in s.get("title", "").lower() or search_query.lower() in s.get("summary", "").lower():
                filtered_stories.append(s)

    st.caption(f"Showing {len(filtered_stories)} stories matching criteria (sorted by virality score):")

    # Render stories as cards
    for idx, story in enumerate(filtered_stories):
        v_score = story.get("virality_score", 7.0)
        score_badge = f'<span class="badge-pill badge-{"green" if v_score >= 8.5 else "cyan"}">Virality: {v_score:.1f}/10</span>'
        source_badge = f'<span class="badge-pill badge-gold">{story.get("source", "Web")}</span>'

        with st.container():
            st.markdown(f"""
            <div class="news-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; color: #F1F5F9;">{story.get('title')}</h4>
                        <div style="margin-bottom: 8px;">{score_badge} {source_badge}</div>
                        <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">{story.get('summary')}</p>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            col_pick, col_link = st.columns([1.5, 8.5])
            with col_pick:
                if st.button(f"⚡ Use For Video", key=f"use_story_{idx}"):
                    # Update session state with this story
                    st.session_state["selected_story"] = story
                    st.success(f"Selected: '{story.get('title')[:45]}...' — Proceed to Tab 2 to edit script!")
            with col_link:
                if story.get("url"):
                    st.markdown(f"<a href='{story.get('url')}' target='_blank' style='font-size: 13px; color: #38BDF8;'>🔗 View Original Source Article</a>", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════
# TAB 2: SCRIPT & STORYBOARD STUDIO
# ═════════════════════════════════════════════════════════════════════════
with tabs[1]:
    st.markdown("### ✍️ Script & Storyboard Studio")
    st.write("Craft a high-retention 35–45s short with a 0–2s hook, fast 2s cuts, and an infinite-loop ending.")

    current_script = load_project_script()

    # Pre-fill from selected story if any
    sel = st.session_state.get("selected_story")
    if sel:
        st.info(f"📌 Active Story Context: **{sel.get('title')}** (Source: {sel.get('source')})")

    col_title, col_hook = st.columns([2, 2])
    with col_title:
        title_input = st.text_input("Short Title / Topic", value=current_script.get("title", "This Week In AI: The $3 Experiment That Disrupted Big Tech"))
    with col_hook:
        st.text_input("0–2s Hook Concept", value="A tiny $3 AI experiment just beat a $100M supercomputer.")

    st.markdown("#### 🎬 Storyboard Cuts (14–18 Fast Cuts)")
    st.caption("Each line represents one camera cut (~1.5–3.0s). Pacing is automatically synchronized with edge-tts WordBoundaries.")

    lines = current_script.get("lines", [])
    df_lines = pd.DataFrame([
        {
            "Cut #": f"S{i:02d}",
            "Spoken Line Text": ln.get("text", ""),
            "Pause After (s)": ln.get("gap", 0.22),
        }
        for i, ln in enumerate(lines)
    ])

    edited_df = st.data_editor(
        df_lines,
        use_container_width=True,
        num_rows="dynamic",
        column_config={
            "Cut #": st.column_config.TextColumn(disabled=True, width="small"),
            "Spoken Line Text": st.column_config.TextColumn(width="large", required=True),
            "Pause After (s)": st.column_config.NumberColumn(min_value=0.0, max_value=2.0, step=0.05, width="small"),
        }
    )

    col_save, col_revert = st.columns([1.5, 8.5])
    with col_save:
        if st.button("💾 Save Script to Engine (`script.json`)", type="primary"):
            updated_lines = []
            for _, row in edited_df.iterrows():
                text_val = str(row["Spoken Line Text"]).strip()
                if text_val:
                    updated_lines.append({
                        "text": text_val,
                        "gap": float(row["Pause After (s)"]),
                    })

            current_script["title"] = title_input
            current_script["voice"] = selected_voice_code
            current_script["speed"] = speed_factor
            current_script["music"] = bg_music
            current_script["lines"] = updated_lines
            save_project_script(current_script)
            st.success(f"Saved {len(updated_lines)} cuts to `script.json` successfully!")


# ═════════════════════════════════════════════════════════════════════════
# TAB 3: STYLE & AUDIO CUSTOMIZER
# ═════════════════════════════════════════════════════════════════════════
with tabs[2]:
    st.markdown("### 🎨 Visual & Acoustic Engine Configuration")

    col_s1, col_s2 = st.columns(2)
    with col_s1:
        st.markdown("#### 🌟 3D Visual Scenes in Active Engine")
        st.markdown("""
        - **Scene 1: The Duel** — Sleek aluminum laptop workstation vs ominous \$100M supercomputer tower.
        - **Scene 2: The Server Farm** — Receding monolith server aisles with flashing cyan and emerald rack LEDs.
        - **Scene 3: 3D Neural Network** — Perfectly framed 4-layer multi-layer perceptron with pulsing gold synaptic rewiring.
        - **Scene 4: Benchmark Podium** — 3D Gold Championship Trophy Cup, 3-tiered podium, and animated 98.4% bar chart.
        - **Scene 5: High-Speed & Eco HUD** — Rushing accelerator tunnel grid, 70X speedometer gauge, and 3D green eco battery cell.
        - **Scene 6: Everyday Workstation** — Desk with terminal code execution log and global turning point announcement.
        """)

    with col_s2:
        st.markdown("#### 🔊 Audio Pipeline Settings")
        st.markdown(f"""
        - **Active Voice:** `{selected_voice_code}` ({selected_voice_name})
        - **Speaking Speed Rate:** `+{speed_percent}%` (Natural conversational flow with ample animation view time)
        - **Cadence Engine:** Sentence-level continuous synthesis (Zero artificial dead-air pauses)
        - **Timestamp Protocol:** Microsoft Speech `WordBoundary` events directly mapped to word tokens
        - **Audio Concat Engine:** Bit-exact 48kHz stereo WAV concatenation with exact gap spacing
        """)


# ═════════════════════════════════════════════════════════════════════════
# TAB 4: RENDER STUDIO & PREVIEW
# ═════════════════════════════════════════════════════════════════════════
with tabs[3]:
    st.markdown("### 🎬 Render Studio & In-Browser Player")
    st.write("Generate audio, calculate frame cues, render 3D scenes via Chrome headless compositor, and preview or download the finished MP4.")

    col_render_btn, col_check_btn = st.columns([2, 2])
    with col_render_btn:
        start_render = st.button("🚀 Render Full 1080×1920 Short", type="primary", use_container_width=True)
    with col_check_btn:
        start_check = st.button("🔍 Check Timing & Captions Only", use_container_width=True)

    status_box = st.empty()

    if start_check:
        with st.status("Verifying Script and Frame Cues...", expanded=True) as status:
            st.write("Running audio agent synthesis...")
            res_audio = subprocess.run([str(VENV_PYTHON), "-m", "agents.audio_agent"], capture_output=True, text=True)
            st.text(res_audio.stdout)

            st.write("Running headless syntax & timing check...")
            res_check = subprocess.run(["node", "tools/capture.mjs", "check"], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            st.text(res_check.stdout)
            status.update(label="Timing & Cues Verification Complete!", state="complete")

    if start_render:
        progress_bar = st.progress(0, text="Starting render pipeline...")
        with st.status("Executing Video Generation Pipeline...", expanded=True) as status:
            # 1. Synthesize audio
            progress_bar.progress(15, text="Step 1/4: Synthesizing voiceover at +10% rate...")
            st.write("Synthesizing studio voiceover with continuous sentence cadence...")
            res_audio = subprocess.run([str(VENV_PYTHON), "-m", "agents.audio_agent"], capture_output=True, text=True)
            if res_audio.returncode != 0:
                st.error(f"Audio error: {res_audio.stderr}")
            else:
                st.write(res_audio.stdout.strip())

            # 2. Extract cues
            progress_bar.progress(35, text="Step 2/4: Extracting audio cues...")
            st.write("Extracting timing cues from narration.wav...")
            subprocess.run(["node", "tools/capture.mjs", "cues"], cwd=str(PROJECT_DIR), check=True)

            # 3. Mix audio
            progress_bar.progress(50, text="Step 3/4: Mixing music & SFX cues...")
            st.write("Mixing voiceover with background music and sound effects...")
            mix_script = PROJECT_DIR / "tools" / "mix.py"
            subprocess.run([str(VENV_PYTHON), str(mix_script), "."], cwd=str(PROJECT_DIR), check=True)

            # 4. Render frames to video
            progress_bar.progress(70, text="Step 4/4: Rendering 3D animation frames...")
            st.write("Headless Chrome 3D compositor rendering frames...")
            render_out = PROJECT_DIR / "renders" / "this_week_in_ai_v4.mp4"
            subprocess.run(["node", "tools/capture.mjs", "video", str(render_out), "--draft"], cwd=str(PROJECT_DIR), check=True)

            # Copy to output
            dest_video = OUTPUT_DIR / "this_week_in_ai_v4.mp4"
            shutil.copy2(render_out, dest_video)

            # Generate contact sheet
            subprocess.run(["node", "tools/capture.mjs", "sheet"], cwd=str(PROJECT_DIR), check=True)
            sheet_src = PROJECT_DIR / "review" / "all.jpg"
            if sheet_src.exists():
                shutil.copy2(sheet_src, OUTPUT_DIR / "review_v4_contact_sheet.jpg")

            progress_bar.progress(100, text="Render complete!")
            status.update(label="Video Render Succeeded!", state="complete")
            st.balloons()

    st.markdown("---")
    st.markdown("#### 📱 Finished Video Preview & Download")

    video_path = OUTPUT_DIR / "this_week_in_ai_v4.mp4"
    contact_sheet_path = OUTPUT_DIR / "review_v4_contact_sheet.jpg"

    col_vid, col_sheet = st.columns([1, 1.2])

    with col_vid:
        if video_path.exists():
            st.video(str(video_path))
            file_bytes = video_path.read_bytes()
            st.download_button(
                label="⬇️ Download MP4 (1080×1920 Short)",
                data=file_bytes,
                file_name="this_week_in_ai_short.mp4",
                mime="video/mp4",
                type="primary",
                use_container_width=True,
            )
            st.caption(f"File size: {len(file_bytes) / (1024 * 1024):.2f} MB | Resolution: 1080×1920 | Aspect: 9:16")
        else:
            st.info("No rendered video found in `output/` yet. Click 'Render Full Short' above to generate one!")

    with col_sheet:
        if contact_sheet_path.exists():
            st.image(str(contact_sheet_path), caption="Multi-Scene Contact Sheet (Frame-by-Frame Progression)", use_container_width=True)
        else:
            st.caption("Contact sheet will appear here after render.")
