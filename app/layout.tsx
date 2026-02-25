import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Shop by Credpay — Universal Checkout Agent",
  description:
    "Complete any checkout on any online store — Nike, ASOS, Shopify, WooCommerce and more. For humans and AI agents, powered by x402.",
  keywords: ["checkout agent", "AI shopping", "x402", "USDC", "autonomous agents", "Credpay"],
  openGraph: {
    title: "Shop by Credpay — Universal Checkout Agent",
    description: "Complete any checkout, anywhere online. For humans and AI agents.",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
