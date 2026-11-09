"""Style Management and Antigravity Director Prompt Generator.

Provides:
- Style registry for the 6 authentic Faceless Shorts styles + COEP Neon Explainer.
- Project scaffolding engine to clone any style template into an independent workspace.
- Autonomous Director Prompt generator tailored for Gemini 3.8 Flash High in Antigravity.
"""

from __future__ import annotations

import json
import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class StyleDefinition:
    id: str
    name: str
    badge: str
    tagline: str
    visual_look: str
    characters: str
    world: str
    captions: str
    audio_music: str
    best_topics: str
    icon: str
    has_template: bool
    template_folder: str
    key_features: List[str] = field(default_factory=list)
    scenes: List[str] = field(default_factory=list)


STYLES: Dict[str, StyleDefinition] = {
    "tall-tale": StyleDefinition(
        id="tall-tale",
        name="Tall Tale 3D",
        badge="Most Popular",
        tagline="Funny true stories, crazy loopholes, heists, and weird history",
        visual_look="Flat 2D cartoon people with thick ink outlines and expressive white faces acting inside a sunny, saturated 3D miniature world.",
        characters="2D Toon cutouts facing camera, customizable hats/bowties/mustaches/expressions (shock, smug, happy, worried, sweat).",
        world="3D miniature town sets (streets, post office, train cars, meadows, shops) with soft real-time depth of field and cast shadows.",
        captions="One word at a time, bold Inter Black font centered at y: 1340 with soft shadow, keeps punctuation.",
        audio_music="Upbeat energetic storyteller (en-US-GuyNeural), comedy bounce procedural music, funny cartoon foley (pop, boing, whoosh, ding).",
        best_topics="Crazy true tech hacks, student loopholes, wild founder stories, viral AI heists, underdog AI models.",
        icon="🎨",
        has_template=True,
        template_folder="tall-tale",
        key_features=[
            "People are 2D, world is 3D",
            "Faces do the acting (smug, shock, laugh, worried, sweat)",
            "Dynamic camera push-ins every 1.5-3 seconds",
            "Midday sun with warm shadows",
            "One-word captions with zero drift",
        ],
        scenes=[
            "Scene 1: The Crazy Hook — Wide crane-down on sunny 3D main street as hero encounters the absurd situation.",
            "Scene 2: Character Reaction & Close-Up — 2D cartoon face reacts with dynamic expressions (smug, shock, worried).",
            "Scene 3: The Bureaucratic Counter — Interior post office / shop with wooden cubbies, scale, and clerk.",
            "Scene 4: The Loophole Test — Interactive physical prop (platform scale, ticket booth, parcel pile).",
            "Scene 5: The Meadow Journey — Steam train rolling across green countryside with smoke particles.",
            "Scene 6: The Payoff & Punchline — Return to front porch with comic sound effects and giant stamped seals.",
        ],
    ),
    "deep-dive": StyleDefinition(
        id="deep-dive",
        name="Deep Dive 3D",
        badge="Zack D Style",
        tagline="3D medical, biological, and technical explainers with x-ray cutaways",
        visual_look="Sculpted stylized 3D humans in sunlit sets transitioning smoothly into glowing cyan x-ray cutaways and macro organ journeys.",
        characters="Sculpted Human mesh with warm skin tone transitioning into translucent cyan (#4FD1E8) x-ray glass with glowing skeleton/organs.",
        world="Three worlds in one video: (A) sunlit laboratory/room, (B) cyan x-ray anatomy, (C) deep red microscopic camera flights.",
        captions="Centered crisp captions with cyan highlights and danger red alarm callouts.",
        audio_music="Curious, intense explainer voiceover, deep bass sub-pulses, medical whooshes, and anatomical pops.",
        best_topics="What happens if AI takes over your phone, how neural nets process thought, biological vs silicon brain, cybernetic implants.",
        icon="🔬",
        has_template=True,
        template_folder="deep-dive",
        key_features=[
            "Smooth transition between real world, x-ray, and macro interior",
            "Translucent cyan glass shader (#4FD1E8) with glowing organs",
            "Macro camera zooms through tissue or chip circuits",
            "Shallow focus (aperture 0.003-0.006)",
        ],
        scenes=[
            "Scene 1: Real-World Lab / Room — Researcher in sunlit room with shallow focus pushing in on the dilemma.",
            "Scene 2: Translucent Cyan X-Ray — The body transforms into cyan fresnel glass with glowing brain & neural cortex.",
            "Scene 3: Microscopic Flight — High-speed macro journey through matrix weights, blood vessels, or silicon channels.",
            "Scene 4: Benchmark Pressure Pulse — The x-ray body pulses gold & cyan under high-stakes test stress.",
            "Scene 5: Victory & Resolution — Return to the sunlit real world proving efficiency beats brute force.",
        ],
    ),
    "inside-out": StyleDefinition(
        id="inside-out",
        name="Inside Out",
        badge="2D Cutaway",
        tagline="Clean, flat 2D science and mechanism explainers",
        visual_look="Minimalist flat vector shapes, cross-section cutaways, bold 1-3 word captions with exactly one bright yellow keyword.",
        characters="Friendly minimalist vector characters with dot eyes, expressive brows, and transparent organ overlays.",
        world="Flat cream parchment (#F4F1EA), clean geometric rooms, vector arrows, and cutaway diagrammatic callouts.",
        captions="1-3 bold words with exactly one keyword highlighted in bright yellow (#FFD43B).",
        audio_music="Fast, clear educational narration, crisp pop, slide, and click foley.",
        best_topics="Quick algorithm breakdowns, 'What happens when you send a prompt', parameter size comparisons, latency bottlenecks.",
        icon="📐",
        has_template=True,
        template_folder="inside-out",
        key_features=[
            "Flat vector shapes only (no 3D blur or glow)",
            "One keyword in bright yellow per caption",
            "Distinct cyan inside-the-system cutaways",
            "Fast 1-2 second rapid educational cuts",
        ],
        scenes=[
            "Scene 1: Flat Vector Setup — Friendly vector character on cream parchment background with bold caption.",
            "Scene 2: Transparent Cutaway — Minimalist cutaway reveal into the core mechanism.",
            "Scene 3: Cross-Section Flow — Vector arrows tracing algorithmic paths and data routing.",
            "Scene 4: Comparative Split — Side-by-side metric comparison with bright yellow callouts.",
            "Scene 5: Clean Payoff — Final vector diagram summary with key lesson.",
        ],
    ),
    "stick-story": StyleDefinition(
        id="stick-story",
        name="Stick Story",
        badge="Survival Steps",
        tagline="Survival life hacks, game-theory, and 'What would you do if...' steps",
        visual_look="Jet black stick figures with large expressive white eyes reacting inside colorful 2D illustrated environments.",
        characters="Black stick people with glowing silhouette outlines at night, fast emotive eye motions (look, mood, sweat).",
        world="Day and night room setups, gold numbered step cards (Step 1, Step 2) popping into the frame on key action beats.",
        captions="Rounded dark badge bars with gold step emphasis at bottom of screen.",
        audio_music="Tense, clever narrator (en-US-GuyNeural), whoosh cuts, pop on cards, round soft plop sounds.",
        best_topics="Top 3 AI tools to ace exams, step-by-step model deployment, hacker survival guide, what to do if your API is compromised.",
        icon="⚡",
        has_template=True,
        template_folder="stick-story",
        key_features=[
            "People are always ink black with large expressive eyes",
            "Gold numbered step cards on every key action point",
            "Night setups have warm character outline glows",
            "One visual idea per sentence clause",
        ],
        scenes=[
            "Scene 1: The Crisis — Black stick figure with wide emotive white eyes facing an urgent technical problem.",
            "Scene 2: Step 1 (Gold Card) — Gold numbered card pops in (Step 1: Isolate the bottleneck).",
            "Scene 3: Step 2 (Action) — Animated stick figure executing the strategic solution.",
            "Scene 4: Night Silhouette — Darkened environment where the stick character glows with a warm outline.",
            "Scene 5: Safe Resolution — Green checkmark badge confirming mission success.",
        ],
    ),
    "night-file": StyleDefinition(
        id="night-file",
        name="Night File 3D",
        badge="Dark Mysteries",
        tagline="Unsolved cyber mysteries, dark leaks, and eerie tech history",
        visual_look="Dark 3D film-noir spaces with a single spotlight; anonymous witnesses in dark silhouette with red rim light.",
        characters="Faceless mannequins; the key subject or rogue entity glows intense solid red.",
        world="Shadowy server basements, interrogation rooms, evidence polaroids, crime dossier files connected with red yarn.",
        captions="FreeMono typewriter font typing on letter-by-letter in cream with crimson keywords.",
        audio_music="Quiet, investigative narrator with longer suspenseful pauses (gap 0.4), subtle vinyl clicks, and low drones.",
        best_topics="The mystery behind Satoshi Nakamoto, rogue AI that escaped sandboxes, dark web data heists, secret military models.",
        icon="🕵️",
        has_template=True,
        template_folder="night-file",
        key_features=[
            "Single light source per scene; everything else falls into darkness",
            "Solid glowing red marks the subject and evidence points",
            "Typewriter letter-by-letter caption animation",
            "Deliberate, slow camera drifts (3-5s per shot)",
        ],
        scenes=[
            "Scene 1: The Dark Basement — Shadowy 3D room illuminated by a single dramatic overhead spotlight.",
            "Scene 2: The Red Subject — Anonymous silhouettes in dark rim-light while the key hacker/system glows solid red.",
            "Scene 3: The Evidence Dossier — Polaroids, typewriter printouts, and classified folders pinned to the board.",
            "Scene 4: Slow Camera Drift — Deliberate cinematic tracking through the crime scene.",
            "Scene 5: Unsolved Payoff — Crimson stamp slamming onto the file case.",
        ],
    ),
    "paper-atlas": StyleDefinition(
        id="paper-atlas",
        name="Paper Atlas",
        badge="Historic Maps",
        tagline="Historic tech evolutions, chip wars, and epic research breakthroughs",
        visual_look="Storybook cut-paper layers on aged parchment with realistic drop shadows and crimson expedition lines.",
        characters="Ornate period paper silhouettes, parchment scroll banners, gold wax seals.",
        world="Global parchment maps, shipping lanes, microchip fabrication timelines with gold date ribbons.",
        captions="Caladea serif font on torn paper banner strips with crimson highlight.",
        audio_music="Grand documentary narration, cinematic tension beds, and parchment rustle foley.",
        best_topics="The Silicon Valley Chip War, history of the Transformer architecture, Alan Turing's enigma, Moore's Law race.",
        icon="📜",
        has_template=True,
        template_folder="paper-atlas",
        key_features=[
            "Everything is cut paper with layered drop shadows",
            "Crimson routes and targets, gold ribbons for dates",
            "Maps first: where, then who, then what",
            "Caladea serif on torn paper strips",
        ],
        scenes=[
            "Scene 1: Parchment Map Unfold — Textured aged paper unfolding across the screen with drop shadows.",
            "Scene 2: Gold Ribbon Era — Ornate gold ribbon declaring the breakthrough date and era.",
            "Scene 3: Crimson Route & Silicon Lines — Cut-paper routes tracing global trade, chip supply, or model evolution.",
            "Scene 4: Cut-Paper Silhouettes — Historic machinery and founders rendered as layered paper cutouts.",
            "Scene 5: Wax Seal Payoff — Crimson and gold royal seal stamping the verdict into the parchment.",
        ],
    ),
    "neon-explainer": StyleDefinition(
        id="neon-explainer",
        name="Neon 3D Explainer",
        badge="COEP DSAI Special",
        tagline="COEP DSAI's signature cyberpunk 3D tech explainer",
        visual_look="Glowing neon wireframes, 3D holographic neural networks, spinning server racks, and data telemetry HUDs.",
        characters="Holographic AI avatars, floating neural nodes, glowing attention matrices, and digital data flows.",
        world="Dark cybernetic server room with cyan/magenta bloom, glowing grid floors, and dynamic 3D camera orbits.",
        captions="Cyberpunk HUD subtitle badges with glowing border and club watermark @dsai_coep.",
        audio_music="Tech-forward energetic narration, cyber synth risers, and sci-fi digital interface clicks.",
        best_topics="Weekly AI breakthrough drops, benchmark showdowns (e.g. Sthanika vs Perplexity), GPU hardware news.",
        icon="🌐",
        has_template=True,
        template_folder="this_week_in_ai",
        key_features=[
            "Full Three.js 3D server rooms and floating neural network meshes",
            "Dynamic neon palettes (Cyberpunk, Emerald, Noir, Red Alert)",
            "Synchronized 3D card HUDs with live story facts",
            "Official COEP Data Science & AI Club branding",
        ],
        scenes=[
            "Scene 1: The Duel — Workstation Laptop vs ominous Supercomputer tower with alert LEDs.",
            "Scene 2: The Server Farm — Receding monolith server aisles with flashing cyan and emerald rack LEDs.",
            "Scene 3: 3D Neural Network — Fully framed 4-layer multi-layer perceptron with pulsing synaptic rewiring.",
            "Scene 4: Benchmark Podium — 3D Gold Championship Trophy Cup, 3-tiered podium, and animated bar chart.",
            "Scene 5: High-Speed & Eco HUD — Rushing accelerator highway grid, 70X speedometer gauge, and 3D green eco battery cell.",
            "Scene 6: Everyday Workstation — Desk with terminal code execution log and official @dsai_coep outro card.",
        ],
    ),
}


