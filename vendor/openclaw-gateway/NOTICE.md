# OpenClaw Gateway Runtime

This directory vendors the OpenClaw npm package runtime used by MineEcho's PI/Gateway compatibility layer.

- Source package: openclaw@2026.5.27
- Source repository: git+https://github.com/openclaw/openclaw.git
- License: MIT

MineEcho keeps this runtime source in-repository so local users do not need to install OpenClaw separately. Third-party dependencies are installed by `npm run install:apps` into this directory's local `node_modules`, which is not committed.

To refresh this runtime, run:

```sh
npm run vendor:openclaw
npm --prefix vendor/openclaw-gateway install
```
