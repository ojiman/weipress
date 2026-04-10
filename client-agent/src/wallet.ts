import "dotenv/config";
import { createWalletClient, createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { toClientEvmSigner, type ClientEvmSigner } from "@x402/evm";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function loadEnv(): { privateKey: `0x${string}`; rpcUrl: string } {
  const privateKey = process.env["AGENT_PRIVATE_KEY"];
  const rpcUrl = process.env["RPC_URL"] ?? "https://sepolia.base.org";

  if (!privateKey) {
    throw new Error("AGENT_PRIVATE_KEY is not set in environment");
  }
  if (!privateKey.startsWith("0x")) {
    throw new Error("AGENT_PRIVATE_KEY must start with 0x");
  }

  return { privateKey: privateKey as `0x${string}`, rpcUrl };
}

const { privateKey, rpcUrl } = loadEnv();

export const account = privateKeyToAccount(privateKey);

export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(rpcUrl),
});

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

// Adapt viem walletClient to ClientEvmSigner interface required by @x402/evm
const viemSigner: Omit<ClientEvmSigner, "readContract"> = {
  address: account.address,
  signTypedData: ({ domain, types, primaryType, message }) =>
    walletClient.signTypedData({
      account,
      domain: domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
      types: types as Parameters<typeof walletClient.signTypedData>[0]["types"],
      primaryType,
      message: message as Parameters<typeof walletClient.signTypedData>[0]["message"],
    }),
};

export const evmSigner = toClientEvmSigner(viemSigner, publicClient);

export async function logWalletInfo(): Promise<void> {
  const balanceRaw = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });

  const balance = formatUnits(balanceRaw, 6);
  console.log(`[weipress-agent] Wallet: ${account.address}  Balance: ${balance} USDC`);
}
