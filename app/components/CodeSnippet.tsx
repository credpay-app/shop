"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

const tabs = [
  { id: "quote", label: "1. Quote" },
  { id: "checkout", label: "2. Checkout" },
  { id: "poll", label: "3. Poll status" },
];

const snippets: Record<string, { lines: { type: string; text: string }[] }> = {
  quote: {
    lines: [
      { type: "method", text: "POST /v1/quote" },
      { type: "header", text: "Content-Type: application/json" },
      { type: "blank", text: "" },
      { type: "brace", text: "{" },
      { type: "key-val", text: '  "items": [{ "url": "https://store.myshopify.com/products/tee", "quantity": 1 }],' },
      { type: "key-val", text: '  "email": "customer@example.com",' },
      { type: "key-val", text: '  "shippingAddress": {' },
      { type: "key-val", text: '    "firstName": "Jane", "lastName": "Doe",' },
      { type: "key-val", text: '    "line1": "123 Main St", "city": "Austin",' },
      { type: "key-val", text: '    "state": "TX", "postalCode": "78701",' },
      { type: "key-val", text: '    "country": "United States", "countryCode": "US"' },
      { type: "key-val", text: "  }," },
      { type: "key-val", text: '  "goodsTotal": "49.99"' },
      { type: "brace", text: "}" },
      { type: "blank", text: "" },
      { type: "comment", text: "// Response" },
      { type: "brace", text: "{" },
      { type: "key-val", text: '  "maxAmount": "$60.59",' },
      { type: "key-val", text: '  "serviceFee": "$0.50",' },
      { type: "key-val", text: '  "buffer": "$10.10"' },
      { type: "brace", text: "}" },
    ],
  },
  checkout: {
    lines: [
      { type: "method", text: "POST /v1/checkout" },
      { type: "header", text: "Content-Type: application/json" },
      { type: "header", text: "X-PAYMENT: <x402 payload for maxAmount>" },
      { type: "blank", text: "" },
      { type: "key-val", text: "{ ...same body... }" },
      { type: "blank", text: "" },
      { type: "comment", text: "// Response — 202 Accepted" },
      { type: "brace", text: "{" },
      { type: "key-val", text: '  "requestId": "req_abc123",' },
      { type: "key-val", text: '  "status": "processing"' },
      { type: "brace", text: "}" },
    ],
  },
  poll: {
    lines: [
      { type: "method", text: "GET /v1/checkout/req_abc123" },
      { type: "blank", text: "" },
      { type: "comment", text: "// Response — terminal success" },
      { type: "brace", text: "{" },
      { type: "key-val", text: '  "success": true,' },
      { type: "key-val", text: '  "requestId": "req_abc123",' },
      { type: "key-val", text: '  "status": "completed",' },
      { type: "key-val", text: '  "orderNumber": "#1042",' },
      { type: "key-val", text: '  "totalCharged": "$52.48",' },
      { type: "key-val", text: '  "refundInitiated": true' },
      { type: "brace", text: "}" },
    ],
  },
};

function renderLine(line: { type: string; text: string }, idx: number) {
  if (line.type === "blank") {
    return <div key={idx} className="h-4" />;
  }
  if (line.type === "comment") {
    return (
      <div key={idx} className="text-[#8A9BB0] italic">
        {line.text}
      </div>
    );
  }
  if (line.type === "method") {
    return (
      <div key={idx} className="text-[#0BD751] font-semibold">
        {line.text}
      </div>
    );
  }
  if (line.type === "header") {
    return (
      <div key={idx}>
        <span className="text-[#8A9BB0]">{line.text}</span>
      </div>
    );
  }
  if (line.type === "brace") {
    return (
      <div key={idx} className="text-white">
        {line.text}
      </div>
    );
  }
  // key-val: split on first ":"
  const colonIdx = line.text.indexOf(":");
  if (colonIdx !== -1 && line.text.trim().startsWith('"')) {
    const key = line.text.slice(0, colonIdx + 1);
    const val = line.text.slice(colonIdx + 1);
    return (
      <div key={idx}>
        <span className="text-[#0BD751]">{key}</span>
        <span className="text-white">{val}</span>
      </div>
    );
  }
  return (
    <div key={idx} className="text-white">
      {line.text}
    </div>
  );
}

export default function CodeSnippet() {
  const [activeTab, setActiveTab] = useState("quote");
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    const text = snippets[activeTab].lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="api"
      ref={sectionRef}
      className="py-24 px-4 bg-[#0A2740]"
      aria-labelledby="code-title"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 fade-up">
          <p className="text-sm font-medium text-[#0BD751] uppercase tracking-widest mb-3">
            API
          </p>
          <h2
            id="code-title"
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Simple HTTP API
          </h2>
          <p className="text-[#8A9BB0] mt-3 max-w-xl mx-auto">
            Three endpoints. No auth headers — just an x402 payment.
          </p>
        </div>

        {/* Code block */}
        <div className="fade-up bg-[#081f33] rounded-2xl border border-white/10 overflow-hidden" style={{ transitionDelay: "0.1s" }}>
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex gap-1" role="tablist" aria-label="Code examples">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? "bg-[#0BD751]/15 text-[#0BD751]"
                      : "text-[#8A9BB0] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copy code"
              className="flex items-center gap-1.5 text-xs text-[#8A9BB0] hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-[#0BD751]" />
                  <span className="text-[#0BD751]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Code content */}
          <div className="p-6 overflow-x-auto">
            <pre className="font-mono text-sm leading-6 whitespace-pre">
              {snippets[activeTab].lines.map((line, idx) =>
                renderLine(line, idx)
              )}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
