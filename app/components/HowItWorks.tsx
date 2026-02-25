"use client";

import { useEffect, useRef } from "react";
import { FileText, CreditCard, Bot, RefreshCcw } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Quote the cost",
    description:
      "Call POST /v1/quote with your cart. Get back the max USDC amount to authorize — goods, service fee, and buffer included.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Submit with payment",
    description:
      "Call POST /v1/checkout with an x402 USDC authorization header. No API key. No account. Just a signed payment.",
  },
  {
    number: "03",
    icon: Bot,
    title: "AI takes over",
    description:
      "An AI agent opens a real browser, adds items to cart, fills your shipping address, applies discount codes, and places the order.",
  },
  {
    number: "04",
    icon: RefreshCcw,
    title: "Buffer refunded",
    description:
      "Credpay settles only what was spent. The unused buffer is automatically returned to your wallet on-chain.",
  },
];

export default function HowItWorks() {
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
      id="how-it-works"
      ref={sectionRef}
      className="py-24 px-4 bg-[#0A2740]"
      aria-labelledby="how-it-works-title"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 fade-up">
          <p className="text-sm font-medium text-[#0BD751] uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2
            id="how-it-works-title"
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Four steps from cart to confirmation
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="fade-up relative bg-[#0E3150] rounded-2xl p-6 flex flex-col gap-4 border border-white/5 hover:border-[#0BD751]/30 transition-colors"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Connector line (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-[#0BD751]/30 z-10" />
                )}

                {/* Step number + icon */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#0BD751]/10 flex items-center justify-center">
                    <Icon size={20} className="text-[#0BD751]" />
                  </div>
                  <span className="text-3xl font-extrabold text-[#0BD751]/20 font-mono leading-none">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[#8A9BB0] leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
