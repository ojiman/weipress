"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";
import { buildX402Client } from "@/lib/x402";

const SERVER_URL = process.env["NEXT_PUBLIC_SERVER_URL"] ?? "http://localhost:3001";

// Discriminated union — no `any`, per CLAUDE.md
type SectionState =
  | { status: "locked" }
  | { status: "loading" }
  | { status: "unlocked"; content: string; txHash: string | null }
  | { status: "error"; message: string };

interface Props {
  articleId: string;
  sectionId: number;
  price: string;
  title: string;
}

function parseTxHash(response: Response): string | null {
  const raw =
    response.headers.get("PAYMENT-RESPONSE") ??
    response.headers.get("X-PAYMENT-RESPONSE");
  if (!raw) return null;
  try {
    const settled = decodePaymentResponseHeader(raw);
    return (settled as { transaction?: string }).transaction ?? null;
  } catch (err) {
    console.error("[ArticleSection] Failed to parse PAYMENT-RESPONSE header:", err);
    return null;
  }
}

export function ArticleSection({ articleId, sectionId, price, title }: Props) {
  const [state, setState] = useState<SectionState>({ status: "locked" });
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handlePay = useCallback(async () => {
    if (!walletClient) {
      setState({ status: "error", message: "Wallet not connected" });
      return;
    }

    setState({ status: "loading" });

    // Step 1 (x402): build client lazily — walletClient is guaranteed here
    let x402client: ReturnType<typeof buildX402Client>;
    try {
      x402client = buildX402Client(walletClient);
    } catch (err) {
      console.error("[ArticleSection] Failed to build x402 client:", err);
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Setup failed",
      });
      return;
    }

    const fetchWithPayment = wrapFetchWithPayment(fetch, x402client);
    const url = `${SERVER_URL}/article/${articleId}/section/${sectionId}`;

    let response: Response;
    try {
      // Steps 2–7 (x402): GET → 402 received → sign EIP-3009 → retry → verify → settle → 200
      response = await fetchWithPayment(url);
    } catch (err) {
      console.error(`[ArticleSection] Payment fetch failed for section ${sectionId}:`, err);
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Payment failed",
      });
      return;
    }

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => ({}));
      console.error(`[ArticleSection] Unexpected status ${response.status}:`, body);
      setState({ status: "error", message: `Server error: ${response.status}` });
      return;
    }

    // Step 8 (x402): parse settlement response header for tx hash
    const txHash = parseTxHash(response);

    let data: { content?: string };
    try {
      data = (await response.json()) as { content?: string };
    } catch (err) {
      console.error("[ArticleSection] Failed to parse response body:", err);
      setState({ status: "error", message: "Invalid response from server" });
      return;
    }

    setState({
      status: "unlocked",
      content: data.content ?? "(no content)",
      txHash,
    });
  }, [walletClient, articleId, sectionId]);

  return (
    <section className="border border-gray-200 rounded-lg p-5 space-y-3 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>

      {state.status === "locked" && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{price}</span>
          <button
            onClick={handlePay}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnected ? "Read" : "Connect wallet to read"}
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Processing payment...
        </div>
      )}

      {state.status === "unlocked" && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{state.content}</p>
          {state.txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${state.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono"
            >
              Paid ✅ tx: {state.txHash.slice(0, 10)}...
            </a>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{state.message}</p>
          <button
            onClick={() => setState({ status: "locked" })}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
