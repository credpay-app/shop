import {
  siNike,
  siAdidas,
  siHandm,
  siZara,
  siUniqlo,
  siTarget,
  siShopify,
  siWoocommerce,
  siFarfetch,
  siEtsy,
  siEbay,
  siPuma,
  siNewbalance,
  siUnderarmour,
} from "simple-icons";

type SimpleIcon = { path: string; hex: string; title: string };

function BrandIcon({ icon, size = 28 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#${icon.hex}`}
      aria-label={icon.title}
      role="img"
    >
      <path d={icon.path} />
    </svg>
  );
}

const brands: { icon: SimpleIcon; name: string }[] = [
  { icon: siNike, name: "Nike" },
  { icon: siAdidas, name: "Adidas" },
  { icon: siHandm, name: "H&M" },
  { icon: siZara, name: "Zara" },
  { icon: siUniqlo, name: "Uniqlo" },
  { icon: siTarget, name: "Target" },
  { icon: siShopify, name: "Shopify" },
  { icon: siWoocommerce, name: "WooCommerce" },
  { icon: siFarfetch, name: "Farfetch" },
  { icon: siEtsy, name: "Etsy" },
  { icon: siEbay, name: "eBay" },
  { icon: siPuma, name: "Puma" },
  { icon: siNewbalance, name: "New Balance" },
  { icon: siUnderarmour, name: "Under Armour" },
];

export default function BrandCarousel() {
  const doubled = [...brands, ...brands];

  return (
    <div className="relative overflow-hidden w-full">
      {/* Left fade */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="flex items-center animate-marquee w-max py-3">
        {doubled.map(({ icon, name }, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 mx-4 px-6 py-3 border border-gray-150 rounded-2xl bg-white shadow-sm flex items-center justify-center"
            style={{ height: 64 }}
          >
            <BrandIcon icon={icon} size={30} />
          </div>
        ))}
      </div>
    </div>
  );
}
