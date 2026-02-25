"use client";

import { useEffect, useRef } from "react";
import {
  KeyRound,
  Globe,
  RefreshCw,
  ShieldCheck,
  Clock,
  Puzzle,
} from "lucide-react";

const features = [
  {
    icon: KeyRound,
    title: "x402 Native",
    description:
      "No API keys or accounts. Payments are signed USDC authorizations attached as request headers.",
  },
  {
    icon: Globe,
    title: "Any Chain",
    description:
      "Pay from Base, Ethereum, Polygon, Arbitrum, or Arc Testnet. Refunds go back to the same chain.",
  },
  {
    icon: RefreshCw,
    title: "Smart Retry",
    description:
      "Transient failures (page load issues, AI confusion) automatically retry once with a fresh browser session.",
  },
  {
    icon: ShieldCheck,
    title: "Budget Aware",
    description:
      "Declare your goods total upfront. The AI stays within budget and pauses for authorization before overspending.",
  },
  {
    icon: Clock,
    title: "Async Polling",
    description:
      "202 + requestId pattern. Poll GET /v1/checkout/:id for live status. Webhook callbacks supported.",
  },
  {
    icon: Puzzle,
    title: "MCP Ready",
    description:
      "Native MCP tools: checkout_quote, checkout_create, checkout_status, checkout_authorize. Plug into any MCP-compatible agent.",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const items = el.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 px-4 bg-[#0A2740]"
      aria-labelledby="features-title"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 fade-up">
          <p className="text-sm font-medium text-[#0BD751] uppercase tracking-widest mb-3">
            Features
          </p>
          <h2
            id="features-title"
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Everything your agent needs
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="fade-up bg-[#0E3150] rounded-2xl p-6 border border-white/5 hover:border-[#0BD751]/30 transition-all group"
                style={{ transitionDelay: `${index * 0.08}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0BD751]/10 flex items-center justify-center mb-4 group-hover:bg-[#0BD751]/20 transition-colors">
                  <Icon size={20} className="text-[#0BD751]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#8A9BB0] leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
