# ShadowSwap

ShadowSwap is a Vite + React + TypeScript frontend prototype for a privacy-focused DEX interface. It includes:

- Landing and product narrative pages
- Trading terminal UI
- Portfolio and analytics views
- Wallet-auth style modal flow
- Animated 3D and motion-rich UI components

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion
- Three.js

## Local Development

Prerequisites: Node.js 20+ and npm.

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set:
   `GEMINI_API_KEY=...`
3. Start development server:
   `npm run dev`
4. Type-check:
   `npm run lint`
5. Build for production:
   `npm run build`

## Deploy On Vercel

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repo.
3. Set framework preset to `Vite` (auto-detected in most cases).
4. Add environment variable:
   `GEMINI_API_KEY`
5. Deploy.

Vercel build settings used by this repo:
- Build command: `npm run build`
- Output directory: `dist`
