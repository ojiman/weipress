# TASKS.md — weipress implementation checklist

Mark completed tasks with `[x]`.
Claude Code: work top-to-bottom, one phase at a time. Do not skip ahead.

---

## Phase 0: Manual setup (do this before writing any code)

> These steps are for Norio to complete manually — not Claude Code.

- [x] **P0-1** Create GitHub repository
  - Name: `weipress`
  - `.gitignore`: use the Node template
  - Initialize with a `README.md`

- [x] **P0-2** Get Base Sepolia USDC from faucet
  - Circle faucet (easiest): https://faucet.circle.com
  - Add Base Sepolia network to MetaMask (Chain ID: 84532, RPC: https://sepolia.base.org)
  - Target: at least 1 USDC for testing

- [x] **P0-3** Create a dedicated agent test wallet
  - Add a new account in MetaMask → export the private key
  - Send some Base Sepolia USDC to this wallet from P0-2
  - ⚠️ This private key goes in `client-agent/.env` only — never commit it

- [x] **P0-4** Verify CDP Facilitator access
  - Open https://x402.org/facilitator — no auth required for testnet
  - Optionally create a CDP account at https://portal.cdp.coinbase.com (free tier is enough)

---

## Phase 1: Monorepo scaffold

> Tell Claude Code: "Implement TASKS.md Phase 1"

- [x] **P1-1** Create root `package.json` with npm workspaces
  ```json
  {
    "name": "weipress",
    "private": true,
    "workspaces": ["server", "client-human", "client-agent"]
  }
  ```

- [x] **P1-2** Create root `.gitignore`
  - Include: `node_modules/`, `.env`, `dist/`, `.next/`

- [x] **P1-3** Scaffold each component directory with `package.json`
  - `server/package.json`
  - `client-human/package.json`
  - `client-agent/package.json`
  - Each must include `"type": "module"`

- [x] **P1-4** Add `tsconfig.json` to each component
  - `strict: true`
  - `target: ES2022`
  - `moduleResolution: node16` (server, agent) or `bundler` (client-human)

- [x] **P1-5** Create `.env.example` in each component
  - Follow the templates in CLAUDE.md

---

## Phase 2: Server (core x402 flow)

> Tell Claude Code: "Implement TASKS.md Phase 2. Follow api-spec.md exactly for all response shapes."

- [x] **P2-1** `server/src/content/articles.ts` — dummy article data
  - Article ID: `boj-2026`  (fictional BoJ policy analysis)
  - Section 0: free lead (~300 words of dummy Japanese-style financial text)
  - Sections 1–3: standard paid sections (~400–600 words each)
  - Section 4: premium paid section (~500 words)
  - Define types: `Article`, `Section`, `SectionTier` — no `any`

- [x] **P2-2** `server/src/config/x402.ts` — payment config
  - Read `RECEIVER_ADDRESS`, `NETWORK`, `USDC_ADDRESS` from env
  - Export a `sectionPricing` map keyed by section ID
  - Use the price table in api-spec.md

- [x] **P2-3** `server/src/routes/articles.ts` — route handlers
  - `GET /article/:articleId/section/:sectionId`
  - Section 0: return content directly (no payment middleware)
  - Sections 1–4: wrap with `paymentMiddleware` from `@x402/express`
  - Response shape must match api-spec.md exactly
  - `GET /articles` — return article listing (free, no payment)
  - `GET /health` — return server status

- [x] **P2-4** `server/src/index.ts` — Express app entry point
  - Port from `process.env.PORT` (default: 3001)
  - CORS: allow `http://localhost:3000` (client-human)
  - Mount routes from P2-3
  - Add a global error handler (log + return 500 JSON)

- [x] **P2-5** Add npm scripts to `server/package.json`
  - `"dev": "tsx watch src/index.ts"`
  - `"build": "tsc"`
  - `"start": "node dist/index.js"`
  - `"test": "node --test src/**/*.test.ts"` (or Jest)

- [x] **P2-6** Smoke test — both of these must pass before moving to Phase 3
  ```bash
  # Free section → 200 OK
  curl -i http://localhost:3001/article/boj-2026/section/0

  # Paid section → 402 Payment Required with X-PAYMENT-REQUIRED header
  curl -i http://localhost:3001/article/boj-2026/section/1
  ```

---

## Phase 3: AI agent script

> Tell Claude Code: "Implement TASKS.md Phase 3. Assume the Phase 2 server is running on localhost:3001."

- [ ] **P3-1** `client-agent/src/wallet.ts` — Viem wallet setup
  - Load `AGENT_PRIVATE_KEY` from env → `privateKeyToAccount`
  - Create `walletClient` (Base Sepolia)
  - Create `publicClient` (for balance checks)
  - On startup: log wallet address and USDC balance

- [ ] **P3-2** `client-agent/src/agent.ts` — main script
  - Use `wrapFetchWithX402` from `@x402/fetch` for automatic payment handling
  - Fetch sections 1, 2, 3 of `boj-2026` sequentially
  - After each section: log the tx hash and amount paid
  - At the end: print a summary box (sections read + total USDC paid)
  - Expected console output format:
    ```
    [weipress-agent] Wallet: 0x...  Balance: 0.xx USDC
    [weipress-agent] Fetching section 1...
      → 402 received  price: 0.05 USDC
      → Signing EIP-3009 authorization...
      → Payment submitted  tx: 0x...  ✅
      → Content received (NNN words)
    ...
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Sections fetched : 3
      Total paid       : 0.20 USDC
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ```

- [ ] **P3-3** Add npm script: `"agent": "tsx src/agent.ts"` in `client-agent/package.json`

- [ ] **P3-4** Run and verify
  ```bash
  cd client-agent && npm run agent
  ```
  Confirm: 3 sections fetched, tx hashes logged, total printed.

---

## Phase 4: Browser UI

> Tell Claude Code: "Implement TASKS.md Phase 4. Assume the Phase 2 server is running on localhost:3001."

- [ ] **P4-1** Initialize Next.js app in `client-human/`
  - TypeScript + Tailwind CSS + App Router
  - Add `wagmi` v2 and `@rainbow-me/rainbowkit` for wallet connection

- [ ] **P4-2** `client-human/src/app/layout.tsx` — Web3 providers
  - Wrap with `WagmiProvider` and `RainbowKitProvider`
  - Configure Base Sepolia chain

- [ ] **P4-3** `client-human/src/components/ArticleSection.tsx`
  - Props: `articleId`, `sectionId`, `price` (display string)
  - Locked state: price label + "Read" button
  - On click: call `wrapFetchWithX402(fetch, walletClient)` to pay and fetch
  - Unlocked state: render content + `Paid ✅  tx: 0x...` badge
  - Loading state: spinner + "Processing payment..."

- [ ] **P4-4** `client-human/src/app/page.tsx` — article page
  - Show article title + free lead (section 0, fetch on load)
  - Render sections 1–4 as `<ArticleSection>` components
  - Top-right: `<ConnectButton>` from RainbowKit

- [ ] **P4-5** Manual verification
  - Open http://localhost:3000
  - Connect MetaMask on Base Sepolia
  - Click "Read" → MetaMask dialog appears → Sign → content appears
  - Check the tx badge links to Base Sepolia Explorer

---

## Phase 5: Polish for demo

- [ ] **P5-1** Update `README.md` with end-to-end demo steps

- [ ] **P5-2** Style the agent output (emojis, elapsed time per section)

- [ ] **P5-3** Style server logs (color-coded: 402 issued / verified / served)

- [ ] **P5-4** Final checklist
  - [ ] `curl` returns 402 for paid sections ✅
  - [ ] Agent script fetches 3 sections and prints tx hashes ✅
  - [ ] Browser: MetaMask sign → content appears ✅
  - [ ] All tx visible on Base Sepolia Explorer ✅

---

## Rules for Claude Code

1. **api-spec.md is the contract** — never change response shapes unilaterally
2. **All secrets via env** — no hardcoded addresses or keys
3. **Commit per task** — prefix with task ID (e.g. `feat: P2-3 article routes`)
4. **No `// @ts-ignore`** — fix type errors
5. **Run smoke tests before advancing** — don't move to the next phase until curl/npm test passes
