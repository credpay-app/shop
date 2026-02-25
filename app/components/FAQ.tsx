"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What stores are supported?",
    answer:
      "Shopify only for now. The AI is trained on Shopify's checkout flow.",
  },
  {
    question: "What happens if the checkout fails?",
    answer:
      "On recoverable failures the agent retries once automatically. On genuine failures (out of stock, unsupported region) you receive a full refund minus the service fee and AI execution cost.",
  },
  {
    question: "How is the refund calculated?",
    answer:
      "You authorize a max amount (goods + service fee + 20% buffer). After checkout, Credpay settles the actual spend and refunds the difference on-chain automatically.",
  },
  {
    question: "What is x402?",
    answer:
      "x402 is an open payment protocol that lets HTTP clients attach signed USDC authorizations as request headers — no API keys, no accounts.",
  },
  {
    question: "Is my card data safe?",
    answer:
      "Credpay uses an internal virtual card to complete the store checkout. Your payment stays on-chain via USDC — no card data is ever exposed to your agent.",
  },
  {
    question: "Can I get notified when checkout completes?",
    answer:
      "Yes. Pass a callbackUrl in the request body and Credpay will POST the result to your webhook when the checkout reaches a terminal state.",
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
    <div className="border-b border-white/10 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold text-white group-hover:text-[#0BD751] transition-colors pr-4">
          {question}
        </span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[#8A9BB0] group-hover:border-[#0BD751]/50 group-hover:text-[#0BD751] transition-all">
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-[#8A9BB0] leading-relaxed">{answer}</p>
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
      { threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-24 px-4 bg-[#0A2740]"
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
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion */}
        <div
          className="fade-up bg-[#0E3150] rounded-2xl border border-white/5 px-6 sm:px-8"
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
