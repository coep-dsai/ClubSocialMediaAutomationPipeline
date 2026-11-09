"""COEP Data Science and AI Club — Autonomous Shorts Studio.

A lightweight, zero-cost ($0) web dashboard built with Streamlit.
Enables club members to:
1. Browse and scrape weekly AI news with virality scoring (supports custom keywords like NVIDIA, Sthanika, OpenAI).
2. Select any story to auto-generate a 100% tailored viral script with a 0-2s hook and fast 17 cuts.
3. Switch dynamically between 7 3D visual styles (Tall Tale, Deep Dive, Inside Out, Stick Story, Night File, Paper Atlas, Neon Explainer) and voices.
4. Synthesize studio-grade voiceover with frame-accurate WordBoundary sync.
5. Render and preview 1080x1920 vertical MP4 shorts with dynamic video cataloging & direct download.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import streamlit as st

from agents.audio_agent import AudioAgent
from agents.news_agent import AINewsScraper, NewsScraperAgent
from agents.script_agent import ScriptAgent
from agents.style_agent import StyleAgent, STYLES as ALL_STYLES

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_ROOT / "output"
SCRAPER_CACHE = OUTPUT_DIR / "latest_ai_news.json"
VENV_PYTHON = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

style_agent = StyleAgent(workspace_root=PROJECT_ROOT)

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
        padding: 18px;
        border: 1px solid #334155;
        margin-bottom: 14px;
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
@st.cache_data(ttl=1800)
def load_cached_news() -> List[Dict[str, Any]]:
    if SCRAPER_CACHE.exists():
        try:
            return json.loads(SCRAPER_CACHE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return run_news_scraper()


def run_news_scraper(query: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        scraper = AINewsScraper(data_dir=OUTPUT_DIR)
        stories = scraper.fetch_all_stories(query=query)
        st.cache_data.clear()
        return stories
    except Exception as e:
        st.error(f"Scraper error: {e}")
        return []


def get_active_project_dir(style_id: Optional[str] = None) -> Path:
    """Dynamically resolves or scaffolds the project directory for the chosen style."""
    sid = style_id or st.session_state.get("selected_style_id", "neon-explainer")
    if sid == "neon-explainer":
        return PROJECT_ROOT / "projects" / "this_week_in_ai"

    norm_name = sid.replace("-", "_")
    candidates = [
        PROJECT_ROOT / "projects" / f"{norm_name}_project",
        PROJECT_ROOT / "projects" / f"{sid}_project",
        PROJECT_ROOT / "projects" / f"{norm_name}_demo",
        PROJECT_ROOT / "projects" / f"{sid}_demo",
    ]
    target_dir = None
    for c in candidates:
        if c.exists() and (c / "index.html").exists():
            target_dir = c
            break

    if not target_dir:
        target_dir = PROJECT_ROOT / "projects" / f"{norm_name}_project"
        style_agent.scaffold_project(sid, f"{norm_name}_project")

    # Ensure updated master mix.py and resilient timing.js are installed in target_dir
    master_mix = PROJECT_ROOT / "projects" / "this_week_in_ai" / "tools" / "mix.py"
    dest_mix = target_dir / "tools" / "mix.py"
    if master_mix.exists():
        if not dest_mix.exists() or dest_mix.stat().st_size != master_mix.stat().st_size:
            dest_mix.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(master_mix, dest_mix)

    master_timing = PROJECT_ROOT / "projects" / "this_week_in_ai" / "src" / "core" / "timing.js"
    dest_timing = target_dir / "src" / "core" / "timing.js"
    if master_timing.exists():
        if not dest_timing.exists() or dest_timing.stat().st_size != master_timing.stat().st_size:
            dest_timing.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(master_timing, dest_timing)

    return target_dir


def load_project_script(project_dir: Optional[Path] = None) -> Dict[str, Any]:
    pdir = project_dir or get_active_project_dir()
    script_file = pdir / "script.json"
    if script_file.exists():
        try:
            return json.loads(script_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    fallback_file = PROJECT_ROOT / "projects" / "this_week_in_ai" / "script.json"
    if fallback_file.exists():
        try:
            return json.loads(fallback_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "title": "This Week In AI: Breakthrough Story",
        "voice": "en-US-GuyNeural",
        "speed": 1.10,
        "lead": 0.30,
        "outro": 0.90,
        "gap": 0.20,
        "music": "synthwave",
        "lines": [
            {"text": "This week, a new AI breakthrough just stunned researchers,"},
            {"text": "disrupting what was thought possible with current models."},
        ],
    }


def save_project_script(script_data: Any, project_dir: Optional[Path] = None):
    pdir = project_dir or get_active_project_dir()
    script_file = pdir / "script.json"
    script_file.parent.mkdir(parents=True, exist_ok=True)

    if hasattr(script_data, "model_dump"):
        raw_dict = script_data.model_dump(by_alias=True, exclude_none=True)
    elif hasattr(script_data, "dict"):
        raw_dict = script_data.dict(by_alias=True, exclude_none=True)
    elif isinstance(script_data, dict):
        raw_dict = script_data
    else:
        raw_dict = dict(script_data)

    script_file.write_text(json.dumps(raw_dict, indent=2), encoding="utf-8")
    # Mirror to this_week_in_ai as default project fallback
    fallback_file = PROJECT_ROOT / "projects" / "this_week_in_ai" / "script.json"
    if pdir != fallback_file.parent:
        fallback_file.parent.mkdir(parents=True, exist_ok=True)
        fallback_file.write_text(json.dumps(raw_dict, indent=2), encoding="utf-8")


def scan_rendered_videos() -> List[Dict[str, Any]]:
    """Dynamically scans output/ directory for all MP4 files and their metadata."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_mp4s = list(OUTPUT_DIR.glob("*.mp4"))
    if not all_mp4s:
        return []

    # Exclude duplicate latest_short.mp4 if named versions exist
    if len(all_mp4s) > 1:
        mp4_files = [p for p in all_mp4s if p.name != "latest_short.mp4"]
    else:
        mp4_files = all_mp4s

    # Sort by mtime descending (freshest on top)
    mp4_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

    records = []
    for mp4_path in mp4_files:
        meta_path = OUTPUT_DIR / f"{mp4_path.name}.meta.json"
        size_mb = round(mp4_path.stat().st_size / (1024 * 1024), 1)
        mod_dt = datetime.fromtimestamp(mp4_path.stat().st_mtime)
        time_str = mod_dt.strftime("%b %d, %I:%M %p")

        meta = {}
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                pass

        icon = meta.get("style_icon") or "🎬"
        title = meta.get("title") or mp4_path.stem.replace("_", " ").replace("-", " ").title()
        style_label = meta.get("style_name") or "3D Short"

        label = f"{icon} {title} [{style_label} • {size_mb} MB • {time_str}]"

        # Find matching sheet
        sheet_name = meta.get("sheet_filename")
        sheet_path = OUTPUT_DIR / sheet_name if sheet_name else None
        if not sheet_path or not sheet_path.exists():
            candidates = [
                OUTPUT_DIR / f"{mp4_path.stem}_sheet.jpg",
                OUTPUT_DIR / f"{mp4_path.stem}.jpg",
                OUTPUT_DIR / "latest_contact_sheet.jpg",
                OUTPUT_DIR / "review_v4_contact_sheet.jpg",
            ]
            for c in candidates:
                if c.exists():
                    sheet_path = c
                    break

        records.append({
            "label": label,
            "filename": mp4_path.name,
            "path": mp4_path,
            "sheet_path": sheet_path,
            "title": title,
            "style_label": style_label,
            "size_mb": size_mb,
            "time_str": time_str,
            "meta": meta,
        })
    return records


