import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.credpay.io"),
  title: "Shop by Credpay — Universal Checkout Agent",
  description:
    "Complete any checkout on any online store — Nike, ASOS, Shopify, WooCommerce and more. For humans and AI agents, powered by x402.",
  keywords: [
    "checkout agent",
    "AI shopping",
    "x402",
    "USDC",
    "autonomous agents",
    "Credpay",
  ],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Shop by Credpay — Universal Checkout Agent",
    description:
      "Complete any checkout, anywhere online. For humans and AI agents.",
    type: "website",
    url: "https://shop.credpay.xyz",
    siteName: "Shop by Credpay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shop by Credpay — Universal Checkout Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop by Credpay — Universal Checkout Agent",
    description:
      "Complete any checkout, anywhere online. For humans and AI agents.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans bg-white text-[#0A2740]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
