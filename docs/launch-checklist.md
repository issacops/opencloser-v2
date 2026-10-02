# OpenCloser — Launch Checklist

Distribution playbook for the v0.2.0 launch. Copy-paste copy included. Work top to bottom.

## 1. Show HN

- **When:** Tue–Thu, 8–10am ET. Post from an account with history.
- **Title options (pick one, keep it direct):**
  - `OpenCloser – Open-source AI SDR that cold-calls from your desktop`
  - `Show HN: I replaced our $1k/mo SDR stack with a free Tauri app`
- **First comment (post immediately, this is the real pitch):**
  > Hey HN — I built OpenCloser, an MIT-licensed AI sales platform that runs entirely on your desktop (Tauri 2 + React + Rust + SQLite).
  >
  > It gives you five AI agents: a strategist that builds your ICP, a researcher that hunts/scores leads, a voice caller that dials real prospects over Twilio with live sentiment + objection detection, a coach for sparring, and a manager for analytics. Works with Gemini/OpenAI/ElevenLabs, or fully offline with Ollama. Demo mode needs zero API keys.
  >
  > Why: SDR SaaS costs $280–$1k/mo/seat and holds your customer data. This is free, local-first, auditable.
  >
  > Links: demo video + screenshots on the site, binaries for macOS/Windows/Linux on the releases page. Happy to answer anything about the Twilio Media Streams setup or the local-first architecture.
- **Reply fast** to every comment in the first 3 hours.

## 2. Reddit

- **r/SideProject** — title: `I built an open-source AI SDR that makes real cold calls from your desktop [MIT]`. Link site, mention stack.
- **r/selfhosted** — title: `OpenCloser – self-hosted AI sales platform (Tauri + SQLite, no cloud)`. Lead with local-first + Ollama angle.
- **r/sales** — title: `I automated the SDR parts everyone hates — free and open source`. Lead with War Room + coaching, not tech.
- Rules: read each sub's self-promo rules first; engage in comments; never cross-post the same hour.

## 3. Awesome lists (backlinks + SEO)

- **awesome-tauri** — PR adding OpenCloser under Apps. Requires: repo link + one-line description.
- **awesome-ollama** — PR under Applications (offline AI angle).
- **awesome-selfhosted** — only after the release is 4+ months old (their rule); calendar it.
- Each merged PR is a high-authority backlink — this is the highest-ROI SEO move on the list.

## 4. X / Twitter thread

1. `SDR software costs $1,000/month. Ours costs $0. Meet OpenCloser — the open-source AI sales team that lives on your desktop. 🧵` + launch video
2. The War Room: live AI calls with sentiment + coaching (screenshot)
3. Five agents, one SQLite file, zero cloud (features)
4. Offline mode with Ollama (privacy angle)
5. `MIT licensed. Binaries for macOS/Windows/Linux. Link below. ⭐`

## 5. LinkedIn

Founder-voice post: the cost math ($12k/yr/seat → $0), the privacy angle for regulated industries, link to press kit for journalists. Tag #opensource #sales #AI.

## 6. DEV.to / Hashnode article

Title: `How I built an AI cold-caller that runs on your desktop (Tauri + Twilio Media Streams)`. Technical deep-dive: audio bridge, local-first sync, Ollama routing. Ends with launch CTA. Evergreen SEO asset — targets "twilio media streams", "tauri ai app", "local-first ai" queries.

## 7. YouTube

Upload `docs/opencloser-launch.mp4` as unlisted→public with keyword title: `OpenCloser — Open Source AI SDR (AI Cold Calling Software)`. Description links to repo + site. Second biggest search engine; video rich results feed back to the site.

## 8. Product Hunt (optional, later)

Needs a hunter + launch-day coordination. Defer until v0.3.0 with a feature hook. Don't half-do it.

## Tracking

- Stars/forks: repo insights → traffic
- Site: add Plausible/Umami (privacy-friendly, no cookies) before posting anywhere
- Goal for week 1: 100 stars, 3 awesome-list merges, 1 Show HN front-page hour
