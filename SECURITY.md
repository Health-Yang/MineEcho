# Security Policy

MineEcho is local-first, so many security issues involve local runtime data, credentials, imported documents, AI app configuration, or Gateway compatibility state. Treat anything under `.mineecho/`, `.openclaw/`, and `apps/**/workspace/` as private by default.

## Supported Versions

MineEcho is pre-1.0. Security fixes target the current `main` branch unless a release branch is explicitly announced later.

## Reporting a Vulnerability

If you find a vulnerability, do not publish a public proof of concept before maintainers have had time to respond.

Report privately by email:

- Email: `yk565628110@163.com`

Include:

- A concise description of the issue.
- Affected commit, branch, or release.
- Reproduction steps using placeholder credentials and non-private sample data.
- Impact assessment: secret disclosure, local data exposure, remote code execution, prompt injection, privilege bypass, or denial of service.
- Any relevant logs with tokens, personal data, company data, file paths, and session ids redacted.

If email is unavailable, open a minimal public issue that says a private security report is needed, without exploit details or secrets.

## Sensitive Data

Never include these in issues, pull requests, screenshots, logs, or shared repro archives:

- API keys, provider tokens, Gateway tokens, enterprise user tokens, cookies, or auth headers.
- `.env`, `.env.*`, `.mineecho/`, `.openclaw/`, or `apps/**/workspace/`.
- Imported documents, generated knowledge-base pages, graph data, chat history, meeting recordings, or memory files.
- Real AI app endpoints that expose private infrastructure.

Run before publishing or sharing a branch:

```sh
npm run check:release
```

For local diagnostics that should not fail the command:

```sh
node scripts/check-release.mjs --warn-only
```

## Scope

In scope:

- Credential leakage through runtime files, logs, API responses, or packaged artifacts.
- Unsafe skill import or package extraction behavior.
- AI app connector behavior that leaks configured secrets.
- Knowledge-base import paths that expose local files unexpectedly.
- Gateway compatibility behavior that bypasses expected auth or isolation.
- Prompt injection paths that can exfiltrate stored private data or credentials.

Out of scope:

- Attacks that require committing your own malicious local `.env` or runtime data.
- Issues only affecting unsupported third-party providers outside MineEcho's integration boundary.
- Denial-of-service reports based only on intentionally extreme local workloads without a realistic mitigation.

## Maintainer Response

Expected handling:

- Acknowledge the report when maintainers see it.
- Reproduce and classify severity.
- Prepare a fix, mitigation, or documentation update.
- Credit reporters when requested and appropriate.

Do not include real secrets or private user/company data in regression tests.
