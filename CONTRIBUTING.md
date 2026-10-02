# Contributing to OpenCloser

Thanks for helping build an open, local-first AI sales platform.

## Getting started

```bash
git clone https://github.com/issacops/opencloser-v2.git
cd opencloser-v2
npm install
npm run tauri dev
```

Works with **zero API keys** (demo mode) — explore everything before wiring up providers.

## Quality gates (run before committing)

```bash
npm run typecheck && npm run lint && npm run format:check && npm run knip && npm test && npm run build
# then in src-tauri/:
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && cargo check --locked
```

Known baseline: 21 `no-explicit-any` ESLint warnings (accepted — don't add new ones).

## Pull requests

1. Fork + feature branch (`feat/…`, `fix/…`, `chore/…`)
2. Tests for new behavior; keep existing suites green
3. Fill in the PR template's test plan
4. Update `AGENTS.md` when adding directories, scripts, or patterns

## Where things live

- `src/features/` — feature UIs (`crm`, `voice`, `hunter`, `onboarding`)
- `src/services/` — every Tauri `invoke()` wrapper
- `src-tauri/src/` — Rust backend (`ai/`, `twilio/`, `db/`, `relay/`)
- Full architecture and conventions: [`AGENTS.md`](AGENTS.md)

## Reporting bugs / security

- Bugs & features: GitHub Issues templates
- Security: see [`SECURITY.md`](SECURITY.md) — private disclosure only
