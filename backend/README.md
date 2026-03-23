# ShadowSwap Backend

Production-grade backend module for ShadowSwap, aligned to the backend engineering spec:

- `ShadowOrderBook`: encrypted-order-style matching core
- `ShadowVault`: escrow and controlled fund release
- `ShadowSettlement`: decryption-relay settlement executor
- Keeper services for off-chain matching and settlement relaying
- Hardhat test suite (unit + integration)

## Structure

- `contracts/core`: main contracts
- `contracts/interfaces`: cross-contract interfaces
- `contracts/libraries`: reusable logic
- `contracts/mocks`: local test contracts
- `test/unit` + `test/integration`: contract tests
- `keeper/src`: matching and settlement watchers
- `scripts`: deploy / verify / seed

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run compile
npm run test
```

## Deploy (Arbitrum Sepolia)

```bash
npm run deploy:arb-sepolia
npm run verify:arb-sepolia
```

Deployment output is written to `backend/deployments/<network>.json`.

## Keeper

```bash
npm run keeper
```

Required env vars:

- `KEEPER_PK`
- `ORDER_BOOK_ADDRESS`
- `SETTLEMENT_ADDRESS`
- `RPC_URL`

## Notes

- Precision model follows 8-decimal order math for price/amount and 18-decimal ERC20 transfer units.
- Settlement is executed only by the configured decryption oracle (keeper/owner).
- Partial fills are preserved as active residual orders.