class StyleAgent:
    """Manages visual styles, scaffolding, and prompt generation for Antigravity."""

    def __init__(self, workspace_root: Optional[Path] = None):
        self.workspace_root = workspace_root or Path(__file__).resolve().parent.parent
        self.skill_styles_dir = self.workspace_root / "faceless-shorts-skill" / "faceless-shorts" / "styles"
        self.projects_dir = self.workspace_root / "projects"

    def get_styles(self) -> Dict[str, StyleDefinition]:
        """Returns the full catalog of available styles."""
        return STYLES

    def get_style(self, style_id: str) -> Optional[StyleDefinition]:
        """Returns metadata for a specific style."""
        return STYLES.get(style_id)

    def scaffold_project(self, style_id: str, project_name: str) -> Path:
        """Clones a style template into a new dedicated project workspace.

        Args:
            style_id: The id of the style to scaffold (e.g. 'tall-tale', 'deep-dive', 'neon-explainer').
            project_name: The destination project name under `projects/`.

        Returns:
            The Path to the newly scaffolded project directory.
        """
        style = self.get_style(style_id)
        if not style:
            raise ValueError(f"Unknown style: {style_id}. Available: {list(STYLES.keys())}")

        dest_dir = self.projects_dir / project_name

        if style_id == "neon-explainer":
            src_dir = self.projects_dir / "this_week_in_ai"
        else:
            src_dir = self.skill_styles_dir / style.template_folder / "example"

        if not src_dir.exists():
            raise FileNotFoundError(f"Source template directory not found: {src_dir}")

        # If dest already exists, don't clobber it blindly
        if not dest_dir.exists():
            shutil.copytree(src_dir, dest_dir)
        else:
            # Refresh core rigs and tools without losing custom scripts
            for sub in ["src/core", "vendor", "fonts", "tools"]:
                src_sub = src_dir / sub
                dest_sub = dest_dir / sub
                if src_sub.exists():
                    if dest_sub.exists():
                        shutil.rmtree(dest_sub)
                    shutil.copytree(src_sub, dest_sub)

        # Ensure required output directories exist
        (dest_dir / "renders").mkdir(parents=True, exist_ok=True)
        (dest_dir / "review").mkdir(parents=True, exist_ok=True)
        (dest_dir / "data").mkdir(parents=True, exist_ok=True)

        # Clear stale narration or mix audio
        for stale in ["data/narration.wav", "data/mix.wav"]:
            stale_file = dest_dir / stale
            if stale_file.exists():
                try:
                    stale_file.unlink()
                except Exception:
                    pass

        return dest_dir

    def generate_director_prompt(
        self,
        story: Dict[str, Any],
        style_id: str = "tall-tale",
        club_handle: str = "@dsai_coep",
        target_duration: int = 40,
    ) -> str:
        """Constructs an exhaustive Antigravity Director Prompt for Gemini 3.8 Flash High.

        The prompt gives the agent full authority to autonomously write the script,
        synthesize zero-drift audio, craft custom Three.js character animation in shots.js,
        mix sound design, and render the MP4 video using the faceless-shorts skill.
        """
        style = self.get_style(style_id) or STYLES["tall-tale"]
        title = story.get("title", "A Massive Breakthrough in Artificial Intelligence")
        summary = story.get("summary", story.get("description", ""))
        source = story.get("source", "Tech & AI Research")
        url = story.get("url", story.get("link", ""))

        prompt = f"""================================================================================
🎬 ANTIGRAVITY DIRECTOR INSTRUCTION: VIRAL SHORT GENERATION ({style.name.upper()})
================================================================================

Target Model: Gemini 3.8 Flash (High)
Executing Agent: Antigravity Pair Programmer
Branding Attribution: COEP's Data Science and AI Club ({club_handle})
Style: {style.name} ({style.badge})
Target Duration: {target_duration} seconds (vertical 9:16, 1080x1920, 30 FPS)

================================================================================
📰 SOURCE STORY & RESEARCH FACTS
================================================================================
• Title: {title}
• Source: {source}
• Link: {url}
• Verified Facts / Summary:
  {summary}

================================================================================
🎨 MANDATORY VISUAL STYLE GUIDELINES ({style.name})
================================================================================
{style.visual_look}

1. Visual Rules:
   - Characters: {style.characters}
   - World / Environment: {style.world}
   - Captions: {style.captions}
   - Foley & Sound Design: {style.audio_music}
   - Key Feature Checklist:
{chr(10).join(f"     * {feat}" for feat in style.key_features)}

2. Narrative & Hook Architecture:
   - 0:00 - 0:02: CRAZY HOOK. Open immediately on the most shocking, counter-intuitive fact. Never say 'Hey guys' or 'In today's video'.
   - 0:02 - 0:15: THE PROBLEM / DISCOVERY. Introduce the hero, the struggle, or the breakthrough with rapid cuts (1.5 - 2.5s per shot).
   - 0:15 - 0:30: THE MECHANISM / CLIMAX. Show the unexpected twist, numbers, or technical mechanism with visual punch-ins.
   - 0:30 - {target_duration}: THE PAYOFF & PUNCHLINE. Deliver a satisfying flip that connects back to the opening hook, closing with {club_handle}.

================================================================================
⚡ AUTONOMOUS AGENT EXECUTION INSTRUCTIONS
================================================================================
Antigravity, please execute the entire pipeline autonomously using the faceless-shorts skill:

1. Scaffold Workspace:
   Use StyleAgent to scaffold the '{style.id}' template into `projects/{style.id}_project/` if not already present.

2. Script & Audio Generation:
   - Write a high-retention script with exactly matching voice lines and word boundaries.
   - Use `agents/audio_agent.py` or Edge-TTS (`en-US-GuyNeural` at +10% rate) to synthesize zero-drift audio.
   - Save timestamped words to `data/words.json` and narration to `data/narration.wav`.

3. Code Three.js Visual Animation (`src/shots.js`):
   - Adapt the scene setups and characters for the story topic.
   - Implement dynamic camera moves (push-in, crane, orbit) for every single shot.
   - Trigger character emotional expressions and props precisely timed to spoken words using `Wd('keyword', lineIdx)`.

4. Verification & Rendering:
   - Run `node tools/capture.mjs check` to verify scene timings, captions, and 3D assets.
   - Run `node tools/capture.mjs cues` and `tools/mix.py` to synthesize procedural cartoon foley and music.
   - Render the complete video with `node tools/capture.mjs video renders/{style.id}_short.mp4 --draft`.
   - Generate a review contact sheet with `node tools/capture.mjs sheet review/review.jpg 2 6`.
   - Copy the final MP4 to `output/{style.id}_latest.mp4`.

Please confirm and proceed with rendering!
================================================================================
"""
        return prompt
