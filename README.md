
# Restaurant Table Tracker (React + Vite + Tailwind)

A simple mobile-friendly app to manage restaurant tables by area (Main Bar, Bowling, Dining, Patio). Features:
- Edit Layout mode with **drag-to-snap grid**
- Per-area **background image upload** (use your floor plan photo)
- Quick **status cycle** (Empty → Sat → Food → Touched)
- **Server name** input per table
- Auto-save to local storage

## Run locally
```bash
npm install
npm run dev
```

## Build for production
```bash
npm run build
npm run preview
```

## Deploy anywhere
Use the `dist` folder after build. You can host it on Netlify, Vercel, GitHub Pages, etc.

## How to put this on GitHub (web UI, no git commands)
1. Create a new repo on GitHub (e.g., `table-tracker`).
2. Click **Add file → Upload files**.
3. Drag **all files and folders** from this project (not the ZIP itself) into the uploader, then **Commit**.
4. Visit CodeSandbox → **Create Sandbox** → **Import from GitHub** and paste your repo URL.
5. When it opens, click **Run**. You’ll get a shareable link.

## Files
- `index.html`, `package.json`, `vite` config (built-in)
- `src/App.jsx` — the whole app
- `src/main.jsx` — entry point
- `src/index.css` — Tailwind
- `tailwind.config.js`, `postcss.config.js` — Tailwind setup
