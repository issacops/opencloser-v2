# OpenCloser — Press Kit

## What is OpenCloser?

OpenCloser is an **open-source AI sales development platform** that runs entirely on your desktop. It provides a complete AI sales team — strategist, lead researcher, voice caller (SDR), coach, and manager — all running locally with no SaaS fees and no cloud dependency.

**Repository:** https://github.com/issacops/opencloser-v2
**Website:** https://issacops.github.io/opencloser-v2/
**License:** MIT

---

## Key Facts

| | |
|---|---|
| **What** | Open source AI SDR & AI sales platform |
| **Why** | Traditional SDR platforms cost $280–$1,000+/mo per seat; OpenCloser is free and open source |
| **How** | Tauri 2.0 desktop app (React 19 + Rust + SQLite) with Gemini/OpenAI/ElevenLabs AI |
| **Who** | Solo founders, early-stage startups, sales teams, developers, privacy-conscious teams |
| **When** | v0.2.0 released October 2026 |
| **Where** | macOS (ARM64 + Intel), Windows (x86_64), Linux (x86_64) |

---

## The Problem

Sales development is expensive and broken:

- **SDR platforms** charge $280–$1,000+/month per seat (Artisan, Lyzr, Salesforge)
- **AI cold calling tools** are cloud-only, sending your customer data to third parties
- **Lead generation** requires manual research or expensive data providers
- **Sales coaching** happens infrequently — usually after deals are already lost
- **Solo founders and early startups** are priced out of enterprise sales tooling

## The Solution

OpenCloser puts an entire AI sales team on your desktop:

1. **AI Strategist** — Generates your ICP using SPIN & Challenger frameworks in minutes
2. **AI Lead Researcher** — Hunts, scores, and qualifies leads automatically
3. **AI Voice Caller** — Makes live cold calls with real-time sentiment analysis and objection detection
4. **AI Sales Coach** — Sparring partner with 3 difficulty levels for objection handling
5. **AI Sales Manager** — Post-call debriefs, analytics, and pipeline intelligence

All data stays local. All AI keys stay in your browser. No SaaS fees. Ever.

---

## Differentiators

| Feature | OpenCloser | Typical SaaS |
|---|---|---|
| Price | Free (MIT) | $280–$1,000+/mo |
| Data storage | Local SQLite | Cloud-hosted |
| AI cold calling | Built-in (Twilio) | Add-on / extra cost |
| Lead generation | AI-powered | Manual or extra |
| Sales coach | AI sparring partner | Not included |
| Self-hosted | Yes | No |
| Open source | Yes | No |
| Offline capable | Yes (Ollama) | No |

---

## Tech Stack

- **Frontend:** React 19, TypeScript (strict), Tailwind CSS 3, Vite 6, Zustand 5
- **Desktop:** Tauri 2.10
- **Backend:** Rust (rusqlite, reqwest, tokio)
- **Database:** SQLite (local-first)
- **AI:** Google Gemini 2.5 Flash, OpenAI Realtime, ElevenLabs ConvAI, local Ollama
- **Voice:** Web Audio API + AudioWorklet, Twilio Media Streams
- **Tests:** 74 JS (Vitest) + 25 Rust tests
- **CI/CD:** GitHub Actions (lint, format, knip, test, build, release)

---

## Screenshots

| | |
|---|---|
| ![War Room](screenshots/opencloser-war-room-ai-cold-calling.webp) | ![Dashboard](screenshots/opencloser-dashboard-home.webp) |
| War Room — Live AI cold calling | Dashboard — Sales analytics |
| ![Pipeline](screenshots/opencloser-pipeline-kanban.webp) | ![Persona](screenshots/opencloser-ai-persona-builder.webp) |
| Pipeline — Kanban CRM | AI Persona Builder |
| ![Lead Hunter](screenshots/opencloser-lead-hunter.webp) | ![Call Intelligence](screenshots/opencloser-call-intelligence.webp) |
| Lead Hunter — AI prospecting | Call Intelligence |

---

## Quotes

> "OpenCloser is the open source AI SDR we've been waiting for. It replaces $1,000/mo of SaaS tools with a free desktop app that runs entirely locally."
> — *Early adopter*

> "The War Room is incredible. The AI calls prospects, detects sentiment in real-time, and coaches you live. It's like having a sales manager looking over your shoulder."
> — *Beta tester*

---

## FAQ

**Is OpenCloser really free?**
Yes. MIT licensed. No SaaS fees, no per-seat pricing, no cloud subscription.

**Does it work without an API key?**
Yes. Demo mode includes 10 seed leads, simulated AI calls, and full functionality with fallback data.

**Is my data sent to the cloud?**
No. All data stays in a local SQLite database. API keys are stored in localStorage and sent only to your chosen AI provider.

**What platforms are supported?**
macOS (Apple Silicon + Intel), Windows (x86_64), Linux (x86_64).

**How do I get started?**
```bash
git clone https://github.com/issacops/opencloser-v2.git
cd opencloser
npm install
npm run tauri dev
```

---

## Media & Assets

- **Logo:** See repository root
- **Screenshots:** `docs/screenshots/` (WebP, 1440×860)
- **Social preview:** 1200×630 PNG (available in repository)
- **Demo video:** Coming soon

---

## Contact

- **GitHub:** https://github.com/issacops/opencloser-v2
- **Issues:** https://github.com/issacops/opencloser-v2/issues
- **Releases:** https://github.com/issacops/opencloser-v2/releases
