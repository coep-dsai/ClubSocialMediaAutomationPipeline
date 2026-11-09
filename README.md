# Agentic Social Media Automator: "This Week in AI" Shorts Pipeline

An automated, 100% zero-cost pipeline that scrapes weekly AI news, generates viral Cartoon 3D short scripts with hook-first pacing, synthesizes studio-grade voiceover and word-by-word captions, and renders full HD animated vertical Shorts (9:16) ready for YouTube Shorts, Instagram Reels, and TikTok.

---

## 🌟 Highlights
- **💸 100% Free Forever**: No paid APIs, no subscriptions. Runs entirely on your local machine.
- **📰 Smart AI News Scraper**: Ingests, filters, and virality-scores top AI stories from Google News RSS, Hacker News, and Hugging Face Daily Papers.
- **🎙️ Studio-Grade Local AI Voice**: Powered by **Kokoro-82M** text-to-speech.
- **⏱️ Auto-Synced Word-by-Word Captions**: Powered by **faster-whisper** (`small.en`).
- **🎨 Cartoon 3D & Pop Info Visuals**: 2D cartoon characters in a sunlit 3D miniature world with animated stat cards, comparison metrics, graphs, camera moves, and Foley sound effects.
- **🔄 Infinite Retention Loop**: Seamlessly loops the ending back into the opening hook.

---

## 📂 Project Architecture
```text
ClubSocialMediaAutomationPipeline/
├── agents/
│   ├── news_agent.py          # Scrapes and ranks top weekly AI stories
│   ├── script_agent.py        # Generates viral 15-18 cut short scripts
│   └── __init__.py
├── pipelines/
│   └── this_week_in_ai.py     # End-to-end CLI orchestrator
├── projects/
│   └── this_week_in_ai/       # Active project (3D scenes, shots, audio, captions)
│       ├── script.json        # Timing & narration script
│       ├── src/shots.js       # Animated cartoon shots & pop info cards
│       ├── tools/capture.mjs  # Headless Chrome frame-exact renderer
│       └── tools/mix.py       # Procedural audio & Foley SFX mixer
├── faceless-shorts-skill/     # Core rendering engine & style presets
├── output/                    # Final exported videos & QA contact sheets
├── data/                      # Cached news stories & scripts
└── requirements.txt           # Project dependencies
```

---

## 🚀 Quickstart & Usage

### 1. Run the Full End-to-End Pipeline
```powershell
python -m pipelines.this_week_in_ai --run
```
This will:
1. Scrape the latest AI news and rank top candidates.
2. Select the top breakthrough and format it into a high-retention script.
3. Synthesize voiceover with Kokoro and align word timestamps with Whisper.
4. Check shots and mix audio, Foley sound effects, and background music.
5. Render a review contact sheet and export the full vertical MP4 to `output/this_week_in_ai.mp4`.

### 2. Step-by-Step Modular Commands
```powershell
# Step 1: Scrape & inspect top news
python -m pipelines.this_week_in_ai --scrape

# Step 2: Generate script from top story (or specify --story-index N)
python -m pipelines.this_week_in_ai --script --story-index 0

# Step 3: Generate voiceover and word timings
python -m pipelines.this_week_in_ai --voice

# Step 4: Mix sound effects and music cues
python -m pipelines.this_week_in_ai --mix

# Step 5: Render video (or render a fast preview with --preview 10)
python -m pipelines.this_week_in_ai --render --draft
```

---

## 🎬 Output Location
- **Rendered Short**: `output/this_week_in_ai.mp4` (1080x1920 @ 30fps)
- **QA Contact Sheet**: `output/review_contact_sheet.jpg`
