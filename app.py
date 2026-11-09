"""COEP Data Science and AI Club — Autonomous Shorts Studio.

A lightweight, zero-cost ($0) web dashboard built with Streamlit.
Enables club members to:
1. Browse and scrape weekly AI news with virality scoring (supports custom keywords like NVIDIA, Sthanika, OpenAI).
2. Select any story to auto-generate a 100% tailored viral script with a 0-2s hook and fast 17 cuts.
3. Switch between 3D visual styles (Neon Cyber, Deep Space Noir, Clean Emerald, Red Alert) and voices.
4. Synthesize studio-grade voiceover with frame-accurate WordBoundary sync.
5. Render and preview 1080x1920 vertical MP4 shorts with live, cache-busted playback & direct download.
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

from agents.news_agent import AINewsScraper, NewsScraperAgent
from agents.script_agent import ScriptAgent
from agents.style_agent import StyleAgent, STYLES as ALL_STYLES

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent
PROJECT_DIR = PROJECT_ROOT / "projects" / "this_week_in_ai"
OUTPUT_DIR = PROJECT_ROOT / "output"
SCRAPER_CACHE = OUTPUT_DIR / "latest_ai_news.json"
VENV_PYTHON = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

style_agent = StyleAgent(workspace_root=PROJECT_ROOT)

# Available Visual Styles (100% verified compatible with This Week in AI pipeline)
STYLES = {
    "Neon Cyber 3D (Electric Blue & Cyan)": {
        "id": "neon-explainer",
        "primary": "#00F0FF",
        "accent": "#38BDF8",
        "desc": "Pulsing server farm, 3D Neural Net architecture, Gold Trophy Podium, Accelerator Highway, Battery Dial, & Club Watermark.",
        "badge": "⚡ Recommended",
    },
    "Deep Space Noir 3D (Gold & Amber Cinema)": {
        "id": "deep-space-noir",
        "primary": "#FACC15",
        "accent": "#F59E0B",
        "desc": "Ultra-dark space void, amber/gold laser wireframes, deep camera depth-of-field, and dramatic high-contrast lighting.",
        "badge": "🌌 Cinematic Noir",
    },
    "Clean Emerald Tech 3D (Emerald & Platinum)": {
        "id": "clean-emerald",
        "primary": "#10B981",
        "accent": "#34D399",
        "desc": "Sleek graphite & emerald green lab aesthetic, clinical wireframe grids, and bright data visualization HUDs.",
        "badge": "🌿 Clean Tech",
    },
    "Red Alert Crisis 3D (Crimson & Hazard)": {
        "id": "red-alert",
        "primary": "#EF4444",
        "accent": "#F87171",
        "desc": "Ominous red emergency strobes, high-contrast warning cards, and dramatic cluster disruption visuals.",
        "badge": "🚨 Crisis Alert",
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
            {"text": "This week, a new AI breakthrough just stunned researchers,"},
            {"text": "disrupting what was thought possible with current models."},
        ]
    }


def save_project_script(script_dict: Dict[str, Any]):
    script_file = PROJECT_DIR / "script.json"
    script_file.parent.mkdir(parents=True, exist_ok=True)
    script_file.write_text(json.dumps(script_dict, indent=2), encoding="utf-8")


def switch_style(style_id: str) -> bool:
    """Switch project's active shots.js to selected style preset."""
    src_shots = PROJECT_DIR / "src" / "shots.js"
    presets_dir = PROJECT_DIR / "presets"
    preset_file = presets_dir / f"{style_id}.js"

    if preset_file.exists():
        shutil.copy2(preset_file, src_shots)
        st.session_state["active_theme_id"] = style_id
        return True
    return False


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
    selected_style_def = ALL_STYLES[selected_style_id]
    st.caption(f"**{selected_style_def.name}**: {selected_style_def.tagline}")

    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("Apply Style", use_container_width=True):
            if switch_style(selected_style_id):
                st.success(f"Activated {selected_style_def.name}!")
            else:
                st.info(f"Loaded {selected_style_def.name} settings.")
    with col_btn2:
        if st.button("🏗️ Scaffold", use_container_width=True, help="Clone full template into projects/"):
            try:
                scaffold_path = style_agent.scaffold_project(selected_style_id, f"{selected_style_id}_demo")
                st.success(f"Scaffolded to `projects/{selected_style_id}_demo`!")
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
        options=["bounce", "chill", "synthwave"],
        index=0,
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
                    agent.save_script(tailored, PROJECT_DIR / "script.json")

                    # 3. Invalidate editor cache and trigger immediate UI refresh
                    st.session_state["script_version"] = st.session_state.get("script_version", 0) + 1
                    st.success(f"Generated tailored script for '{story.get('title')[:45]}...'!")
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
    st.write("Inspect, edit, or customize the 17 camera cuts. Every cut is dynamically timed and auto-synchronized with the audio voiceover.")

    current_script = load_project_script()

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
            agent.save_script(tailored, PROJECT_DIR / "script.json")
            st.session_state["script_version"] = st.session_state.get("script_version", 0) + 1
            st.rerun()

    col_title, col_pace = st.columns([3, 1])
    with col_title:
        title_input = st.text_input("Short Title / Topic", value=current_script.get("title", "This Week In AI"))
    with col_pace:
        st.caption(f"Current Voice: `{selected_voice_code}`")
        st.caption(f"Speech Rate: `+{speed_percent}%`")

    st.markdown("#### 🎬 Storyboard Cuts (17 Synchronized Cuts)")
    lines = current_script.get("lines", [])
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

    st.markdown("---")
    st.markdown("### 📋 Antigravity Director Prompt Generator (Autonomous Agent Mode)")
    st.write(
        "Copy this prompt and paste it directly into your Antigravity chat with **Gemini 3.8 Flash High**. "
        "The prompt instructs the agent to autonomously scaffold, script, code Three.js character animations in `shots.js`, "
        "mix procedural foley, and render your video using the faceless-shorts skill."
    )
    active_story_context = st.session_state.get("selected_story", {
        "title": current_script.get("title", "A Massive Breakthrough in Artificial Intelligence"),
        "summary": " ".join([ln.get("text", "") for ln in current_script.get("lines", [])]),
        "source": "AI Research & Industry Radar",
        "url": "https://coep-dsai.org",
    })
    director_prompt = style_agent.generate_director_prompt(
        story=active_story_context,
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

    active_id = st.session_state.get("active_theme_id", "neon-explainer")
    active_style_match = [k for k, v in STYLES.items() if v["id"] == active_id]
    active_title = active_style_match[0] if active_style_match else "Neon Cyber 3D"

    st.markdown(f"#### 🌟 Active 3D Theme: **{active_title}**")
    st.info(f"Theme Details: {STYLES.get(active_title, {}).get('desc')}")

    col_s1, col_s2 = st.columns(2)
    with col_s1:
        st.markdown("#### 🎬 3D Multi-Scene Architecture")
        st.markdown("""
        - **Scene 1: The Duel** — Workstation Laptop vs ominous Supercomputer tower with alert LEDs.
        - **Scene 2: The Server Farm** — Receding monolith server aisles with flashing cyan and emerald rack LEDs.
        - **Scene 3: 3D Neural Network** — Fully framed 4-layer multi-layer perceptron with pulsing synaptic rewiring.
        - **Scene 4: Benchmark Podium** — 3D Gold Championship Trophy Cup, 3-tiered podium, and animated bar chart.
        - **Scene 5: High-Speed & Eco HUD** — Rushing accelerator highway grid, 70X speedometer gauge, and 3D green eco battery cell.
        - **Scene 6: Everyday Workstation** — Desk with terminal code execution log and global turning point announcement.
        """)

    with col_s2:
        st.markdown("#### 🔊 Live Audio Pipeline Parameters")
        st.markdown(f"""
        - **Active Voice:** `{selected_voice_code}` ({selected_voice_name})
        - **Speaking Speed Rate:** `+{speed_percent}%` (Natural conversational flow with ample animation view time)
        - **Club Social Handle:** `{club_handle}` (Rendered on Outro Card & Header Pill)
        - **Cadence Protocol:** Sentence-level continuous synthesis with bit-exact WAV silence concatenation
        - **Timestamp Sync:** Microsoft Speech native `WordBoundary` events mapped to script tokens
        """)

    st.markdown("---")
    st.markdown("### 🏛️ Complete Visual Style Architecture Catalog")
    st.write("Browse all 6 authentic Faceless Shorts styles plus the custom COEP Neon Explainer. Each style features distinct character rigs, 3D worlds, caption typography, and procedural foley.")

    style_cols = st.columns(3)
    for idx, (s_key, s_item) in enumerate(ALL_STYLES.items()):
        col_target = style_cols[idx % 3]
        with col_target:
            st.markdown(f"""
            <div class="news-card" style="height: 360px; overflow-y: auto;">
                <h4 style="margin: 0; color: #38BDF8;">{s_item.icon} {s_item.name}</h4>
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

    curr_script_info = load_project_script()
    st.info(f"Target Video Script: **{curr_script_info.get('title', 'This Week In AI')}** ({len(curr_script_info.get('lines', []))} cuts)")

    col_render_btn, col_check_btn = st.columns([2, 2])
    with col_render_btn:
        start_render = st.button("🚀 Render Full 1080×1920 Short", type="primary", use_container_width=True)
    with col_check_btn:
        start_check = st.button("🔍 Check Timing & Captions Only", use_container_width=True)

    if start_check:
        with st.status("Verifying Script and Frame Cues...", expanded=True) as status:
            st.write("Running audio agent synthesis...")
            res_audio = subprocess.run([str(VENV_PYTHON), "-m", "agents.audio_agent"], capture_output=True, text=True)
            if res_audio.returncode != 0:
                st.error(f"Audio Agent Error:\n{res_audio.stderr}")
                st.stop()
            st.text(res_audio.stdout.strip())

            st.write("Running headless Chrome syntax & timing check...")
            res_check = subprocess.run(["node", "tools/capture.mjs", "check"], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            if res_check.returncode != 0:
                st.error(f"Engine Check Error:\n{res_check.stderr or res_check.stdout}")
                st.stop()
            st.text(res_check.stdout.strip())
            status.update(label="Timing & Cues Verification Complete!", state="complete")

    if start_render:
        progress_bar = st.progress(0, text="Starting render pipeline...")
        with st.status("Executing Video Generation Pipeline...", expanded=True) as status:
            # 1. Synthesize audio
            progress_bar.progress(15, text="Step 1/4: Synthesizing voiceover at +10% rate...")
            st.write("Synthesizing studio voiceover with continuous sentence cadence...")
            res_audio = subprocess.run([str(VENV_PYTHON), "-m", "agents.audio_agent"], capture_output=True, text=True)
            if res_audio.returncode != 0:
                st.error(f"Audio Synthesis Failed:\n{res_audio.stderr}")
                st.stop()
            st.write(res_audio.stdout.strip())

            # 2. Extract cues
            progress_bar.progress(35, text="Step 2/4: Extracting audio cues...")
            st.write("Extracting timing cues from narration.wav...")
            res_cues = subprocess.run(["node", "tools/capture.mjs", "cues"], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            if res_cues.returncode != 0:
                st.error(f"Cues Extraction Failed:\n{res_cues.stderr or res_cues.stdout}")
                st.stop()
            st.write(res_cues.stdout.strip())

            # 3. Mix audio
            progress_bar.progress(50, text="Step 3/4: Mixing music & SFX cues...")
            st.write("Mixing voiceover with background music and sound effects...")
            mix_script = PROJECT_DIR / "tools" / "mix.py"
            res_mix = subprocess.run([str(VENV_PYTHON), str(mix_script), "."], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            if res_mix.returncode != 0:
                st.error(f"Audio Mix Failed:\n{res_mix.stderr}")
                st.stop()
            st.write(res_mix.stdout.strip())

            # 4. Render frames to video
            progress_bar.progress(70, text="Step 4/4: Rendering 3D animation frames...")
            st.write("Headless Chrome 3D compositor rendering frames...")
            render_out = PROJECT_DIR / "renders" / "latest_short.mp4"
            res_video = subprocess.run(["node", "tools/capture.mjs", "video", str(render_out), "--draft"], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            if res_video.returncode != 0:
                st.error(f"Video Render Failed:\n{res_video.stderr or res_video.stdout}")
                st.stop()

            # Copy to output and record render timestamp
            dest_video = OUTPUT_DIR / "latest_short.mp4"
            shutil.copy2(render_out, dest_video)
            st.session_state["last_render_time"] = datetime.now().strftime("%I:%M:%S %p")

            # Generate contact sheet
            subprocess.run(["node", "tools/capture.mjs", "sheet"], cwd=str(PROJECT_DIR), capture_output=True, text=True)
            sheet_src = PROJECT_DIR / "review" / "all.jpg"
            if sheet_src.exists():
                shutil.copy2(sheet_src, OUTPUT_DIR / "review_v4_contact_sheet.jpg")

            progress_bar.progress(100, text="Render complete!")
            status.update(label="Video Render Succeeded!", state="complete")
            st.balloons()

    st.markdown("---")
    st.markdown("#### 📱 Finished Video Preview & Download")

    available_videos: Dict[str, Path] = {}
    if (OUTPUT_DIR / "deep_dive_latest.mp4").exists():
        available_videos["🔬 Deep Dive 3D (Zack D Style - Sthanika Sieve-31Bv3 - 39.9s)"] = OUTPUT_DIR / "deep_dive_latest.mp4"
    if (OUTPUT_DIR / "tall_tale_cartoon_short.mp4").exists():
        available_videos["🎨 Tall Tale 3D Cartoon Short (Idaho Mail Girl - 51.7s)"] = OUTPUT_DIR / "tall_tale_cartoon_short.mp4"
    if (OUTPUT_DIR / "latest_short.mp4").exists():
        available_videos["⚡ Neon Cyber 3D Short (Sthanika Sieve v3 - 52.0s)"] = OUTPUT_DIR / "latest_short.mp4"
    if (OUTPUT_DIR / "this_week_in_ai_v4.mp4").exists():
        available_videos["🌐 This Week in AI (v4 Archive)"] = OUTPUT_DIR / "this_week_in_ai_v4.mp4"

    if available_videos:
        chosen_video_label = st.selectbox(
            "Select Rendered Short to Watch & Download",
            options=list(available_videos.keys()),
            index=0,
        )
        video_path = available_videos[chosen_video_label]
    else:
        video_path = OUTPUT_DIR / "latest_short.mp4"

    # Corresponding contact sheet
    if "deep_dive" in str(video_path).lower():
        contact_sheet_path = OUTPUT_DIR / "deep_dive_contact_sheet.jpg"
    elif "tall_tale" in str(video_path).lower():
        contact_sheet_path = OUTPUT_DIR / "tall_tale_contact_sheet.jpg"
    else:
        contact_sheet_path = OUTPUT_DIR / "review_v4_contact_sheet.jpg"

    col_vid, col_sheet = st.columns([1, 1.2])

    with col_vid:
        if video_path.exists():
            # Pass raw bytes to bypass any browser URL cache
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
            render_ts = st.session_state.get("last_render_time", "Latest Build")
            st.caption(f"Status: Fresh Render ({render_ts}) | File: `{video_path.name}` | Size: {len(file_bytes) / (1024 * 1024):.2f} MB | Aspect: 9:16 (1080×1920)")
        else:
            st.info("No rendered video found in `output/` yet. Click 'Render Full Short' above to generate one!")

    with col_sheet:
        if contact_sheet_path.exists():
            sheet_bytes = contact_sheet_path.read_bytes()
            st.image(sheet_bytes, caption=f"Contact Sheet: {contact_sheet_path.name}", use_container_width=True)
        else:
            st.caption("Contact sheet will appear here after render.")
