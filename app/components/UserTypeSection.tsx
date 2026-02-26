"use client";

import { useState } from "react";
import ShoppingAssistant from "./ShoppingAssistant";
import AgentInstall from "./AgentInstall";

type Mode = "human" | "agent";

export default function UserTypeSection() {
  const [mode, setMode] = useState<Mode>("human");

  return (
    <section id="get-started" className="bg-[#f8fafc] py-5 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Section label */}
        <p className="text-center text-xs text-[#0A2740]/35 font-semibold uppercase tracking-widest mb-8">
          Who are you?
        </p>

        {/* Pill segmented control */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#0A2740]/[0.07] rounded-2xl p-1.5 gap-1">
            <button
              onClick={() => setMode("human")}
              className={`flex items-center gap-2.5 px-8 py-3.5 rounded-l-2xl text-base font-bold transition-all duration-200 ${
                mode === "human"
                  ? "bg-[#0A2740] text-white shadow-lg shadow-[#0A2740]/25"
                  : "text-[#0A2740]/40 hover:text-[#0A2740]/60"
              }`}
            >
              <span className="text-xl">🧑</span>
               Human
            </button>
            <button
              onClick={() => setMode("agent")}
              className={`flex items-center gap-2.5 px-8 py-3.5 rounded-r-2xl text-base font-bold transition-all duration-200 ${
                mode === "agent"
                  ? "bg-[#0A2740] text-white shadow-lg shadow-[#0A2740]/25"
                  : "text-[#0A2740]/40 hover:text-[#0A2740]/60"
              }`}
            >
              <span className="text-xl">🤖</span>
               Agent
            </button>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 p-7 md:p-9 transition-all duration-300">
          <div className={mode === "human" ? undefined : "hidden"}>
            <ShoppingAssistant />
          </div>
          <div className={mode === "agent" ? undefined : "hidden"}>
            <AgentInstall />
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-[#0A2740]/30 mt-6">
          Credpay · Payments infrastructure for autonomous agents ·{" "}
          <a
            href="https://credpay.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#0A2740]/50 transition-colors"
          >
            credpay.xyz
          </a>
        </p>
      </div>
    </section>
  );
}
