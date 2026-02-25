import BrandCarousel from "./BrandCarousel";

export default function Hero() {
  return (
    <section className="pt-32 pb-0 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#0BD751]/10 border border-[#0BD751]/20 text-[#0A2740] rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-[#0BD751] animate-pulse" />
          Universal Checkout
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#0A2740] leading-[1.05] tracking-tight mb-6">
          Any store.
          <br />
          <span className="text-[#0BD751]">One checkout agent.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-[#0A2740]/55 max-w-2xl mx-auto leading-relaxed mb-10">
          Send an order, pay with USDC, we handle the rest. Built for humans and AI agents alike.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <a
            href="#get-started"
            className="w-full sm:w-auto bg-[#0A2740] text-white font-semibold px-8 py-3.5 rounded-full hover:bg-[#0A2740]/90 transition-colors text-sm"
          >
            Try it now
          </a>
          <a
            href="https://docs.credpay.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto border-2 border-[#0A2740]/20 text-[#0A2740] font-semibold px-8 py-3.5 rounded-full hover:border-[#0A2740]/50 transition-colors text-sm"
          >
            Read the docs
          </a>
        </div>
      </div>

      {/* Brand carousel — full width */}
      <div className="mb-0">
        {/* <p className="text-center text-xs text-[#0A2740]/35 font-semibold uppercase tracking-widest mb-5">
          Works with any store that supports guest checkout
        </p> */}
        <BrandCarousel />
      </div>

      {/* Subtle separator wave */}
      <div
        className="h-24 mt-0"
        style={{
          background: "linear-gradient(to bottom, white 0%, #f8fafc 100%)",
        }}
      />
    </section>
  );
}
