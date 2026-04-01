# CLAUDE.md — weipress

This file is auto-loaded by Claude Code. Read it fully before writing any code.

---

## Project Overview

**weipress** is a personal PoC exploring the **x402 protocol (HTTP 402 Payment Required)**
for section-level micropayments on a fictional financial news portal.

- Blockchain: Base Sepolia (testnet only)
- Payment token: USDC (EIP-3009 — gasless signature payments)
- Facilitator: Coinbase Developer Platform (CDP)

---

## Directory Layout

```
weipress/
├── CLAUDE.md           ← this file
├── TASKS.md            ← implementation checklist (check off as you go)
├── api-spec.md         ← endpoint contract (source of truth for interfaces)
├── server/             ← Express + @x402/express
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/articles.ts
│   │   ├── content/articles.ts   ← dummy article data
│   │   └── config/x402.ts
│   ├── package.json
│   └── tsconfig.json
├── client-human/       ← Next.js browser UI
│   ├── src/app/
│   ├── src/components/
│   ├── package.json
│   └── tsconfig.json
└── client-agent/       ← minimal agent payment script
    ├── src/
    │   ├── agent.ts
    │   └── wallet.ts
    ├── package.json
    └── tsconfig.json
```

---

## Tech Stack Constraints

| Item | Requirement |
|---|---|
| Node.js | v20+ |
| TypeScript | v5.x, strict mode enabled |
| Package manager | npm only (no yarn / pnpm) |
| Module format | ESM (`"type": "module"` in every package.json) |
| x402 SDK | `@x402/express` `@x402/fetch` `@x402/core` `@x402/evm` |
| EVM library | `viem` v2.x — do NOT use ethers.js |
| HTTP framework | Express v4.x (server only) |
| UI framework | Next.js v14 App Router (client-human only) |

---

## Environment Variables

Create a `.env` in each component root. See `.env.example` for the template.

### server/.env
```
PORT=3001
FACILITATOR_URL=https://x402.org/facilitator
RECEIVER_ADDRESS=<your wallet address>
NETWORK=eip155:84532
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF4
```

### client-agent/.env
```
SERVER_URL=http://localhost:3001
AGENT_PRIVATE_KEY=0x<test-only wallet private key>
RPC_URL=https://sepolia.base.org
```

> ⚠️ Always add `.env` to `.gitignore`. Never commit private keys.

---

## How to Run

```bash
# server
cd server && npm install && npm run dev

# client-human (separate terminal)
cd client-human && npm install && npm run dev

# client-agent (separate terminal)
cd client-agent && npm install && npm run agent
```

---

## Smoke Tests (curl)

```bash
# Free section → should return 200 OK
curl -i http://localhost:3001/article/boj-2026/section/0

# Paid section → should return 402 Payment Required
curl -i http://localhost:3001/article/boj-2026/section/1
```

---

## Task Management

Read TASKS.md at the start of every session. Update it inline — never append-only.

### Section structure

| Section | Purpose |
|---|---|
| `## In Progress` | Tasks currently being worked on |
| `## Next` | 1–3 tasks to pick up immediately after In Progress |
| `## Backlog` | Future work, not yet scheduled |
| `## Discovered` | Tasks that surfaced unexpectedly during implementation |
| `## Blocked` | Tasks waiting on an external dependency |
| `## Done` | Completed tasks — **never delete**, they are decision history |

### Update rules

- When starting a task: move it to `## In Progress`
- When completing a task: mark `[x]` and move to `## Done` with a one-line note if a decision was made
- When discovering an unexpected task: add it to `## Discovered` with reason and priority
- When a task is deferred: move to `## Backlog` and note why
- When changing an approach mid-task: record the change inline, e.g.:
  `~~Use ethers.js~~ → Changed to viem (lighter, better TypeScript support)`

---

## Coding Rules

- **No `any`** — use `unknown` with type guards when the type is uncertain
- **No swallowed errors** — always `try/catch`, always `console.error` on failure
- **Comment x402 flow steps** — mark each step (402 received / signing / retry / settled)
- **File size** — split files that exceed 150 lines
- **Tests** — add `npm test` to every component (Jest or Node test runner)
- **One commit per task** — use the TASKS.md ID as the commit prefix (e.g. `feat: P2-3 article routes`)
- **No `// @ts-ignore`** — fix the type error instead

---

## x402 Flow Reference

```
1. Client  → GET /article/:id/section/:sectionId
2. Server  → 402 + X-PAYMENT-REQUIRED header (base64-encoded JSON)
               { scheme, network, asset, price, payTo, maxTimeoutSeconds }
3. Client  → generate USDC EIP-3009 signature (viem signTypedData)
4. Client  → retry GET with X-PAYMENT header (signed payload)
5. Server  → POST /verify to CDP Facilitator
6. CDP     → verification OK
7. Server  → POST /settle to CDP (async is fine)
8. Server  → 200 OK + content + X-PAYMENT-RESPONSE header
```

---

## Constraints (PoC scope)

- **Testnet only** — Base Sepolia. Do not write any Mainnet code.
- **Dummy content** — all article content is hardcoded fiction.
- **No auth layer** — wallet signature is the only identity. No JWT/OAuth.
- **No DB** — state is in-memory only. No persistence.

---

## References

- x402 GitHub: https://github.com/coinbase/x402
- Express example: https://github.com/coinbase/x402/tree/main/examples/typescript/servers/express
- Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF4`
- CDP Facilitator: `https://x402.org/facilitator`
- Base Sepolia RPC: `https://sepolia.base.org`
