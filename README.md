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

## Backend Module

A complete backend implementation is included under [backend](C:/Users/bbook/Desktop/shadowswap/backend):

- Smart contracts (`ShadowOrderBook`, `ShadowVault`, `ShadowSettlement`)
- Hardhat tests (unit + integration)
- Deployment and verification scripts
- Keeper services (`matchingKeeper`, `settlementWatcher`)

Backend quick start:

1. `cd backend`
2. `npm install`
3. `cp .env.example .env`
4. `npm run compile`
5. `npm run test`

## Frontend Contract Wiring

The frontend now submits orders directly to `ShadowOrderBook` and listens to live events.

- Contract config source order:
  1. `VITE_*` env values
  2. [backend/deployments/arbitrumSepolia.json](C:/Users/bbook/Desktop/shadowswap/backend/deployments/arbitrumSepolia.json)
- Set these in `.env.local` (or update the deployment JSON after backend deploy):
  - `VITE_ORDER_BOOK_ADDRESS`
  - `VITE_VAULT_ADDRESS`
  - `VITE_SETTLEMENT_ADDRESS`
  - `VITE_CHAIN_ID`
  - `VITE_RPC_URL`

After backend deployment, sync addresses by updating `backend/deployments/arbitrumSepolia.json` or `.env.local`.
