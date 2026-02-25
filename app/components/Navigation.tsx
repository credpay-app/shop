"use client";

import { useState, useEffect } from "react";
import CredpayLogo from "./CredpayLogo";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
      } border-b border-gray-100`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A2740] flex items-center justify-center">
            <CredpayLogo size={20} color="#0BD751" />
          </div>
          <span className="font-bold text-[#0A2740] text-base">
            Shop <span className="text-[#0BD751]">by Credpay</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors">
            How it works
          </a>
          <a
            href="https://docs.credpay.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors"
          >
            Docs
          </a>
          <a
            href="https://x.com/credpay"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors"
          >
            Twitter
          </a>
        </div>

        {/* CTA */}
        <a
          href="https://docs.credpay.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#0A2740] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#0A2740]/90 transition-colors"
        >
          Get API Access
        </a>
      </div>
    </nav>
  );
}
