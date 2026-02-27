import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: "Shop by Credpay",
      appLogoUrl: "https://shop.credpay.io/logo.png",
      preference: "all",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});
