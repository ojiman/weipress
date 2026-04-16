# weipress — x402 News Micropayment PoC
## Design Document

**Status:** Draft v0.4
**Created:** 2026-03-29
**Author:** ojiman (personal project / tech exploration)
**Audience:** Self-reference, technical peers

---

## Table of Contents

0. [Why This PoC Exists](#0-why-this-poc-exists)
1. [Background](#1-background)
2. [Demo Content: A Fictional Financial News Portal](#2-demo-content-a-fictional-financial-news-portal)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Payment Design — Section-level Exact Scheme](#5-payment-design--section-level-exact-scheme)
6. [Client Design — Human + AI Agent](#6-client-design--human--ai-agent)
7. [Demo Walkthrough](#7-demo-walkthrough)
8. [Open Questions & Future Work](#8-open-questions--future-work)

---

## 0. Why This PoC Exists

> **tl;dr:** x402 turns HTTP into a payment-native protocol. This PoC is a hands-on way to understand what that actually means for content monetization and AI agent autonomy.

### 0.1 The x402 Moment

The x402 protocol (HTTP 402 Payment Required) has quietly become one of the more interesting primitives to emerge in 2025–2026. It lets any HTTP server demand payment before serving content — without API keys, subscriptions, or a payment processor in the critical path.

What makes this worth exploring:

- **Microtransactions finally work.** USDC on Base settles for fractions of a cent. A $0.05 article section is economically viable for the first time.
- **AI agents are first-class citizens.** An LLM agent can discover, pay for, and consume content autonomously — no human in the loop, no pre-issued credentials.
- **The standard is converging.** Coinbase shipped `@x402/express`. On-chain settlement for traditional assets is moving from "crypto curiosity" to infrastructure-layer consideration. The primitive is hardening.

### 0.2 What This PoC Explores

```
Three concrete questions:

1. How hard is it actually to put x402 in front of a content endpoint?
   → Build it and find out.

2. Can a script wallet autonomously pay for and consume content?
   → Implement a minimal AI-agent-style script with Viem + @x402/fetch.

3. What does the UX look like for a human paying with MetaMask?
   → Build a Next.js frontend and click through the flow.
```

### 0.3 Scope (Personal PoC, Not Production)

| In scope | Out of scope |
|---|---|
| Base Sepolia testnet only | Mainnet deployment |
| Hardcoded dummy content | Real content pipeline |
| Wallet signature = only auth | JWT, OAuth, user accounts |
| In-memory state | Database persistence |
| Understanding the protocol | Business case analysis |

---

## 1. Background

### 1.1 Context

Blockchain-based payment rails are moving from "crypto curiosity" to infrastructure-layer consideration. x402 addresses a much simpler problem: **HTTP-native micropayments**. The underlying primitive — EVM-compatible chains + stablecoins + programmable settlement — is the same.

### 1.2 The Problem x402 Solves

Traditional content monetization is stuck between two extremes:

```
Monthly subscription ($)          ←→          Everything free
• User pays for ~5% of content               • No monetization at all
• No machine-readable payment API            • No API key for agents either
• $0.30 floor cost kills micro-billing       • Ad-supported or nothing
```

x402 opens the middle ground: **pay per section, pay per API call, pay per inference** — with no minimum transaction cost at L2 scale.

### 1.3 PoC Goals

| Goal | Definition of done |
|---|---|
| Protocol understanding | End-to-end x402 flow works in local dev |
| Agent payment | Script wallet pays autonomously, no human prompt |
| Human UX | MetaMask signs, content appears in browser |
| Explainability | Can demo the flow to a technically curious audience in < 5 min |

---

## 2. Demo Content: A Fictional Financial News Portal

### 2.1 Why Financial News as Demo Content

Financial analysis is a natural fit for micropayments: readers often want one specific article (a central bank decision, an earnings preview), not a full subscription. The content also has clear tiers — a free lead, a standard analysis section, a premium economist take.

This PoC uses a **fictional news portal** ("WealthStyle News") as the content layer. The articles are entirely fabricated. The portal is not affiliated with any real publisher.

### 2.2 Demo Article Structure

```
Article: "BoJ Policy 2026 — Scenarios and Asset Allocation"
│
├── [FREE]         Section 0: Lead (300 words) — available without payment
├── [0.05 USDC]   Section 1: Macro Environment Overview
├── [0.05 USDC]   Section 2: BoJ Scenario Simulations
├── [0.10 USDC]   Section 3: Asset Class Impact Analysis
└── [0.20 USDC]   Section 4: Economist Commentary (Premium)
```

### 2.3 Content Tier Design

| Section Type | Price (USDC) | Rationale |
|---|---|---|
| Free lead | 0.000 | Hook the reader, demonstrate the model |
| Standard | 0.050 | ~¥7.5 — below any card processing floor |
| Detail | 0.100 | Richer analysis, still impulse-buy range |
| Premium | 0.200 | Expert opinion, higher willingness-to-pay |
| Full bundle | 0.300 | All paid sections (~15% discount) |

---

## 3. Tech Stack

### 3.1 Core Dependencies

| Layer | Choice | Reason |
|---|---|---|
| Payment protocol | x402 V2 | HTTP-native, agent-friendly, open standard |
| Blockchain | Base Sepolia (testnet) | Low fees, Coinbase ecosystem, EVM-compatible |
| Payment token | USDC (EIP-3009) | Stablecoin, gasless signature support |
| Facilitator | CDP / `https://x402.org/facilitator` | Free tier, KYT/OFAC included |
| Server | Node.js + Express + `@x402/express` | Official SDK, minimal setup |
| Frontend | Next.js 14 App Router + `@x402/next` | SSR, wagmi integration |
| EVM library | Viem v2 | Type-safe, modern, no ethers.js |
| Agent client | Viem + `@x402/fetch` | Programmatic signing |

### 3.2 Key npm Packages

```json
{
  "dependencies": {
    "@x402/express": "latest",
    "@x402/fetch":   "latest",
    "@x402/core":    "latest",
    "@x402/evm":     "latest",
    "express":       "^4.x",
    "viem":          "^2.x"
  }
}
```

---

## 4. System Architecture

### 4.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────────────────┐   │
│  │   Human (Browser)│        │       AI Agent Script        │   │
│  │  MetaMask Wallet │        │  Viem + @x402/fetch          │   │
│  │  Next.js UI      │        │  Private key in .env         │   │
│  └────────┬─────────┘        └──────────────┬───────────────┘   │
└───────────┼──────────────────────────────────┼───────────────────┘
            │ HTTP Request                     │ HTTP Request
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Content Server                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       Node.js / Express  +  @x402/express                │   │
│  │                                                          │   │
│  │  GET /article/:id/section/:sid                           │   │
│  │  ├── section 0 (free)  → 200 OK directly                 │   │
│  │  └── section 1–4 (paid) → 402 Payment Required           │   │
│  │       X-PAYMENT-REQUIRED header (base64)                 │   │
│  │         scheme: "exact"                                  │   │
│  │         network: "eip155:84532"  (Base Sepolia)          │   │
│  │         asset:  USDC contract address                    │   │
│  │         price:  "50000"  (= 0.05 USDC, 6 decimals)       │   │
│  │         payTo:  receiver wallet address                  │   │
│  └──────────────────────────┬─────────────────────────────-┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ /verify  &  /settle
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Facilitator                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       Coinbase Developer Platform (CDP)                  │   │
│  │       https://x402.org/facilitator                       │   │
│  │                                                          │   │
│  │  POST /verify  → validate sig, balance, nonce            │   │
│  │  POST /settle  → broadcast on-chain tx                   │   │
│  │                                                          │   │
│  │  Gas is covered by CDP. USDC transfers are fee-free.     │   │
│  └──────────────────────────┬─────────────────────────────-┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ EIP-3009 transferWithAuthorization
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Blockchain                                │
│                                                                  │
│  Base Sepolia  (chain ID: 84532)                                 │
│  USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e               │
│                                                                  │
│  Settlement recorded on-chain. Auditable by anyone.             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 x402 Payment Flow (Sequence)

```
Client          ContentServer      CDP Facilitator    Base Sepolia
  │                   │                   │                │
  │── GET /section/1 ─►│                   │                │
  │                   │                   │                │
  │◄── 402 + X-PAYMENT-REQUIRED ──────────│                │
  │    {scheme, price, payTo, network}    │                │
  │                   │                   │                │
  │  [wallet signs EIP-3009 authorization]│                │
  │                   │                   │                │
  │── GET /section/1 + X-PAYMENT ────────►│                │
  │                   │── POST /verify ──►│                │
  │                   │◄── 200 verified ──│                │
  │                   │── POST /settle ──►│                │
  │                   │                   │── broadcast ──►│
  │                   │                   │◄── confirmed ──│
  │                   │◄── execution resp ┘                │
  │◄── 200 OK + content ──────────────────│                │
  │    X-PAYMENT-RESPONSE: {txHash, ...}  │                │
```

### 4.3 Repository Layout

```
weipress/
├── CLAUDE.md           ← Claude Code project config (auto-loaded)
├── TASKS.md            ← Ordered implementation checklist
├── api-spec.md         ← Endpoint contract
├── server/             ← Express + @x402/express
│   └── src/
│       ├── index.ts
│       ├── routes/articles.ts
│       ├── content/articles.ts
│       └── config/x402.ts
├── client-human/       ← Next.js browser UI
│   └── src/
│       ├── app/
│       └── components/
└── client-agent/       ← Minimal agent script
    └── src/
        ├── agent.ts
        └── wallet.ts
```

---

## 5. Payment Design — Section-level Exact Scheme

### 5.1 How the Exact Scheme Works

The **exact scheme** transfers a predetermined fixed amount. With USDC + EIP-3009, the user signs an off-chain authorization — the facilitator broadcasts the on-chain transaction. **No gas required from the user.**

```typescript
// Server-side payment config example
const sectionPricing = {
  "GET /article/:id/section/1": {
    accepts: {
      scheme:            "exact",
      network:           "eip155:84532",
      asset:             process.env.USDC_ADDRESS,
      price:             "50000",           // 0.05 USDC (6 decimals)
      payTo:             process.env.RECEIVER_ADDRESS,
      maxTimeoutSeconds: 300,
    },
  },
  "GET /article/:id/section/4": {
    accepts: {
      scheme:            "exact",
      network:           "eip155:84532",
      asset:             process.env.USDC_ADDRESS,
      price:             "200000",          // 0.20 USDC
      payTo:             process.env.RECEIVER_ADDRESS,
      maxTimeoutSeconds: 300,
    },
  },
};
```

### 5.2 Section Price Table

| sectionId | Tier | Price (USDC) | Atomic Units |
|---|---|---|---|
| 0 | free | 0.000 | 0 |
| 1 | standard | 0.050 | 50,000 |
| 2 | standard | 0.050 | 50,000 |
| 3 | detail | 0.100 | 100,000 |
| 4 | premium | 0.200 | 200,000 |

### 5.3 EIP-3009 Gasless Flow

```typescript
// What the client signs (viem signTypedData)
const authorization = {
  from:        userAddress,
  to:          receiverAddress,
  value:       BigInt(50000),
  validAfter:  BigInt(0),
  validBefore: BigInt(Math.floor(Date.now() / 1000) + 300),
  nonce:       crypto.randomBytes(32),
};

// Attached as X-PAYMENT header on the retry request
```

### 5.4 State Model (PoC)

```
PoC (Phase 1):  Stateless. CDP Facilitator handles nonce/replay protection.
                On-chain tx = receipt of payment.

Future:         Redis / DB cache for "already-paid" sections per wallet,
                to avoid re-charging on same-day return visits.
```

---

## 6. Client Design — Human + AI Agent

### 6.1 Human Client (Browser)

#### UX Flow

```
1. Open article page
   → Free lead renders immediately

2. Click "Read for 0.05 USDC"
   → MetaMask signature dialog opens

3. User signs
   → @x402/fetch handles:
        a. Parse 402 response
        b. Generate USDC EIP-3009 signature
        c. Retry with X-PAYMENT header

4. Section content appears
   → "Paid ✅  tx: 0xabc..." badge shown
```

#### Key Component

```typescript
// client-human/src/components/ArticleSection.tsx
"use client";
import { useState } from "react";
import { useWalletClient } from "wagmi";
import { wrapFetchWithX402 } from "@x402/fetch";

export function PaidSection({ articleId, sectionId, price }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const { data: walletClient } = useWalletClient();

  const handleUnlock = async () => {
    setIsPaying(true);
    const fetch402 = wrapFetchWithX402(fetch, walletClient);
    const res = await fetch402(`/api/article/${articleId}/section/${sectionId}`);
    const data = await res.json();
    setContent(data.content);
    setIsPaying(false);
  };

  if (content) return <div>{content}</div>;
  return (
    <div>
      <p>This section costs {price} USDC</p>
      <button onClick={handleUnlock} disabled={isPaying}>
        {isPaying ? "Processing..." : `Read for ${price} USDC`}
      </button>
    </div>
  );
}
```

### 6.2 AI Agent Client (Script)

The most compelling aspect of x402: **a script can pay for and consume content with no human involvement.**

#### How It Works

```
Agent task: "Fetch sections 1–3 of the BoJ article"

1. GET /article/boj-2026/section/1
   → 402 received, payment requirements parsed

2. Viem wallet signs EIP-3009 authorization
   → Fully automated, private key from .env

3. Retry with X-PAYMENT header
   → 200 OK, content returned

4. Repeat for sections 2, 3
   → Each payment ~100ms end-to-end

5. Print summary: sections read + total USDC paid
```

#### Agent Script

```typescript
// client-agent/src/agent.ts
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithX402 } from "@x402/fetch";

const account = privateKeyToAccount(
  process.env.AGENT_PRIVATE_KEY as `0x${string}`
);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

const fetch402 = wrapFetchWithX402(fetch, walletClient);

async function fetchSection(articleId: string, sectionId: number) {
  const res = await fetch402(
    `${process.env.SERVER_URL}/article/${articleId}/section/${sectionId}`
  );
  return res.json();
}

// Main: fetch sections 1–3 autonomously
const sections = await Promise.all(
  [1, 2, 3].map(id => fetchSection("boj-2026", id))
);
```

#### Human vs. Agent Comparison

| | Human (Browser) | AI Agent (Script) |
|---|---|---|
| Auth | MetaMask signature dialog | Automatic private key signing |
| Payment approval | Per-click, user confirms | Automated within configured limit |
| Speed | Seconds (user interaction) | ~100ms per section |
| API key needed | No | No |
| On-chain receipt | Yes | Yes (same standard) |

---

## 7. Demo Walkthrough

### 7.1 What Makes a Good x402 Demo

The goal is to make **the protocol self-evident** — anyone watching should immediately understand what happened without needing to know blockchain. Two scenes do this well.

### 7.2 Scene 1: Browser Flow (~3 min)

Open the demo app. Article loads with the free lead visible. Other sections show a lock icon and price.

Click "Read for 0.05 USDC" on section 1. MetaMask popup appears.

Click Sign. Section content appears within ~1 second.

Show the footer: `Paid ✅  0.05 USDC  |  tx: 0x1a2b...` — link opens Base Sepolia Explorer, tx is on-chain.

> Key point to highlight: no login, no credit card, no subscription. Just a wallet signature.

### 7.3 Scene 2: Agent Autonomous Payment (~3 min)

Run the agent script in a terminal:

```bash
$ npm run agent

[weipress-agent] Wallet: 0xABCD...  Balance: 0.85 USDC
[weipress-agent] Fetching section 1...
  → 402 received  price: 0.05 USDC
  → Signing EIP-3009 authorization...
  → Payment submitted  tx: 0x1a2b3c...  ✅
  → Content received (412 words)

[weipress-agent] Fetching section 2...
  → 402 received  price: 0.05 USDC
  → Payment submitted  tx: 0x4d5e6f...  ✅
  → Content received (389 words)

[weipress-agent] Fetching section 3...
  → 402 received  price: 0.10 USDC
  → Payment submitted  tx: 0x7g8h9i...  ✅
  → Content received (531 words)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sections fetched : 3
  Total paid       : 0.20 USDC  (~¥30)
  Wallet balance   : 0.65 USDC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> Key point: the agent had no pre-issued API key, no subscription, no billing agreement. It just paid for exactly what it used, in real-time, on-chain.

### 7.4 What This Illustrates (for any audience)

| Old model | x402 model |
|---|---|
| Monthly subscription | Pay per section |
| API key + contract | Wallet signature |
| Invoice / bank transfer | Instant on-chain settlement |
| Human approval loop | Fully autonomous agent payment |
| $0.30 floor kills micro-billing | $0.001 floor on L2 |

---

## 8. Open Questions & Future Work

### 8.1 Technical

| # | Question | Priority | Notes |
|---|---|---|---|
| T-1 | Replay protection (idempotency) | 🔴 High | CDP handles nonce on testnet. Stateful DB needed for production. |
| T-2 | Payment timeout behavior | 🟡 Med | `maxTimeoutSeconds: 300`. What's the right UX when it expires? |
| T-3 | Same-wallet re-access policy | 🟡 Med | Should a wallet that paid today be re-charged tomorrow? |
| T-4 | Mobile wallet support | 🟡 Med | Desktop MetaMask confirmed. WalletConnect v2 for mobile TBD. |
| T-5 | Agent private key management | 🔴 High | `.env` only for PoC. HSM / MPC wallet for any real deployment. |

### 8.2 Protocol & Ecosystem

| # | Question | Notes |
|---|---|---|
| P-1 | Alternative stablecoin as asset | Swapping `asset` from USDC to another stablecoin is a config change, not a rewrite. |
| P-2 | x402 beyond content | Same protocol works for API endpoints, data feeds, model inference. The server middleware is identical. |
| P-3 | `upto` scheme (variable pricing) | Not yet in stable SDK. Could enable "pay for what the agent actually reads" semantics. |

### 8.3 Rough Roadmap

```
Phase 1 (PoC)   — 2026 Q2    This document's scope
  ├── End-to-end x402 flow on Base Sepolia
  ├── Agent autonomous payment script
  └── Next.js browser demo

Phase 2 (Clean) — 2026 Q3    If worth continuing
  ├── Move to Base Mainnet
  ├── Proper key management (MPC wallet or HSM)
  ├── Re-access policy (Redis cache)
  └── WalletConnect v2 for mobile

Phase 3 (Extend)— 2027        If the ecosystem matures
  ├── Swap USDC → alternative stablecoin when available
  ├── Extend to API endpoint monetization (not just content)
  └── Explore `upto` scheme for agent metered access
```

### 8.4 References

**x402 Protocol**
- [coinbase/x402 — GitHub](https://github.com/coinbase/x402)
- [x402 exact scheme EVM spec](https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md)
- [CDP Facilitator docs](https://docs.cdp.coinbase.com/x402)
- [Cloudflare Agents + x402](https://developers.cloudflare.com/agents/x402/)

**Testnet Resources**
- [Base Sepolia USDC faucet (Circle)](https://faucet.circle.com)
- [USDC contract on Base Sepolia](https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- [Base Sepolia RPC](https://sepolia.base.org)

---

**Document History**

| Version | Date | Changes |
|---|---|---|
| v0.1 | 2026-03-29 | Initial draft (Japanese) |
| v0.2 | 2026-03-29 | Added summary and use case exploration |
| v0.3 | 2026-03-29 | Removed corporate framing; personal PoC tone |
| v0.4 | 2026-03-29 | Full rewrite in English; project renamed weipress |
