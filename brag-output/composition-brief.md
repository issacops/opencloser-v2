# Hyperframes Composition Brief: OpenCloser

## Objective
Create a short launch-style brag video for OpenCloser — a blockbuster trailer for the AI sales team that lives on your desktop.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21 seconds

## Source Material
- Project root: /home/catch/Desktop/opencloser-v2-main
- Primary files read: docs/index.html (voice, story, palette), README.md (claims, stats), docs/screenshots/*.webp (hero visuals)
- Product name: OpenCloser
- Tagline / strongest claim: "Ours costs $0." (against $1,000/month SDR software)
- Key UI or visual moment to recreate: the user flow — pipeline kanban → lead card click → lead detail → INITIATE AUTONOMOUS EXECUTION → War Room live call with sentiment bars + SPIN coaching tip
- Copy that must appear verbatim:
  - "SDR software costs $1,000/month."
  - "Ours costs $0."
  - "OpenCloser"
  - "THE OPEN SOURCE AI SDR"
  - "5 AI AGENTS" / "100% LOCAL" / "$0 FOREVER"
  - "Download free."
  - "github.com/issacops/opencloser"

## Creative Direction
- Tone preset: cinematic
- Creative direction: blockbuster trailer for the AI sales team that lives on your desktop
- Interpretation: dramatic trailer pacing and scale — sweeping statements, slam-in type, full-bleed hero UI — played completely straight because the product backs every claim; restraint only in that nothing winks
- Angle: the trailer treatment is the joke that isn't a joke — every absurd-scale claim (AI makes live cold calls, reads sentiment, coaches mid-call) is a real shipping feature
- Hook: black screen, "SDR software costs $1,000/month." — beat — "Ours costs $0." in coral
- Outro / punchline: "OpenCloser." lockup, "Download free.", github URL, cut to black
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #0a0a0a (exact, from landing page)
- Text: #e5e5e5 (exact)
- Accent: #FF5C39 coral (voltage) + #6366f1 indigo (gradient partner)
- Display font: system grotesk stack, fallback Inter, heavy weights for slam type
- Body font: same grotesk stack
- Visual references from the project: War Room dark live-call UI (sentiment bars, coaching card, emotion matrix); light app screenshots (pipeline kanban, lead detail, dashboard) as floating hero windows on the dark ground; landing-page gradient headline treatment (indigo→coral)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook: the price of everyone else — 3s — two type slams on black, "$0" in coral
2. Reveal: the wordmark — 4s — "OpenCloser" assembles full-screen, tagline rail, dashboard blooming behind
3. Flow: pick a lead, start the call — 8s — simulated cursor: pipeline → lead card click → lead detail → INITIATE click → War Room live call with animating sentiment + coaching
4. Stats: the volley — 3s — three cards cascade on the beat grid, then hold
5. Outro: the lockup — 3s — "OpenCloser. / Download free. / github.com/issacops/opencloser", cut to black

## Audio
- Audio role: cinematic support — steady bed under trailer-scale reveals, swelling into the War Room moment and the outro
- Audio arc: cold type hits → wordmark bell → ticking UI clicks through the live flow → three-hit stat volley → final bell ringing into black
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: full bed 0–21s at 0.3–0.4, gentle fade-out over the last 1.5s; let the final lockup ring, not the music
- Music cue guidance: preset at assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json (tempo 110); strong-cue targets — War Room reveal → 8.74s; stat cascade → 15.84s / 17.47s; outro slam → 19.66s; beat grid (~0.55s) for the stat cascade and type beats
- Audio-reactive treatment: subtle; hero window glow and wordmark presence breathe with RMS/bass. No waveforms, no equalizers, no pulsing text
- Audio-coupled moments:
  - Hook $0 slam — impact hit
  - Wordmark resolve — deep bell reveal
  - Flow cursor clicks — mouse clicks on card click + INITIATE click
  - Stat cascade — card-place hit per card
  - Outro lockup — final bell, ring into black
- SFX selection guidance: cinematic weight — impactBell_heavy for the two slams, mouseclick for the two cursor hits, card-place for the cascade, one soft UI accent for sentiment/coaching arrival; low high-frequency-risk picks for the repeated cascade
- SFX analysis guidance: skills/brag/assets/sfx/sfx-analysis.md (installed skill copy)
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
