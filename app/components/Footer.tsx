import CredpayLogo from "./CredpayLogo";

export default function Footer() {
  return (
    <footer className="bg-[#0A2740] py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0BD751] flex items-center justify-center">
                <CredpayLogo size={20} color="#0A2740" />
              </div>
              <span className="font-bold text-white text-base">
                Shop by Credpay
              </span>
            </div>
            <p className="text-[#8A9BB0] text-sm leading-relaxed">
              Universal checkout infrastructure for humans and autonomous
              agents. Powered by x402.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-6">
            <div>
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-4">
                Product
              </p>
              <ul className="space-y-3">
                {[
                  {
                    label: "How it works",
                    href: "https://docs.credpay.xyz/how-it-works",
                  },
                  { label: "Docs", href: "https://docs.credpay.xyz" },
                  { label: "API Reference", href: "https://docs.credpay.xyz" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        l.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-sm text-[#8A9BB0] hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-4">
                Company
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Credpay.xyz", href: "https://credpay.xyz" },
                  { label: "Twitter", href: "https://x.com/credpayapp" },
                  { label: "GitHub", href: "https://github.com/credpay-app" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#8A9BB0] hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <p className="text-xs text-[#8A9BB0]/60 text-center">
            © 2026 Credpay · Payments infrastructure for autonomous agents
          </p>
        </div>
      </div>
    </footer>
  );
}
