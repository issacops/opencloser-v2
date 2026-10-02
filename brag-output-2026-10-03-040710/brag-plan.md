# Brag Plan: OpenCloser — "Your first day"

## What is this app?
OpenCloser is a free, open-source desktop app that puts an entire AI sales team — strategist, lead researcher, voice caller, coach, manager — on your machine, including a War Room where the AI makes live cold calls.

## The angle
One seller's first morning, compressed into 23 seconds. Time-stamped vignettes (9:04 AM → 11:30 AM) follow a single narrative: describe your market over coffee, get an ICP back, find scored leads waiting, click one, and watch your AI run a live sales call before lunch. The timestamps are the storytelling engine — this isn't a feature tour, it's a day that actually happened (in demo mode, but still).

## Hook (first 2-3 seconds)
Black screen. "SDR software costs $1,000/month." — beat — "Ours costs $0." in coral, with a small "✱ OPEN SOURCE AI SDR" kicker above so the brand lands in second one. Same tested hook, now branded from frame one.

## Key moments (the middle)
- Morning setup, explained: onboarding chat types out a market description while the caption reads "STEP 1 — DESCRIBE YOUR MARKET"; hard cut to the ICP review blooming with "STEP 2 — YOUR ICP, READY IN MINUTES".
- The flow, performed: pipeline kanban ("STEP 3 — LEADS, SCORED BY AI") → cursor clicks Sarah Jenkins → lead detail ("SCORE 95 — CLICK INITIATE") → INITIATE click cuts straight into the War Room ("11:30 AM — YOUR AI MAKES THE CALL"): sentiment bars climb to Positive 82%, SPIN coaching tip slides in.
- The breadth cascade: four windows fire in a row, each with a one-line explanation — persona builder ("Design the voice"), call intelligence ("Every call analyzed"), lead hunter ("Prospects on tap"), settings ("Keys stay local").

## Outro / punchline
"OpenCloser." lockup slam. "Download free." github.com/issacops/opencloser-v2. Bell rings into black. The URL is the punchline — it's real, it's free, go get it.

## User flow worth showing
Onboarding chat → ICP review → pipeline → lead card click → lead detail → INITIATE → War Room live call. (Entry → setup → key action → result: describe market → get ICP → pick scored lead → AI calls live.)

## Tone
- Preset: cinematic
- Creative direction: a seller's first morning as a blockbuster trailer — timestamped vignettes, one continuous cursor journey, nine real app windows
- Interpretation: trailer scale with documentary spine — the timestamps and step captions do the storytelling, the motion stays dramatic but every window shown is the actual product doing its actual job

## Format: landscape — 1920x1080
## Duration: 23s

## Visual identity (from the project)
- Background: #0a0a0a (exact, landing page ground)
- Accent: #FF5C39 coral (voltage) + #6366f1 indigo (gradient partner)
- Text: #e5e5e5
- Display font: system grotesk stack, fallback Inter, heavy weights for slam type
- Body font: same grotesk stack; explanations in tracked-out mono (JetBrains Mono-style system mono)
- Strongest visual element: the journey itself — one cursor traveling across nine real screenshots, timestamp chips ("9:04 AM") anchoring each vignette

## Share copy (draft)
9:04 AM: describe your market. 11:30 AM: your AI is cold-calling. OpenCloser — the open-source AI sales team on your desktop. Free forever. 🚀

## Audio direction
- Role: cinematic support — steady bed under a morning-that-builds, swelling into the 11:30 call and the outro
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3 (steady and clean, 110 BPM)
- Music treatment: full bed 0–23s at 0.3–0.4, gentle fade-out over the last 1.5s; let the final lockup ring
- Music cue guidance: preset at assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json (tempo 110); strong-cue targets — War Room reveal → 12.55s; breadth cascade → 17.47s; outro accent → 22.37s; beat grid (~0.55s) for the breadth cascade and stat beats
- Audio-reactive treatment: subtle; hero window glow and timestamp chips breathe with RMS/bass. No waveforms, no equalizers, no pulsing text
- SFX posture: moderate, cinematic — bells for the two slams, clicks for the two cursor hits, card sounds for the breadth cascade, one soft accent for the coaching arrival
- Audio-coupled moments:
  - Hook $0 slam — impact hit
  - ICP bloom — soft reveal accent
  - Flow cursor clicks (lead card, INITIATE) — mouse clicks matched to the cursor
  - Coaching tip arrival — soft UI accent
  - Breadth cascade — card-place hit per window
  - Outro lockup + 22.37 accent — deep bell, ring into black
