# BIDFORGE

BIDFORGE is a local bid-writing workbench with a Vite/React frontend and an Express-based local runner API.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```powershell
npm install
```

## Start

On Windows, double-click:

```text
启动BIDFORGE.bat
```

Or run the services manually in two terminals:

```powershell
npm run server
npm run dev -- --port 5186 --strictPort
```

Then open:

```text
http://127.0.0.1:5186
```

## Build Check

```powershell
npm run build
```

## Local Files

The repository intentionally ignores generated output and local-only files:

- `node_modules/`
- `dist/`
- `runs/`
- `.tmp/`
- `.env`, `.env.local`
- Edge browser test profiles and generated BIDFORGE screenshots

Keep API keys and provider secrets in `.env` or `.env.local`; do not commit them.
