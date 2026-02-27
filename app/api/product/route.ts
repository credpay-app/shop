import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "";

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Validate this is actually a Shopify store before doing anything else
  const { isShopify, storeCurrency } = await isShopifyUrl(rawUrl);
  if (!isShopify) {
    return Response.json(
      { error: "That doesn't look like a Shopify store. Only Shopify stores are supported right now — more coming soon." },
      { status: 400 }
    );
  }

  // Extract product handle from pathname: /products/{handle}
  const match = parsed.pathname.match(/\/products\/([^/?#]+)/);
  if (!match) {
    return Response.json(
      { error: "Could not find a product in that URL. Make sure it's a direct product page link." },
      { status: 400 }
    );
  }

  const handle = match[1];
  const storeOrigin = parsed.origin;
  const variantId = parsed.searchParams.get("variant");

  const productJsonUrl = `${storeOrigin}/products/${handle}.json`;

  let data: ShopifyProductResponse;
  try {
    const res = await fetch(productJsonUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CredpayBot/1.0)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return Response.json(
        { error: "Product not found. Make sure the URL points to a specific product page." },
        { status: 404 }
      );
    }
    data = await res.json();
  } catch {
    return Response.json({ error: "Failed to reach the store." }, { status: 502 });
  }

  const p = data.product;
  if (!p) {
    return Response.json({ error: "No product data returned." }, { status: 404 });
  }

  // Pick variant: match by ID in URL, else first available, else first
  const variant =
    (variantId && p.variants.find((v) => String(v.id) === variantId)) ||
    p.variants.find((v) => v.available) ||
    p.variants[0];

  if (!variant) {
    return Response.json({ error: "No variants available for this product." }, { status: 404 });
  }

  // Extract sizes and colors from product options
  const sizeOption = p.options?.find((o) =>
    /^siz(e|es)$/i.test(o.name)
  );
  const colorOption = p.options?.find((o) =>
    /^colou?rs?$/i.test(o.name)
  );

  // Only include sizes/colors for variants that are actually available
  const availableVariants = p.variants.filter((v) => v.available);
  const sourceVariants = availableVariants.length > 0 ? availableVariants : p.variants;

  const sizePos = sizeOption ? p.options!.indexOf(sizeOption) : -1;
  const colorPos = colorOption ? p.options!.indexOf(colorOption) : -1;
  const optionKey = (pos: number) =>
    (["option1", "option2", "option3"] as const)[pos];

  const availableSizes = sizePos >= 0
    ? Array.from(new Set(sourceVariants.map((v) => v[optionKey(sizePos)]).filter(Boolean)))
    : [];
  const colors = colorPos >= 0
    ? Array.from(new Set(sourceVariants.map((v) => v[optionKey(colorPos)]).filter(Boolean)))
    : [];

  const hostname = parsed.hostname.replace(/^www\./, "");
  const storeName = hostname.split(".")[0];
  const storeDisplay = storeName.charAt(0).toUpperCase() + storeName.slice(1);

  return Response.json({
    id: String(p.id),
    name: p.title,
    store: storeDisplay,
    storeWebsite: storeOrigin,
    storeColor: "#0A2740",
    productUrl: rawUrl,
    price: parseFloat(variant.price),
    currency: storeCurrency ?? "USD",
    availableSizes,
    colors,
    imageUrl: p.images?.[0]?.src ?? undefined,
    variantTitle: variant.title !== "Default Title" ? variant.title : undefined,
  });
}

// ─── Shopify validation ────────────────────────────────────────────────────

async function isShopifyUrl(
  url: string,
): Promise<{ isShopify: boolean; shipsTo: string[] | null; storeCurrency: string | null }> {
  let hostname: string;
  try {
    ({ hostname } = new URL(url));
  } catch {
    return { isShopify: false, shipsTo: null, storeCurrency: null };
  }

  const isTier1 =
    hostname === "shop.app" ||
    hostname.endsWith(".myshopify.com") ||
    hostname === "shopify.com" ||
    hostname.endsWith(".shopify.com");

  if (isTier1) {
    // Hostname already proves it's Shopify — fetch meta.json only for ships_to_countries.
    // If the fetch fails for any reason we still let the checkout proceed.
    try {
      const res = await fetch(`https://${hostname}/meta.json`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        const json = (await res.json()) as Record<string, unknown>;
        const rawShipsTo = json.ships_to_countries;
        const shipsTo =
          Array.isArray(rawShipsTo) && rawShipsTo.length > 0
            ? (rawShipsTo as string[])
            : null;
        const storeCurrency =
          typeof json.currency === "string" && json.currency.length === 3
            ? json.currency.toUpperCase()
            : null;
        return { isShopify: true, shipsTo, storeCurrency };
      }
    } catch {
      // Fetch failed — still a valid Shopify store, just no country data
    }
    return { isShopify: true, shipsTo: null, storeCurrency: null };
  }

  // Tier 2: Custom domain — /meta.json with cross-verification
  try {
    const res = await fetch(`https://${hostname}/meta.json`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return { isShopify: false, shipsTo: null, storeCurrency: null };
    const json = (await res.json()) as Record<string, unknown>;

    // Check A: domain field must match the URL we're validating
    if (typeof json.domain !== "string" || json.domain !== hostname) {
      return { isShopify: false, shipsTo: null, storeCurrency: null };
    }

    // Check B: myshopify round-trip — verify the store's .myshopify.com backend agrees
    const myshopifyDomain = json.myshopify_domain;
    if (
      typeof myshopifyDomain !== "string" ||
      !myshopifyDomain.endsWith(".myshopify.com")
    ) {
      return { isShopify: false, shipsTo: null, storeCurrency: null };
    }
    const res2 = await fetch(`https://${myshopifyDomain}/meta.json`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res2.ok) return { isShopify: false, shipsTo: null, storeCurrency: null };
    const json2 = (await res2.json()) as Record<string, unknown>;
    if (json2.domain !== hostname) return { isShopify: false, shipsTo: null, storeCurrency: null };

    // Extract ships_to_countries (null if absent or empty — skip check downstream)
    const rawShipsTo = json.ships_to_countries;
    const shipsTo =
      Array.isArray(rawShipsTo) && rawShipsTo.length > 0
        ? (rawShipsTo as string[])
        : null;
    const storeCurrency =
      typeof json.currency === "string" && json.currency.length === 3
        ? json.currency.toUpperCase()
        : null;

    return { isShopify: true, shipsTo, storeCurrency };
  } catch {
    return { isShopify: false, shipsTo: null, storeCurrency: null };
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  option1: string;
  option2: string;
  option3: string;
}

interface ShopifyProductOption {
  name: string;
  position: number;
  values: string[];
}

interface ShopifyProductResponse {
  product: {
    id: number;
    title: string;
    options?: ShopifyProductOption[];
    variants: ShopifyVariant[];
    images?: { src: string }[];
  };
}