- Restraint rule: sound must never talk over the product — no SFX under dense UI motion, music never above 0.4

## Storyboard

### Scene 1 — Hook: the price of everyone else — 2.5s
Black ground, kicker "✱ OPEN SOURCE AI SDR" settles top. Line one slams: "SDR software costs $1,000/month." (1s hold). Line two slams beneath in coral: "Ours costs $0." Hold to cut.
Sequential/interaction: yes — kicker, then two type beats, second in coral
Audio intent: cold open, then the hit
Audio-coupled idea: impact hit synced to the "$0" slam
Music: vol-12 bed, low under the type
Transition mood: hard cut → Scene 2

### Scene 2 — Morning setup: market → ICP — 4.5s
"9:04 AM" timestamp chip + caption "STEP 1 — DESCRIBE YOUR MARKET": onboarding chat window, a market description types itself out. Cut to ICP review blooming with "9:06 AM" + "STEP 2 — YOUR ICP, READY IN MINUTES". End on ICP held.
Sequential/interaction: yes — typed line with key ticks, then the ICP window crossfade-blooms
Audio intent: morning starting — small, bright, building
Audio-coupled idea: subtle key ticks under the typing; soft reveal accent on the ICP bloom
Music: bed lifts gently
Transition mood: hard cut (timestamp change) → Scene 3

### Scene 3 — Flow: scored leads → live call — 9s
"10:15 AM" + "STEP 3 — LEADS, SCORED BY AI": pipeline kanban hero; cursor glides to Sarah Jenkins's card, clicks; lead detail opens with "SCORE 95 — CLICK INITIATE" caption; cursor travels to INITIATE, clicks — hard cut to War Room, "11:30 AM — YOUR AI MAKES THE CALL": sentiment bars climb to Positive 82%, SPIN coaching tip slides in, LIVE CALL badge pulses once. Hold the call.
Sequential/interaction: yes — full simulated cursor journey: click card → click INITIATE → call; sentiment/coaching animate on arrival
Audio intent: momentum into the hero — clicks ticking, then the swell
Audio-coupled idea: mouse clicks on both hits; soft accent as coaching arrives
Music: swell toward the 12.55s strong cue at the War Room reveal
Transition mood: hard cut on the INITIATE click (the cut IS the dial) → Scene 4

### Scene 4 — Breadth: meet the rest of the team — 4s
"WHILE IT DIALS —" track: four windows cascade on the beat grid, each with its explanation label: persona builder ("Design the voice"), call intelligence ("Every call analyzed"), lead hunter ("Prospects on tap"), settings ("Keys stay local"). Fast in, hold the full set for the read.
Sequential/interaction: yes — four windows cascade ~0.55s apart, then hold together ≥1s
Audio intent: staccato proof — four hits, done
Audio-coupled idea: card-place hit per window, accenting first and last
Music: strong cue 17.47s inside the cascade
Transition mood: hard cut → Scene 5

### Scene 5 — Outro: the lockup — 3s
"OpenCloser." slams full-screen. "Download free." beneath. Coral pill: github.com/issacops/opencloser-v2. Accent swell at 22.37s. Hold. Cut to black.
Sequential/interaction: none — lockup, then URL, stillness is the payload
Audio intent: landing — final bell, then silence
Audio-coupled idea: deep bell on the lockup; let it ring over the fade
Music: fade-out over the scene; strong cue 22.37s under the accent
Transition mood: cut to black (end)

**Music mood for this video:** cinematic
**Audio summary:** steady vol-12 bed under a morning arc — cold type hits, morning key ticks, ticking UI clicks through the live flow, a four-hit breadth volley, and a final bell ringing into black.
