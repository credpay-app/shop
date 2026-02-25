"use client";

import { useState } from "react";

const chips = [
  "Nike Air Max 95 size 10",
  "AirPods Pro (USB-C)",
  "Levi's 501 Original Jeans",
  "Adidas Ultraboost 24",
];

const mockResults = [
  {
    name: "Nike Air Max 95",
    detail: "Size 10 · White/Black",
    price: "$180",
    store: "Nike.com",
    accent: "bg-orange-50 border-orange-100",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    name: "Nike Air Max 95",
    detail: "Size 10 · White/Black",
    price: "$165",
    store: "ASOS",
    accent: "bg-sky-50 border-sky-100",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    name: "Nike Air Max 95",
    detail: "Size 10 · White/Black",
    price: "$189",
    store: "Nordstrom",
    accent: "bg-purple-50 border-purple-100",
    badge: "bg-purple-100 text-purple-700",
  },
];

export default function ShoppingAssistant() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (query.trim()) setSearched(true);
  };

  const handleChip = (chip: string) => {
    setQuery(chip);
    setSearched(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#0BD751]/15 flex items-center justify-center text-xl">
          🛍️
        </div>
        <div>
          <h3 className="font-bold text-[#0A2740] text-lg leading-tight">Shopping Assistant</h3>
          <p className="text-[#0A2740]/45 text-sm">Describe what you want to buy</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder='e.g. "Nike Air Max 95 size 10 in white"'
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-[#0A2740] placeholder-gray-300 text-sm focus:outline-none focus:border-[#0BD751] transition-colors bg-gray-50/50"
        />
        <button
          onClick={handleSearch}
          className="bg-[#0BD751] text-[#0A2740] font-bold px-5 py-3 rounded-xl hover:bg-[#09c248] transition-colors text-sm shrink-0"
        >
          Find
        </button>
      </div>

      {/* Quick chips */}
      {!searched && (
        <div className="flex flex-wrap gap-2 mb-6">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="text-xs bg-white border border-gray-200 text-[#0A2740]/60 hover:text-[#0A2740] hover:border-[#0A2740]/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-[#0A2740]/40 font-medium uppercase tracking-wide">
            Found across {mockResults.length} stores
          </p>
          {mockResults.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-2xl p-4 border ${item.accent}`}
            >
              {/* Product */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg">
                  👟
                </div>
                <div>
                  <p className="font-semibold text-[#0A2740] text-sm">{item.name}</p>
                  <p className="text-[#0A2740]/45 text-xs">{item.detail}</p>
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-md ${item.badge}`}>
                    {item.store}
                  </span>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-[#0A2740]">{item.price}</span>
                <button className="bg-[#0A2740] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#0A2740]/85 transition-colors">
                  Checkout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-center text-[#0A2740]/25 mt-6">
        Powered by x402 · Payments settled in USDC
      </p>
    </div>
  );
}
