# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Use GitHub's private reporting instead:

**[Report a vulnerability →](https://github.com/issacops/opencloser-v2/security/advisories/new)**

What qualifies:

- Remote code execution, path traversal, or SQL injection
- Secrets (API keys, Twilio credentials) leaking to logs, URLs, or other users
- Audio/transcript data leaving the machine without user consent
- Supply-chain or update-mechanism tampering

Expected response: acknowledgement within 7 days, coordinated disclosure after a fix ships.

## Design notes

- All AI provider keys travel in `x-goog-api-key`-style headers — never in URLs — and must never be logged.
- Twilio credentials live in `localStorage` and are only sent to `api.twilio.com`.
- The app binds its media-stream and relay servers to `127.0.0.1` only; public exposure happens exclusively through an explicit, user-enabled cloudflared tunnel.
