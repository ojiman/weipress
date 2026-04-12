# API Spec — weipress

This file is the interface contract between server and clients.
Claude Code must not deviate from the response shapes defined here.

---

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:3001` |

---

## Common Response Headers

```
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:3000
```

---

## Endpoints

### `GET /article/:articleId/section/:sectionId`

Fetch a single article section. Section 0 is free; sections 1–4 require x402 payment.

#### Path Parameters

| Parameter | Type | Example |
|---|---|---|
| `articleId` | string | `boj-2026` |
| `sectionId` | integer 0–4 | `1` |

---

#### Case A: Free section (sectionId = 0) or paid request with valid X-PAYMENT header

**Request**
```http
GET /article/boj-2026/section/0 HTTP/1.1
```

For paid sections, include:
```http
X-PAYMENT: <base64url-encoded signed payload>
```

**Response: 200 OK**
```json
{
  "articleId": "boj-2026",
  "sectionId": 0,
  "tier": "free",
  "title": "Lead",
  "content": "The Bank of Japan's policy path in 2026...",
  "price": null,
  "totalSections": 5
}
```

---

#### Case B: Paid section, no payment header

**Request**
```http
GET /article/boj-2026/section/1 HTTP/1.1
```

**Response: 402 Payment Required**
```http
HTTP/1.1 402 Payment Required
X-PAYMENT-REQUIRED: <base64url-encoded JSON — see below>
Content-Type: application/json
```

`X-PAYMENT-REQUIRED` header — decoded value:
```json
{
  "scheme": "exact",
  "network": "eip155:84532",
  "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "price": "50000",
  "payTo": "0x<RECEIVER_ADDRESS>",
  "maxTimeoutSeconds": 300,
  "description": "Section 1: Macro Environment Overview",
  "mimeType": "application/json"
}
```

Response body:
```json
{
  "error": "Payment required",
  "section": 1,
  "price": "0.05",
  "currency": "USDC"
}
```

---

#### Case C: Payment header present but verification failed

**Response: 402 Payment Required**
```json
{
  "error": "Payment verification failed",
  "reason": "Insufficient balance | Invalid signature | Expired authorization"
}
```

---

#### Case D: Section number out of range

**Response: 404 Not Found**
```json
{
  "error": "Section not found",
  "articleId": "boj-2026",
  "sectionId": 99
}
```

---

### `GET /articles`

Return available articles (free endpoint, no payment required).

**Response: 200 OK**
```json
{
  "articles": [
    {
      "articleId": "boj-2026",
      "title": "BoJ Policy 2026 — Scenarios and Asset Allocation",
      "description": "Zero-rate continuation or hike? Asset class impact by scenario.",
      "totalSections": 5,
      "freeSections": [0],
      "paidSections": [
        { "sectionId": 1, "price": "0.05", "title": "Macro Environment Overview" },
        { "sectionId": 2, "price": "0.05", "title": "BoJ Scenario Simulations" },
        { "sectionId": 3, "price": "0.10", "title": "Asset Class Impact Analysis" },
        { "sectionId": 4, "price": "0.20", "title": "Economist Commentary (Premium)" }
      ],
      "totalPrice": "0.40",
      "currency": "USDC"
    }
  ]
}
```

---

### `GET /health`

Server health check (debug use).

**Response: 200 OK**
```json
{
  "status": "ok",
  "facilitatorUrl": "https://x402.org/facilitator",
  "network": "eip155:84532",
  "receiverAddress": "0x..."
}
```

---

## Section Price Table

| sectionId | Tier | Price (USDC) | Atomic Units (6 decimals) |
|---|---|---|---|
| 0 | free | 0.000 | 0 |
| 1 | standard | 0.050 | 50,000 |
| 2 | standard | 0.050 | 50,000 |
| 3 | detail | 0.100 | 100,000 |
| 4 | premium | 0.200 | 200,000 |

---

## TypeScript Type Definitions

Define these in `server/src/content/articles.ts`.

```typescript
export type SectionTier = "free" | "standard" | "detail" | "premium";

export interface Section {
  sectionId:    number;
  tier:         SectionTier;
  title:        string;
  content:      string;
  priceUsdc:    string | null;   // e.g. "0.05" | null for free
  priceAtomic:  string | null;   // e.g. "50000" | null for free
}

export interface Article {
  articleId:    string;
  title:        string;
  description:  string;
  sections:     Section[];
}

// Shape returned by GET /article/:id/section/:sid
export interface SectionResponse {
  articleId:     string;
  sectionId:     number;
  tier:          SectionTier;
  title:         string;
  content:       string;
  price:         string | null;
  totalSections: number;
}

// Shape of each item in GET /articles response
export interface ArticleListItem {
  articleId:     string;
  title:         string;
  description:   string;
  totalSections: number;
  freeSections:  number[];
  paidSections:  Array<{ sectionId: number; price: string; title: string }>;
  totalPrice:    string;
  currency:      "USDC";
}
```

---

## x402 Headers

### X-PAYMENT-REQUIRED (server → client)

Attached to 402 responses. Value is base64url-encoded JSON.

```
X-PAYMENT-REQUIRED: eyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJlaXAxNTU6ODQ1MzIiLCJhc3NldCI6IjB4MDM2Q2JENTM4NDJjNTQyNjYzNGU3OTI5NTQxZUMyMzE4ZjNkQ0Y0IiwicHJpY2UiOiI1MDAwMCIsInBheVRvIjoiMHguLi4iLCJtYXhUaW1lb3V0U2Vjb25kcyI6MzAwfQ==
```

### X-PAYMENT (client → server)

Attached to the retry request. Generated automatically by `@x402/fetch`.

```
X-PAYMENT: <base64url-encoded signed EIP-3009 payload>
```

### X-PAYMENT-RESPONSE (server → client, on 200 OK)

```json
{
  "success":        true,
  "txHash":         "0x1a2b3c...",
  "network":        "eip155:84532",
  "paidAmount":     "50000",
  "paidAmountUsdc": "0.05"
}
```

---

## EIP-3009 Signing Reference

> Only needed if implementing the payment flow manually (for debugging).
> `@x402/fetch` handles this automatically in normal use.

```typescript
const domain = {
  name:            "USD Coin",
  version:         "2",
  chainId:         84532,
  verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

const types = {
  TransferWithAuthorization: [
    { name: "from",        type: "address" },
    { name: "to",          type: "address" },
    { name: "value",       type: "uint256" },
    { name: "validAfter",  type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce",       type: "bytes32" },
  ],
};

const message = {
  from:        agentWalletAddress,
  to:          receiverAddress,
  value:       BigInt(50000),         // 0.05 USDC
  validAfter:  BigInt(0),
  validBefore: BigInt(Math.floor(Date.now() / 1000) + 300),
  nonce:       crypto.randomBytes(32),
};
```

---

## Error Reference

| HTTP Status | `error` value | Meaning |
|---|---|---|
| 402 | `"Payment required"` | No X-PAYMENT header on a paid section |
| 402 | `"Payment verification failed"` | Bad signature, insufficient balance, or expired |
| 404 | `"Article not found"` | Unknown articleId |
| 404 | `"Section not found"` | sectionId out of range |
| 500 | `"Facilitator error"` | CDP communication failure |
