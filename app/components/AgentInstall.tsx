"use client";

import { useState } from "react";

const steps = [
  {
    n: "1",
    title: "Install the skill",
    desc: "Run the command in your Claude Code terminal or pass it to your agent.",
  },
  {
    n: "2",
    title: "Fund your agent wallet",
    desc: "Top it up with USDC",
  },
  {
    n: "3",
    title: "Agent shops automatically",
    desc: "We handle variants, shipping, and checkout.",
  },
];

export default function AgentInstall() {
  const [copied, setCopied] = useState(false);
  const command = "npx skills add credpay-app/shop";

  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#0BD751]/15 flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h3 className="font-bold text-[#0A2740] text-lg leading-tight">
            Send Your Agent to Shop by Credpay
          </h3>
          <p className="text-[#0A2740]/45 text-sm">
            One command to enable autonomous checkout
          </p>
        </div>
      </div>

      {/* Command block */}
      <div className="bg-[#0A2740] rounded-2xl p-5 flex items-center justify-between mb-7 group">
        <code className="font-mono text-[#0BD751] text-sm md:text-base break-all">
          $ {command}
        </code>
        <button
          onClick={copy}
          className="ml-4 shrink-0 text-white/40 hover:text-white text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {steps.map(({ n, title, desc }) => (
          <div key={n} className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-[#0BD751] text-[#0A2740] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
              {n}
            </div>
            <div>
              <p className="font-semibold text-[#0A2740] text-sm">{title}</p>
              <p className="text-[#0A2740]/50 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-[#0A2740]/30">
          Works with Claude Code, custom agents &amp; REST API
        </p>
        <a
          href="https://docs.credpay.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#0A2740] hover:text-[#0BD751] transition-colors"
        >
          View docs →
        </a>
      </div>
    </div>
  );
}
