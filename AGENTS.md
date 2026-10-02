# OpenCloser — Agent Guide

## Project Overview

OpenCloser is a Tauri 2.0 desktop AI sales platform built with React 19, TypeScript, Tailwind CSS, Rust, and SQLite. It provides an entire AI sales team: strategist, lead researcher, voice caller (SDR), coach, and manager — all running locally.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS 3, Vite 6 |
| Desktop | Tauri 2.10 (Rust backend) |
| Database | SQLite (rusqlite) |
| AI | Google Gemini 2.5 Flash (cloud) + Ollama (offline, takes priority) |
| Voice | Web Audio API + AudioWorklet, Twilio Media Streams |
| Telephony | Twilio REST (mock mode included) + bundled cloudflared tunnel |
| State | Zustand 5 |
| Tests | Vitest + React Testing Library (74 JS) + 25 Rust |
| Icons | Lucide React |

## Project Structure

```
opencloser/
├── src/                          # Frontend source
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── constants.ts              # Storage keys, routes, nav config
│   ├── types.ts                  # Lead, ICP, Campaign, CallSession
│   ├── types/persona.ts          # AIPersona, voice presets
│   ├── index.css                 # Global styles, Tailwind, animations
│   ├── components/               # Shared components
│   │   └── AppShell.tsx          # Header + sidebar layout
│   ├── stores/                   # Zustand state management (lead data lives in queries.ts)
│   │   ├── call.store.ts         # Call state, active call, debrief
│   │   ├── onboarding.store.ts   # ICP interview flow
│   │   ├── persona.store.ts      # AI persona configuration
│   │   ├── navigation.store.ts   # App routing state (Zustand appState machine, not React Router)
│   │   └── toast.store.ts        # Toast notifications
│   ├── services/                 # Tauri invoke wrappers
│   │   ├── queries.ts            # TanStack Query hooks for leads/call logs
│   │   ├── lead.service.ts       # getLeads, updateLeadStatus, etc.
│   │   ├── onboarding.service.ts # processOnboardingChat
│   │   ├── ai.service.ts         # Lead scraping, call analysis (spreads local AI config)
│   │   ├── twilio.service.ts     # Twilio config, tunnel, calls, media-stream audio
│   │   └── apiKey.ts             # getGeminiKey, getLocalAIConfig, isDemoMode
│   ├── ui/components/            # Toast, future shared UI
│   ├── test/                     # Test files (8 suites, 74 tests)
│   │   ├── setup.ts              # Vitest setup
│   │   ├── appshell.test.tsx     ├── settings.test.tsx
│   │   ├── toast.test.tsx        ├── twilio.test.tsx
│   │   ├── phone-line.test.ts    ├── emotion-engine.test.ts
│   │   └── objection-engine.test.ts + providers.test.ts
│   └── features/
│       ├── crm/components/       # KanbanBoard, LeadDetail, Settings, PersonaBuilder, CallLogs
│       │   ├── DashboardHome.tsx # Thin root; slices live in dashboard/ (KPIColumn, StatsAndChart, RecentCallsTable)
│       ├── voice/components/
│       │   ├── WarRoom.tsx       # 100-line composition root
│       │   └── warroom/          # useCallSession, usePhoneLine, WarRoomHeader, panels
│       ├── voice/lib/            # caller-engine, emotion-engine, objection-engine, providers, phone-audio
│       ├── hunter/components/    # LeadHunter
│       └── onboarding/components/ # Onboarding, ICPDisplay, AudioSetupWizard
├── src-tauri/                    # Rust backend
│   └── src/
│       ├── lib.rs                # Tauri app builder + 24 invoke handlers
│       ├── main.rs               # Entry point
│       ├── ai/gemini.rs          # Gemini API (x-goog-api-key header) + mock/fallback logic
│       ├── ai/ollama.rs          # Offline Ollama path (checked before cloud in all AI commands)
│       ├── twilio/mod.rs         # Twilio REST calls + G.711 µ-law codec + resampler
│       ├── twilio/stream.rs      # Media Streams WS server (localhost) + audio bridge commands
│       ├── twilio/tunnel.rs      # cloudflared quick-tunnel manager
│       ├── relay/mod.rs          # Local WS bridge for OpenAI/ElevenLabs realtime
│       ├── db/schema.rs          # Schema init + migrations + seeds + indexes
│       └── db/commands.rs        # CRUD Tauri commands (transactional delete, LIMIT 500)
├── public/
│   └── audio-processor.worklet.js # AudioWorklet PCM capture
├── vitest.config.ts              # Test configuration
├── tsconfig.json                 # TypeScript strict mode
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server (for web testing) |
| `npm run build` | Production build |
| `npm run lint` | ESLint + TypeScript type check (strict mode) |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run typecheck` | TypeScript type check only |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI) |
| `npm test` | Run all Vitest tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:coverage` | Test coverage report |
| `npm run knip` | Fail on unused exports/files (must stay at 0 issues) |
| `npm run tauri dev` | Start Tauri desktop app |
| `npm run tauri build` | Build desktop binaries |
| `cargo fmt --check` (in `src-tauri/`) | Rust formatting check (CI) |
| `cargo clippy --all-targets -- -D warnings` (in `src-tauri/`) | Rust lints incl. tests (CI) |
| `cargo check --locked` (in `src-tauri/`) | Lockfile-aware compile check (CI) |
| `cargo test` (in `src-tauri/`) | Rust tests (CI) |

## Conventions

### TypeScript
- **Strict mode enabled** — all code must pass `tsc --noEmit`
- Use explicit types for all function parameters and returns
- Avoid `any` — use `unknown` or proper interfaces
- Path alias: `@/` maps to project root

### Components
- Functional components (no classes)
- Props interfaces named `{ComponentName}Props`
- Export named functions, not defaults (except App.tsx)
- Use Tailwind utility classes, not inline styles (except dynamic values with `var()`)

### State
- Use Zustand stores in `src/stores/`
- Services in `src/services/` wrap all Tauri `invoke()` calls
- localStorage access goes through try/catch

### Demo / Fallback Mode
- When no `GEMINI_API_KEY` is set, all AI features fall back to realistic demo data
- Demo mode indicator shown in header; all fallback data lives in `src-tauri/src/ai/gemini.rs`
- **Ollama first**: every AI command tries the configured local Ollama server before cloud/mock
- **Phone mock mode**: without Twilio credentials, phone-line calls resolve to `SM_mock_*` SIDs with no network — the full War Room phone flow stays playable
- Secrets: API keys travel in `x-goog-api-key` headers (never URLs) and must never be logged

## Database

SQLite via rusqlite. 5 tables:
- `leads` — 12 columns including enriched contact fields
- `call_logs` — transcripts, sentiment, objection tracking
- `campaigns` — lead hunting campaigns
- `lead_notes` — freeform notes per lead
- `activities` — activity log

Migrations run automatically via `run_migrations()` in schema.rs and are idempotent. Seed data (10 leads + 3 call logs + 1 note) inserted on first run. Performance: `PRAGMA busy_timeout=5000`, four indexes (`call_logs(lead_id)`, `call_logs(created_at DESC)`, `lead_notes(lead_id)`, `activities(lead_id)`), `get_call_logs` capped at `LIMIT 500`, `delete_lead` runs in a transaction via `delete_lead_rows`.

## CI/CD

- **CI** (push/PR to main): lint + format + knip + test (Node 20/22) + build + Rust job (`cargo fmt --check`, `clippy --all-targets -D warnings`, `check --locked`, `test`); concurrency-cancelled per ref, job timeouts enforced
- **Security** (push/PR to main + weekly): CodeQL (JS/TS) + `npm audit --omit=dev --audit-level=high` + RustSec `cargo audit` via `.github/workflows/security.yml`
- **Release** (tag v*): builds for macOS/Linux/Windows via GitHub Actions, attaches binaries to draft release
- **Repo infra**: Dependabot (npm + cargo + github-actions), CODEOWNERS, PR/issue templates, stale bot, `SECURITY.md` + `CONTRIBUTING.md`

## Contribution

### Quality gates (all must pass before committing)

```bash
npm run typecheck && npm run lint && npm run format:check && npm run knip && npm test && npm run build
# then in src-tauri/:
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && cargo check --locked
```

Known baseline: 21 `no-explicit-any` ESLint warnings (accepted; do not add new ones).

### Release checklist

1. All quality gates above are green
2. Version bumped in `package.json` and `src-tauri/tauri.conf.json`
3. README / AGENTS.md stats refreshed (tests, LOC, commands)
4. Tag `vX.Y.Z` — the Release workflow builds macOS/Linux/Windows binaries and attaches them to a draft release
5. Smoke test the draft binary: demo mode boots, mock phone line places a call, Settings persists
