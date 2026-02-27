"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "Does Credpay store my personal data?",
    answer:
      "No. Credpay never stores your name, email, phone number, or shipping address on its servers. Your details are passed directly to the store's checkout at the time of purchase.",
  },
  {
    question: "What stores are supported?",
    answer:
      "Credpay works with thousands of online stores including Nike, ASOS, Shopify merchants, WooCommerce stores, and more.",
  },
  {
    question: "How does payment work?",
    answer:
      "Payments are settled in USDC on Base using the x402 protocol. When you click Pay, your connected wallet signs an authorisation for the exact amount.",
  },
  {
    question: "What happens if the checkout fails?",
    answer:
      "If the checkout agent can't place your order, your funds are immediately returned to your wallet. You'll see an error message and can try again.",
  },
  {
    question: "Which wallet do I need?",
    answer: "Any EVM-compatible wallet that holds USDC on Base. ",
  },
  {
    question: "What is x402?",
    answer:
      "x402 is an open payment protocol built on HTTP. Instead of entering card details, a server returns a payment request (HTTP 402) and your wallet signs the USDC transfer directly on-chain — no card numbers, no bank redirects.",
  },
  {
    question: "Can AI agents use this?",
    answer:
      "Yes, that's a core use case. The same x402 API powering this interface is available for autonomous agents to call directly, enabling fully programmatic shopping without human intervention.",
  },
];

function FAQItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold text-[#0A2740] group-hover:text-[#0BD751] transition-colors pr-4">
          {question}
        </span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[#0A2740]/40 group-hover:border-[#0BD751]/50 group-hover:text-[#0BD751] transition-all">
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-[#0A2740]/60 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
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
      { threshold: 0.1 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-24 px-4 bg-white"
      aria-labelledby="faq-title"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 fade-up">
          <p className="text-sm font-medium text-[#0BD751] uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2
            id="faq-title"
            className="text-3xl sm:text-4xl font-extrabold text-[#0A2740]"
          >
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion */}
        <div
          className="fade-up rounded-2xl border border-gray-100 px-6 sm:px-8"
          style={{ transitionDelay: "0.1s" }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
