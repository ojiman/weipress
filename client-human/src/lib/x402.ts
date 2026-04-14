import { x402Client } from "@x402/fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import type { WalletClient } from "viem";

// Module-level singleton — read-only, no wallet state
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

/**
 * Build an x402Client from a wagmi WalletClient.
 * Call lazily inside payment handlers — walletClient is undefined during SSR.
 */
export function buildX402Client(walletClient: WalletClient): x402Client {
  if (!walletClient.account) {
    throw new Error("WalletClient has no account — wallet not connected");
  }

  // Bridge: adapt viem WalletClient to ClientEvmSigner (same pattern as client-agent/src/wallet.ts)
  const evmSigner = toClientEvmSigner(
    {
      address: walletClient.account.address,
      signTypedData: (msg) =>
        walletClient.signTypedData({
          account: walletClient.account!,
          domain: msg.domain as Parameters<
            typeof walletClient.signTypedData
          >[0]["domain"],
          types: msg.types as Parameters<
            typeof walletClient.signTypedData
          >[0]["types"],
          primaryType: msg.primaryType,
          message: msg.message as Parameters<
            typeof walletClient.signTypedData
          >[0]["message"],
        }),
    },
    publicClient,
  );

  return new x402Client().register("eip155:84532", new ExactEvmScheme(evmSigner));
}
