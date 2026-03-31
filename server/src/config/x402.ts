import "dotenv/config";

const receiverAddress = process.env.RECEIVER_ADDRESS ?? "";
const network = process.env.NETWORK ?? "eip155:84532";
const usdcAddress =
  process.env.USDC_ADDRESS ?? "0x036CbD53842c5426634e7929541eC2318f3dCF4";
const facilitatorUrl =
  process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

if (!receiverAddress) {
  throw new Error("RECEIVER_ADDRESS environment variable is required");
}

export const paymentConfig = {
  facilitatorUrl,
  network,
  asset: usdcAddress,
  payTo: receiverAddress,
  maxTimeoutSeconds: 300,
} as const;

/** Price in atomic USDC units (6 decimals) keyed by sectionId */
export const sectionPricing: Record<number, string> = {
  1: "50000",
  2: "50000",
  3: "100000",
  4: "200000",
};

/** Human-readable USDC price keyed by sectionId */
export const sectionPriceUsdc: Record<number, string> = {
  1: "0.05",
  2: "0.05",
  3: "0.10",
  4: "0.20",
};
