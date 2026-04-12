# TASKS.md — weipress x402 PoC

> **Claude Code**: Read this file at session start. Update status inline — never append-only.
> See CLAUDE.md §Task Management for update rules.

---

## In Progress

*(nothing currently in flight)*

---

## Next

- [x] **P3-4** Run and verify — all 3 sections succeed ✅
  - Root cause: CDP Facilitator RPC lags ~5–10s behind agent's RPC on Base Sepolia
  - Fix: `waitForTransactionReceipt` + 10s sleep between sections in `agent.ts`
  - Confirmed: sections 1/2/3 all paid and content received (327/405/500 words)

---

## Backlog

### Phase 4: Browser UI
> Assume Phase 2 server is running on localhost:3001.

- [ ] **P4-1** Initialize Next.js app in `client-human/`
  - TypeScript + Tailwind CSS + App Router
  - Add `wagmi` v2 and `@rainbow-me/rainbowkit` for wallet connection

- [ ] **P4-2** `client-human/src/app/layout.tsx` — Web3 providers
  - Wrap with `WagmiProvider` and `RainbowKitProvider`
  - Configure Base Sepolia chain

- [ ] **P4-3** `client-human/src/components/ArticleSection.tsx`
  - Props: `articleId`, `sectionId`, `price` (display string)
  - Locked state: price label + "Read" button
  - On click: `wrapFetchWithX402(fetch, walletClient)` to pay and fetch
  - Unlocked state: content + `Paid ✅  tx: 0x...` badge
  - Loading state: spinner + "Processing payment..."

- [ ] **P4-4** `client-human/src/app/page.tsx` — article page
  - Fetch section 0 on load (free)
  - Render sections 1–4 as `<ArticleSection>` components
  - Top-right: `<ConnectButton>` from RainbowKit

- [ ] **P4-5** Manual verification
  - Open http://localhost:3000 → connect MetaMask (Base Sepolia)
  - Click "Read" → MetaMask signs → content appears with tx badge

### Phase 5: Polish for demo

- [ ] **P5-1** Update `README.md` with end-to-end demo steps

- [ ] **P5-2** Style agent output (emojis, elapsed time per section)

- [ ] **P5-3** Style server logs (color-coded: 402 issued / verified / served)

- [ ] **P5-4** Final checklist
  - [ ] `curl` returns 402 for paid sections
  - [ ] Agent script fetches 3 sections and prints tx hashes
  - [ ] Browser: MetaMask sign → content appears
  - [ ] All tx visible on Base Sepolia Explorer

---

## Discovered

*(none yet — add here when unexpected tasks surface during implementation)*

---

## Blocked

*(none)*

---

## Done

### Phase 0: Manual setup

- [x] **P0-1** Create GitHub repository (`weipress`, Node .gitignore, README)
- [x] **P0-2** Get Base Sepolia USDC from faucet (Circle faucet, MetaMask Base Sepolia)
- [x] **P0-3** Create dedicated agent test wallet; fund from P0-2; private key → `client-agent/.env` only
- [x] **P0-4** Verify CDP Facilitator access — testnet requires no auth; `@x402/express` calls it automatically

### Phase 1: Monorepo scaffold

- [x] **P1-1** Root `package.json` with npm workspaces (`server`, `client-human`, `client-agent`)
- [x] **P1-2** Root `.gitignore` (Node template — covers `node_modules/`, `.env`, `dist/`, `.next/`)
- [x] **P1-3** `package.json` (`"type": "module"`) for each component
- [x] **P1-4** `tsconfig.json` (strict, ES2022; `node16` for server/agent, `bundler` for client-human)
- [x] **P1-5** `.env.example` for server and client-agent

### Phase 3: client-agent

- [x] **P3-1** `client-agent/src/wallet.ts` — viem wallet + `toClientEvmSigner`
  - `privateKeyToAccount` → walletClient / publicClient / evmSigner
  - Adapts viem signTypedData to `ClientEvmSigner` interface (`@x402/evm`)
  - `logWalletInfo()` reads USDC balance via ERC-20 balanceOf
- [x] **P3-2** `client-agent/src/agent.ts` — main payment script
  - Uses `wrapFetchWithPayment` + `x402Client` (actual API, not `wrapFetchWithX402`)
  - `onBeforePaymentCreation` hook logs 402 price + "Signing EIP-3009"
  - Parses `PAYMENT-RESPONSE` / `X-PAYMENT-RESPONSE` header for tx hash
  - Fetches sections 1, 2, 3 sequentially; prints summary
- [x] **P3-3** npm script `"agent": "tsx src/agent.ts"` — confirmed present

### Phase 2: Server (core x402 flow)

- [x] **P2-1** `server/src/content/articles.ts` — types + dummy article `boj-2026` (5 sections)
- [x] **P2-2** `server/src/config/x402.ts` — payment config from env; `sectionPricing` map
- [x] **P2-3** `server/src/routes/articles.ts` — `/health`, `/articles`, `/article/:id/section/:sid`
  - Section 0 free; sections 1–4 behind `paymentMiddleware` from `@x402/express`
  - Note: SDK uses `PAYMENT-REQUIRED` header (not `X-PAYMENT-REQUIRED`) in v2.x
- [x] **P2-4** `server/src/index.ts` — Express, CORS, global error handler, port 3001
- [x] **P2-5** npm scripts: `dev` / `build` / `start` / `test`
  - Also fixed `@x402/*` package versions to `^2.8.0` (v0.1.0 did not exist on npm)
- [x] **P2-6** Smoke tests passed:
  - `GET /article/boj-2026/section/0` → 200 OK ✅
  - `GET /article/boj-2026/section/1` → 402 + `PAYMENT-REQUIRED` header ✅
