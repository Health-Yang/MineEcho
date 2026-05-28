## Summary

Describe the user-facing change and why it is needed.

## Verification

List the commands you ran and their results.

```sh
npm run verify
npm run check:release
npm run check:versions
```

## Runtime Data and Secrets

- [ ] I did not include `.env`, `.mineecho/`, `.openclaw/`, `apps/**/workspace/`, local databases, logs, imported documents, recordings, tokens, or private AI app config.
- [ ] I updated docs when commands, ports, environment variables, runtime paths, or compatibility boundaries changed.

## Compatibility

- [ ] I did not rename OpenClaw Gateway compatibility paths/configs without a compatibility plan.
- [ ] Any legacy variable or path kept in this PR is intentionally preserved for compatibility.
