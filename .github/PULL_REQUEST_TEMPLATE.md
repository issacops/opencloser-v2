## Summary

<!-- What changed and why. Link related issues: Fixes #123 -->

## Quality gates

- [ ] `npm run typecheck && npm run lint && npm run format:check && npm run knip && npm test && npm run build`
- [ ] Rust (in `src-tauri/`): `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && cargo check --locked`
- [ ] New/changed behavior covered by tests
- [ ] `AGENTS.md` updated if directories, scripts, or patterns changed

## Test plan

<!-- How did you verify this? e.g. ran demo mode, placed mock phone line, tested Settings persistence -->
