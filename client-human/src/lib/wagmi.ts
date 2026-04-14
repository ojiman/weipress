import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

const projectId = process.env["NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"] ?? "";

export const wagmiConfig = getDefaultConfig({
  appName: "weipress",
  projectId,
  chains: [baseSepolia],
  ssr: true,
});