# ── Sidebar Controls ────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🎛️ Pipeline Presets")

    STYLE_CHOICES = {
        f"{s.icon} {s.name} ({s.badge})": s.id
        for s in ALL_STYLES.values()
    }
    selected_style_label = st.selectbox(
        "Visual Style Engine",
        options=list(STYLE_CHOICES.keys()),
        index=0,
        help="Select any of the 6 official Faceless Shorts styles or the COEP Neon Explainer.",
    )
    selected_style_id = STYLE_CHOICES[selected_style_label]
    st.session_state["selected_style_id"] = selected_style_id
    selected_style_def = ALL_STYLES[selected_style_id]
    active_proj_dir = get_active_project_dir(selected_style_id)

    st.caption(f"**{selected_style_def.name}**: {selected_style_def.tagline}")
    st.caption(f"📁 Workspace: `projects/{active_proj_dir.name}`")

    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("Apply Style", use_container_width=True):
            curr = load_project_script()
            save_project_script(curr, active_proj_dir)
            st.session_state["active_theme_id"] = selected_style_id
            st.success(f"Activated {selected_style_def.name} in `projects/{active_proj_dir.name}`!")
    with col_btn2:
        if st.button("🏗️ Scaffold", use_container_width=True, help="Clone full template into projects/"):
            try:
                norm = selected_style_id.replace("-", "_")
                scaffold_path = style_agent.scaffold_project(selected_style_id, f"{norm}_project")
                curr = load_project_script()
                save_project_script(curr, scaffold_path)
                st.success(f"Scaffolded to `projects/{norm}_project`!")
            except Exception as e:
                st.error(f"Scaffolding failed: {e}")

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
        options=["synthwave", "bounce", "chill", "tension"],
        index=0,
        help="Procedural synth music dynamically generated without external dependencies.",
    )

    st.markdown("---")
    st.markdown("### 🏷️ Club Identity")
    show_watermark = st.checkbox("Show '⚡ DSAI COEP' Header Pill", value=True)
    club_handle = st.text_input("Club Social Handle", value="@dsai_coep")

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
    st.write("Scrapes Google News RSS, Hacker News Algolia API, and Hugging Face Daily Papers. Enter any keyword (e.g. `Sthanika`, `NVIDIA`, `Blackwell`, `OpenAI`, `Perplexity`) to discover fresh breaking stories.")

    col_search, col_btn, col_min_score = st.columns([2.5, 1.2, 1.3])
    with col_search:
        search_query = st.text_input("Topic / Keyword Search", placeholder="e.g. Sthanika, Jev, NVIDIA, Claude, DeepSeek...")
    with col_btn:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        scrape_clicked = st.button("⚡ Scrape News", type="primary", use_container_width=True)
    with col_min_score:
        min_score = st.slider("Min Virality Score", 4.0, 10.0, 6.0, 0.5)

    if scrape_clicked:
        with st.spinner(f"Scraping live stories for '{search_query or 'General AI'}'..."):
            stories = run_news_scraper(query=search_query)
            st.session_state["scraped_stories"] = stories
            st.success(f"Discovered {len(stories)} stories!")
    elif "scraped_stories" in st.session_state:
        stories = st.session_state["scraped_stories"]
    else:
        stories = load_cached_news()

    # Filter stories
    filtered_stories = []
    for s in stories:
        score_val = s.get("virality_score") or s.get("score") or 0.0
        if score_val >= min_score:
            if not search_query or search_query.lower() in s.get("title", "").lower() or search_query.lower() in s.get("summary", "").lower():
                filtered_stories.append(s)

    st.caption(f"Displaying {len(filtered_stories)} stories matching query (sorted by virality score):")

    # Render stories as cards
    for idx, story in enumerate(filtered_stories):
        v_score = story.get("virality_score") or story.get("score") or 7.0
        score_badge = f'<span class="badge-pill badge-{"green" if v_score >= 8.0 else "cyan"}">Virality: {v_score:.1f}/10</span>'
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
                if st.button("⚡ Use For Video", key=f"use_story_{idx}"):
                    # 1. Update session state with this specific story
                    st.session_state["selected_story"] = story

                    # 2. Automatically generate the tailored 17-cut script
                    agent = ScriptAgent()
                    tailored = agent.generate_script_from_story(
                        story_title=story.get("title", ""),
                        story_summary=story.get("summary", ""),
                        source=story.get("source", "AI News"),
                    )
                    tailored.voice = selected_voice_code
                    tailored.speed = round(1.0 + (speed_percent / 100.0), 2)
                    tailored.music = bg_music

                    # Save to currently active project workspace
                    active_proj = get_active_project_dir(selected_style_id)
                    save_project_script(tailored, active_proj)

                    # 3. Invalidate editor cache and trigger immediate UI refresh
                    st.session_state["script_version"] = st.session_state.get("script_version", 0) + 1
                    st.success(f"Generated tailored script for '{story.get('title')[:45]}...' in {active_proj.name}!")
                    time.sleep(0.3)
                    st.rerun()

            with col_link:
                if story.get("url"):
                    st.markdown(f"<a href='{story.get('url')}' target='_blank' style='font-size: 13px; color: #38BDF8;'>🔗 View Original Source Article</a>", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════
# TAB 2: SCRIPT & STORYBOARD STUDIO
# ═════════════════════════════════════════════════════════════════════════
with tabs[1]:
    st.markdown("### ✍️ Script & Storyboard Studio")
    st.write("Inspect, edit, or customize the camera cuts. Every cut is dynamically timed and auto-synchronized with the audio voiceover.")

    active_proj = get_active_project_dir(selected_style_id)
    current_script = load_project_script(active_proj)

    # Context alert if story is selected
    sel = st.session_state.get("selected_story")
    if sel:
        st.info(f"📌 Active Story Context: **{sel.get('title')}** (Source: {sel.get('source')})")
        if st.button("🔄 Re-generate Dynamic Script for Active Story"):
            agent = ScriptAgent()
            tailored = agent.generate_script_from_story(
                story_title=sel.get("title", ""),
                story_summary=sel.get("summary", ""),
                source=sel.get("source", "AI News"),
            )
            tailored.voice = selected_voice_code
            tailored.speed = round(1.0 + (speed_percent / 100.0), 2)
            tailored.music = bg_music
            save_project_script(tailored, active_proj)
            st.session_state["script_version"] = st.session_state.get("script_version", 0) + 1
            st.rerun()

    col_title, col_pace = st.columns([3, 1])
    with col_title:
        title_input = st.text_input("Short Title / Topic", value=current_script.get("title", "This Week In AI"))
    with col_pace:
        st.caption(f"Current Voice: `{selected_voice_code}`")
        st.caption(f"Speech Rate: `+{speed_percent}%`")
        st.caption(f"Music: `{bg_music}`")

    lines = current_script.get("lines", [])
    st.markdown(f"#### 🎬 Storyboard Cuts ({len(lines)} Synchronized Cuts in `{active_proj.name}`)")
    df_lines = pd.DataFrame([
        {
            "Cut #": f"S{i:02d}",
            "Spoken Line Text": ln.get("text", ""),
            "Pause After (s)": float(ln.get("gap", 0.22)),
        }
        for i, ln in enumerate(lines)
    ])

    # Dynamic key ensures cache bust when new story is picked
    editor_key = f"script_editor_{st.session_state.get('script_version', 0)}"
    edited_df = st.data_editor(
        df_lines,
        key=editor_key,
        use_container_width=True,
        num_rows="dynamic",
        column_config={
            "Cut #": st.column_config.TextColumn(disabled=True, width="small"),
            "Spoken Line Text": st.column_config.TextColumn(width="large", required=True),
            "Pause After (s)": st.column_config.NumberColumn(min_value=0.0, max_value=2.0, step=0.05, width="small"),
        }
    )

    col_save, col_spacer = st.columns([2, 8])
    with col_save:
        if st.button("💾 Save Script to Engine (`script.json`)", type="primary"):
            updated_lines = []
            for _, row in edited_df.iterrows():
                text_val = str(row["Spoken Line Text"]).strip()
                gap_val = float(row.get("Pause After (s)", 0.22))
                if text_val:
                    updated_lines.append({"text": text_val, "gap": gap_val})
            save_data = {
                "title": title_input,
                "voice": selected_voice_code,
                "speed": round(1.0 + (speed_percent / 100.0), 2),
                "lead": 0.30,
                "outro": 0.90,
                "gap": 0.20,
                "music": bg_music,
                "lines": updated_lines,
            }
            save_project_script(save_data, active_proj)
            st.success(f"Saved {len(updated_lines)} cuts to `{active_proj.name}/script.json`!")

    st.markdown("---")
    st.markdown("#### 🤖 Antigravity Pair Programmer Autonomous Director Prompt")
    st.caption("Copy this prompt to have Antigravity autonomously direct, write custom Three.js scenes, and render this short:")

    story_obj = sel if sel else {
        "title": title_input,
        "summary": " ".join([l.get("text", "") for l in lines[:4]]),
        "source": "AI Community News",
        "url": "",
    }
    director_prompt = style_agent.generate_director_prompt(
        story=story_obj,
        style_id=selected_style_id,
        club_handle=club_handle,
        target_duration=40,
    )
    st.text_area(
        "📋 Copyable Antigravity Director Prompt",
        value=director_prompt,
        height=320,
        help="Click inside, press Ctrl+A, then Ctrl+C to copy directly into chat!",
    )


# ═════════════════════════════════════════════════════════════════════════
# TAB 3: STYLE & AUDIO CUSTOMIZER
# ═════════════════════════════════════════════════════════════════════════
with tabs[2]:
    st.markdown("### 🎨 Visual & Acoustic Engine Configuration")

    active_proj = get_active_project_dir(selected_style_id)

    st.markdown(f"#### 🌟 Active 3D Style Engine: **{selected_style_def.icon} {selected_style_def.name}**")
    st.markdown(
        f"<span class='badge-pill badge-green'>{selected_style_def.badge}</span> "
        f"<span style='color: #94A3B8; font-size: 14px; margin-left: 8px;'>{selected_style_def.tagline}</span>",
        unsafe_allow_html=True,
    )

    col_s1, col_s2 = st.columns(2)
    with col_s1:
        st.markdown(f"#### 🎬 3D Multi-Scene Architecture ({selected_style_def.name})")
        if selected_style_def.scenes:
            for sc in selected_style_def.scenes:
                st.markdown(f"- {sc}")
        else:
            st.markdown("- Dynamic multi-scene camera shifts adapted to story cut boundaries.")

        st.markdown("##### 🎭 Character, Sets & Caption Typography")
        st.markdown(f"- **Characters:** {selected_style_def.characters}")
        st.markdown(f"- **World / Sets:** {selected_style_def.world}")
        st.markdown(f"- **Captions & Subtitles:** {selected_style_def.captions}")
        st.markdown(f"- **Best Topics:** {selected_style_def.best_topics}")

    with col_s2:
        st.markdown("#### 🔊 Live Audio Pipeline Parameters")
        st.markdown(f"""
        - **Active Voice Model:** `{selected_voice_code}` ({selected_voice_name})
        - **Speaking Speed Rate:** `+{speed_percent}%` (Natural conversational flow with ample animation view time)
        - **Background Soundtrack:** `{bg_music}` (Procedurally mixed with ducking)
        - **Club Social Handle:** `{club_handle}` (Rendered on Outro Card & Header Pill)
        - **Active Project Workspace:** `projects/{active_proj.name}`
        - **Cadence Protocol:** Sentence-level continuous synthesis with bit-exact WAV silence concatenation
        - **Timestamp Sync:** Microsoft Speech native `WordBoundary` events mapped to script tokens
        """)

    st.markdown("---")
    st.markdown("### 🏛️ Complete Visual Style Architecture Catalog")
    st.write("Browse all 6 authentic Faceless Shorts styles plus the custom COEP Neon Explainer. Each style features distinct character rigs, 3D worlds, caption typography, and procedural foley.")

    style_cols = st.columns(3)
    for idx, (s_key, s_item) in enumerate(ALL_STYLES.items()):
        col_target = style_cols[idx % 3]
        is_selected = (s_key == selected_style_id)
        border_style = "2px solid #38BDF8" if is_selected else "1px solid #334155"
        with col_target:
            st.markdown(f"""
            <div class="news-card" style="height: 380px; overflow-y: auto; border: {border_style};">
                <h4 style="margin: 0; color: #38BDF8;">{s_item.icon} {s_item.name} {'(ACTIVE)' if is_selected else ''}</h4>
                <div style="margin: 6px 0;"><span class="badge-pill badge-green">{s_item.badge}</span></div>
                <p style="font-size: 13px; color: #F1F5F9; margin-bottom: 6px;"><b>Visual Look:</b> {s_item.visual_look}</p>
                <p style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;"><b>Characters:</b> {s_item.characters}</p>
                <p style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;"><b>World / Sets:</b> {s_item.world}</p>
                <p style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;"><b>Captions:</b> {s_item.captions}</p>
                <p style="font-size: 12px; color: #CBD5E1; margin-bottom: 4px;"><b>Best Topics:</b> {s_item.best_topics}</p>
            </div>
            """, unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════
# TAB 4: RENDER STUDIO & PREVIEW
# ═════════════════════════════════════════════════════════════════════════
with tabs[3]:
    st.markdown("### 🎬 Render Studio & In-Browser Player")
    st.write("Generate audio, calculate frame cues, render 3D scenes via Chrome headless compositor, and preview or download the finished MP4.")

    active_proj = get_active_project_dir(selected_style_id)
    curr_script_info = load_project_script(active_proj)
    st.info(f"Target Video Script: **{curr_script_info.get('title', 'This Week In AI')}** ({len(curr_script_info.get('lines', []))} cuts in `projects/{active_proj.name}`)")

    col_render_btn, col_check_btn = st.columns([2, 2])
    with col_render_btn:
        start_render = st.button("🚀 Render Full 1080×1920 Short", type="primary", use_container_width=True)
    with col_check_btn:
        start_check = st.button("🔍 Check Timing & Captions Only", use_container_width=True)

    if start_check:
        with st.status(f"Verifying Script and Frame Cues for {selected_style_def.name}...", expanded=True) as status:
            st.write(f"Running audio agent synthesis in `projects/{active_proj.name}`...")
            audio_agent = AudioAgent()
            rate_arg = f"+{speed_percent}%"
            try:
                audio_agent.synthesize_project(active_proj, voice=selected_voice_code, rate=rate_arg)
                st.write("Voiceover synthesized successfully.")
            except Exception as e:
                st.error(f"Audio Agent Error: {e}")
                st.stop()

            st.write("Running headless Chrome syntax & timing check...")
            res_check = subprocess.run(["node", "tools/capture.mjs", "check"], cwd=str(active_proj), capture_output=True, text=True)
            if res_check.returncode != 0:
                st.error(f"Engine Check Error:\n{res_check.stderr or res_check.stdout}")
                st.stop()
            st.text(res_check.stdout.strip())
            status.update(label="Timing & Cues Verification Complete!", state="complete")

    if start_render:
        active_proj = get_active_project_dir(selected_style_id)

        # 0. Sync script settings
        current_script = load_project_script(active_proj)
        current_script["voice"] = selected_voice_code
        current_script["speed"] = round(1.0 + (speed_percent / 100.0), 2)
        current_script["music"] = bg_music
        save_project_script(current_script, active_proj)

        title_str = current_script.get("title", "ai_short")
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", title_str.lower()).strip("_")[:36]
        if not slug:
            slug = "ai_news_short"
        ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        video_filename = f"{selected_style_id}_{slug}_{ts_str}.mp4"
        sheet_filename = f"{selected_style_id}_{slug}_{ts_str}_sheet.jpg"

        progress_bar = st.progress(0, text="Starting render pipeline...")
        with st.status(f"Executing Video Generation Pipeline ({selected_style_def.name})...", expanded=True) as status:
            # 1. Synthesize audio
            progress_bar.progress(15, text=f"Step 1/4: Synthesizing voiceover with {selected_voice_code} at +{speed_percent}%...")
            st.write(f"Synthesizing voiceover for {len(current_script.get('lines', []))} cuts...")
            audio_agent = AudioAgent()
            rate_arg = f"+{speed_percent}%"
            try:
                audio_agent.synthesize_project(active_proj, voice=selected_voice_code, rate=rate_arg)
                st.write(f"Voiceover synthesized into `{active_proj.name}/data/narration.wav`.")
            except Exception as e:
                st.error(f"Audio Synthesis Failed: {e}")
                st.stop()

            # 2. Extract cues
            progress_bar.progress(35, text="Step 2/4: Extracting audio cues...")
            st.write("Extracting timing cues from narration.wav...")
            res_cues = subprocess.run(["node", "tools/capture.mjs", "cues"], cwd=str(active_proj), capture_output=True, text=True)
            if res_cues.returncode != 0:
                st.error(f"Cues Extraction Failed:\n{res_cues.stderr or res_cues.stdout}")
                st.stop()
            st.write(res_cues.stdout.strip())

            # 3. Mix audio
            progress_bar.progress(50, text="Step 3/4: Mixing music & SFX cues...")
            st.write(f"Mixing voiceover with procedural '{bg_music}' music and sound effects...")
            mix_script = active_proj / "tools" / "mix.py"
            res_mix = subprocess.run([str(VENV_PYTHON), str(mix_script), "."], cwd=str(active_proj), capture_output=True, text=True)
            if res_mix.returncode != 0:
                st.error(f"Audio Mix Failed:\n{res_mix.stderr or res_mix.stdout}")
                st.stop()
            st.write(res_mix.stdout.strip())

            # 4. Render frames to video
            progress_bar.progress(70, text=f"Step 4/4: Rendering {selected_style_def.name} 3D animation frames...")
            st.write(f"Headless Chrome 3D compositor rendering {video_filename}...")
            (active_proj / "renders").mkdir(parents=True, exist_ok=True)
            render_out = active_proj / "renders" / video_filename
            res_video = subprocess.run(["node", "tools/capture.mjs", "video", str(render_out), "--draft"], cwd=str(active_proj), capture_output=True, text=True)
            if res_video.returncode != 0:
                st.error(f"Video Render Failed:\n{res_video.stderr or res_video.stdout}")
                st.stop()

            # Copy to output and record render timestamp
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            dest_video = OUTPUT_DIR / video_filename
            shutil.copy2(render_out, dest_video)
            shutil.copy2(render_out, OUTPUT_DIR / "latest_short.mp4")

            # Generate contact sheet
            subprocess.run(["node", "tools/capture.mjs", "sheet"], cwd=str(active_proj), capture_output=True, text=True)
            sheet_src = active_proj / "review" / "all.jpg"
            has_sheet = False
            if sheet_src.exists():
                shutil.copy2(sheet_src, OUTPUT_DIR / sheet_filename)
                shutil.copy2(sheet_src, OUTPUT_DIR / "latest_contact_sheet.jpg")
                has_sheet = True

            # Write metadata sidecar JSON
            meta_info = {
                "title": title_str,
                "style_id": selected_style_id,
                "style_name": selected_style_def.name,
                "style_icon": selected_style_def.icon,
                "style_badge": selected_style_def.badge,
                "voice": selected_voice_code,
                "speed": f"+{speed_percent}%",
                "music": bg_music,
                "cuts_count": len(current_script.get("lines", [])),
                "timestamp": datetime.now().isoformat(),
                "rendered_time_display": datetime.now().strftime("%I:%M:%S %p"),
                "filename": video_filename,
                "sheet_filename": sheet_filename if has_sheet else None,
                "size_mb": round(dest_video.stat().st_size / (1024 * 1024), 2),
            }
            (OUTPUT_DIR / f"{video_filename}.meta.json").write_text(json.dumps(meta_info, indent=2), encoding="utf-8")
            (OUTPUT_DIR / "latest_short.mp4.meta.json").write_text(json.dumps(meta_info, indent=2), encoding="utf-8")

            st.session_state["selected_video_filename"] = video_filename
            st.session_state["last_render_time"] = datetime.now().strftime("%I:%M:%S %p")

            progress_bar.progress(100, text="Render complete!")
            status.update(label=f"Short Rendered Successfully: {video_filename}", state="complete")
            st.balloons()

    st.markdown("---")
    st.markdown("#### 📱 Finished Video Preview & Download")

    video_records = scan_rendered_videos()

    if video_records:
        label_map = {rec["label"]: rec for rec in video_records}
        # Find default index: if selected_video_filename in session state, find its position
        default_idx = 0
        target_filename = st.session_state.get("selected_video_filename")
        if target_filename:
            for idx_rec, rec in enumerate(video_records):
                if rec["filename"] == target_filename:
                    default_idx = idx_rec
                    break

        chosen_video_label = st.selectbox(
            "Select Rendered Short to Watch & Download",
            options=list(label_map.keys()),
            index=default_idx,
            help="All MP4 files detected dynamically in output/ directory, sorted newest first.",
        )
        chosen_rec = label_map[chosen_video_label]
        video_path = chosen_rec["path"]
        contact_sheet_path = chosen_rec["sheet_path"]
    else:
        chosen_rec = None
        video_path = OUTPUT_DIR / "latest_short.mp4"
        contact_sheet_path = OUTPUT_DIR / "latest_contact_sheet.jpg"

    col_vid, col_sheet = st.columns([1, 1.2])

    with col_vid:
        if video_path.exists():
            file_bytes = video_path.read_bytes()
            st.video(file_bytes)
            st.download_button(
                label=f"⬇️ Download MP4 ({video_path.name})",
                data=file_bytes,
                file_name=video_path.name,
                mime="video/mp4",
                type="primary",
                use_container_width=True,
            )
            render_ts = st.session_state.get("last_render_time", "Recent Render")
            st.caption(f"Status: Rendered ({render_ts}) | File: `{video_path.name}` | Size: {len(file_bytes) / (1024 * 1024):.2f} MB | Aspect: 9:16 (1080×1920)")
        else:
            st.info("No rendered video found in `output/` yet. Click 'Render Full Short' above to generate one!")

    with col_sheet:
        if contact_sheet_path and contact_sheet_path.exists():
            sheet_bytes = contact_sheet_path.read_bytes()
            st.image(sheet_bytes, caption=f"Contact Sheet: {contact_sheet_path.name}", use_container_width=True)
        else:
            st.caption("Contact sheet will appear here after render.")
