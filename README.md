# weipress

> Pay per word. In wei.

A personal PoC exploring [x402](https://github.com/coinbase/x402) — the HTTP 402 Payment Required protocol — for section-level micropayments on a fictional financial news portal.

---

## What is x402?

x402 turns a standard HTTP response into a payment request. A server returns `402 Payment Required` with a signed payment spec in the header. The client pays (via USDC on Base), retries the request with a payment proof, and gets the content. No subscriptions, no API keys, no payment processor in the critical path.

```
Client → GET /article/boj-2026/section/1
Server ← 402  { price: "0.05 USDC", payTo: "0x...", network: "Base Sepolia" }
Client → [signs EIP-3009 authorization via MetaMask or wallet script]
Client → GET /article/boj-2026/section/1  +  X-PAYMENT: <signed payload>
Server ← 200  { content: "..." }
```

What makes it interesting: **an AI agent can do all of this autonomously**, with no human in the loop.

---

## Stack

| | |
|---|---|
| Protocol | x402 V2 (`@x402/express`, `@x402/fetch`) |
| Chain | Base Sepolia (testnet) |
| Token | USDC via EIP-3009 — gasless signature payments |
| Facilitator | [CDP](https://x402.org/facilitator) |
| Server | Node.js + Express |
| Browser client | Next.js 14 + wagmi + RainbowKit |
| Agent client | Viem + `@x402/fetch` script |

---

## Repository Layout

```
weipress/
├── server/         Express server with x402 middleware
├── client-human/   Next.js UI — pay with MetaMask
└── client-agent/   Autonomous payment script
```

---

## Prerequisites

- Node.js v20+
- MetaMask with **Base Sepolia** network added
  - Chain ID: `84532`
  - RPC: `https://sepolia.base.org`
- Base Sepolia USDC — get some from [faucet.circle.com](https://faucet.circle.com)
- A second wallet (for the agent script) with a small USDC balance

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/<you>/weipress.git
cd weipress
npm install
```

### 2. Configure environment variables

```bash
# server
cp server/.env.example server/.env
# → set RECEIVER_ADDRESS to your MetaMask wallet

# agent
cp client-agent/.env.example client-agent/.env
# → set AGENT_PRIVATE_KEY to your test wallet private key
```

### 3. Start the server

```bash
cd server && npm run dev
```

Verify it's working:

```bash
# Free section → 200 OK
curl -i http://localhost:3001/article/boj-2026/section/0

# Paid section → 402 Payment Required
curl -i http://localhost:3001/article/boj-2026/section/1
```

### 4. Run the AI agent

```bash
cd client-agent && npm run agent
```

Expected output:

```
[weipress-agent] Wallet: 0xABCD...  Balance: 0.85 USDC
[weipress-agent] Fetching section 1...
  → 402 received  price: 0.05 USDC
  → Signing EIP-3009 authorization...
  → Payment submitted  tx: 0x1a2b3c...  ✅
  → Content received (412 words)
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sections fetched : 3
  Total paid       : 0.20 USDC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Open the browser UI

```bash
cd client-human && npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect MetaMask, and click **Read for 0.05 USDC**.

---

## Article Structure (Demo Content)

All content is fictional — used only as a demo vehicle.

```
"BoJ Policy 2026 — Scenarios and Asset Allocation"

Section 0  FREE      Lead paragraph
Section 1  0.05 USDC Macro Environment Overview
Section 2  0.05 USDC BoJ Scenario Simulations
Section 3  0.10 USDC Asset Class Impact Analysis
Section 4  0.20 USDC Economist Commentary (Premium)
```

---

## Why "weipress"?

`wei` — the smallest unit of ETH. `press` — as in news press.
Paying for news in the smallest possible unit, on programmable rails.

---

## References

- [coinbase/x402](https://github.com/coinbase/x402)
- [x402 exact scheme spec (EVM)](https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md)
- [Cloudflare Agents + x402](https://developers.cloudflare.com/agents/x402/)
- [Base Sepolia Explorer](https://sepolia.basescan.org)

---

*Testnet only. This is a personal technical exploration — not affiliated with any organization.*
