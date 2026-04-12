import "dotenv/config";
import { formatUnits, type Hash } from "viem";
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { evmSigner, logWalletInfo, publicClient } from "./wallet.js";

const SERVER_URL = process.env["SERVER_URL"] ?? "http://localhost:3001";
const ARTICLE_ID = "boj-2026";
const PAID_SECTIONS = [1, 2, 3] as const;

// --- x402 client setup ---

// Track current section price for logging (requests are sequential)
let pendingPrice = "?";

// Step 1 (x402 flow): 402 received — parse requirements and prepare signature
const client = new x402Client()
  .register("eip155:84532", new ExactEvmScheme(evmSigner))
  .onBeforePaymentCreation(async ({ selectedRequirements }) => {
    // Step 2: log the price from the 402 response
    pendingPrice = formatUnits(BigInt(selectedRequirements.amount), 6);
    console.log(`  → 402 received  price: ${pendingPrice} USDC`);
    // Step 3: EIP-3009 signing happens inside ExactEvmScheme after this hook
    console.log(`  → Signing EIP-3009 authorization...`);
  });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// --- helpers ---

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseTxHash(response: Response): string | null {
  // x402 SDK v2 exposes the settlement info in PAYMENT-RESPONSE (or X-PAYMENT-RESPONSE)
  const raw =
    response.headers.get("PAYMENT-RESPONSE") ??
    response.headers.get("X-PAYMENT-RESPONSE");

  if (!raw) return null;

  try {
    const settled = decodePaymentResponseHeader(raw);
    return settled.transaction ?? null;
  } catch {
    return null;
  }
}

// --- main ---

async function main(): Promise<void> {
  await logWalletInfo();

  let totalPaidUsdc = 0;
  let sectionsFetched = 0;

  for (const sectionId of PAID_SECTIONS) {
    console.log(`[weipress-agent] Fetching section ${sectionId}...`);

    // Step 1 (x402 flow): initial GET → server returns 402
    // Steps 2–4 handled automatically by wrapFetchWithPayment + onBeforePaymentCreation hook
    const url = `${SERVER_URL}/article/${ARTICLE_ID}/section/${sectionId}`;
    let response: Response;

    try {
      response = await fetchWithPayment(url);
    } catch (err) {
      console.error(`  ✗ Failed to fetch section ${sectionId}:`, err);
      continue;
    }

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => ({}));
      console.error(`  ✗ Unexpected status ${response.status}:`, body);
      console.error(`  ✗ Response headers:`, Object.fromEntries(response.headers.entries()));
      continue;
    }

    // Step 5–7 (x402 flow): facilitator verified and settled; server returns 200
    // Step 8: parse settlement response header for tx hash
    const txHash = parseTxHash(response);
    if (txHash) {
      console.log(`  → Payment submitted  tx: ${txHash}  ✅`);
      // Wait for on-chain confirmation before the next payment:
      // settlement is async — server returns 200 before the tx is mined.
      // Without this guard, the CDP facilitator simulation for the next section
      // runs against pre-settlement chain state and returns invalid_exact_evm_transaction_failed.
      console.log(`  → Waiting for on-chain confirmation...`);
      await publicClient.waitForTransactionReceipt({ hash: txHash as Hash });
      console.log(`  → Confirmed ✅`);
      // Wait for CDP Facilitator's RPC node to catch up after on-chain confirmation.
      // Root cause: waitForTransactionReceipt confirms via the agent's own RPC, but the
      // CDP Facilitator uses a separate RPC node that lags by ~5-10s on Base Sepolia.
      // Without this delay, the facilitator's pre-submission simulation sees stale state
      // and returns invalid_exact_evm_transaction_failed with transaction: "".
      await new Promise(r => setTimeout(r, 10000));
    } else {
      console.log(`  → Payment submitted  ✅  (tx hash not available)`);
    }

    const data = (await response.json()) as { content?: string };
    const words = countWords(data.content ?? "");
    console.log(`  → Content received (${words} words)`);

    totalPaidUsdc += parseFloat(pendingPrice);
    sectionsFetched++;
  }

  // Summary
  const line = "━".repeat(32);
  console.log(line);
  console.log(`  Sections fetched : ${sectionsFetched}`);
  console.log(`  Total paid       : ${totalPaidUsdc.toFixed(2)} USDC`);
  console.log(line);
}

main().catch((err: unknown) => {
  console.error("[weipress-agent] Fatal error:", err);
  process.exit(1);
});
