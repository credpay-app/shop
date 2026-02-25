"use client";

import { useEffect, useRef } from "react";
import { BookOpen, Zap, RefreshCcw } from "lucide-react";

export default function Pricing() {
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
      id="pricing"
      ref={sectionRef}
      className="py-24 px-4 bg-[#0A2740]"
      aria-labelledby="pricing-title"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="fade-up mb-8">
          <p className="text-sm font-medium text-[#0BD751] uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2
            id="pricing-title"
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Simple, transparent pricing
          </h2>
        </div>

        {/* Pricing card */}
        <div
          className="fade-up rounded-2xl border-2 border-[#0BD751] bg-[#0E3150] p-8 sm:p-10"
          style={{ transitionDelay: "0.1s" }}
        >
          {/* Main price */}
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-5xl font-extrabold text-white">$0.50</span>
            <span className="text-[#8A9BB0] text-lg">/ item</span>
          </div>
          <p className="text-[#0BD751] font-semibold text-lg mb-6">
            Flat fee · No subscription · Pay per checkout
          </p>

          {/* Features */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-[#8A9BB0]">
              <Zap size={15} className="text-[#0BD751]" />
              No monthly cost
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-sm text-[#8A9BB0]">
              <RefreshCcw size={15} className="text-[#0BD751]" />
              Unused buffer refunded
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#8A9BB0] mb-8 max-w-md mx-auto leading-relaxed">
            Service fee is deducted from your authorized amount.
            Unused buffer is refunded automatically after each checkout.
          </p>

          {/* CTA */}
          <a
            href="https://docs.credpay.xyz"
            target="_blank"
            rel="noopener noreferrer"
            id="get-started"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A2740] bg-[#0BD751] px-8 py-3 rounded-xl hover:bg-[#09c248] transition-colors"
          >
            <BookOpen size={16} />
            Read the Docs
          </a>
        </div>
      </div>
    </section>
  );
}
