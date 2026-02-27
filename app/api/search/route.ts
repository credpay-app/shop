import { NextResponse } from "next/server";

const TINYFISH_BASE = "https://agent.tinyfish.ai/v1";

// ─── Route handler ─────────────────────────────────────────────────────────
// Starts a TinyFish async job and returns the jobId immediately.
// The frontend polls GET /api/search/[jobId] for results.

export async function POST(req: Request) {
  let query: string;
  try {
    const body = await req.json();
    query = (body.query ?? "").trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey || apiKey === "sk-tinyfish-replace-me") {
    return NextResponse.json(
      { error: "TINYFISH_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const searchUrl = `https://shop.app/search?q=${encodeURIComponent(query)}`;

  const goal = `
  You are an expert at finding products on Shopify stores. The user is asking you to find products that match the query ${query}.
The page shows product listings from various Shopify stores.
Extract the top 5 product results from the search results page.
For each product collect:
  - name: the product title
  - store: the merchant/store name
  - price: the price as a number (no currency symbol)
  - currency: the currency code (e.g. "USD")
  - availableSizes: array of available size strings, or [] if not applicable
  - colors: array of available color strings, or [] if not applicable
  - productUrl: the full URL to the product page
  - storeWebsite: the full URL to the store's website (e.g. "https://examplestore.com")
  - variants: array of variant objects, or [] if not applicable
  - imageUrl: the full URL to the product image

Return ONLY a valid JSON array of exactly up to 5 objects:
[
  { "name": string, "store": string, "storeWebsite": string, "price": number, "currency": string, "availableSizes": string[], "colors": string[], "productUrl": string, "variants": string[], "imageUrl": string },
  ...
]
`.trim();

  try {
    const res = await fetch(`${TINYFISH_BASE}/automation/run-async`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: searchUrl,
        goal,
        browser_profile: "stealth",
        proxy_config: { enabled: true, country_code: "US" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TinyFish start failed (HTTP ${res.status}): ${body}`);
    }

    const data = await res.json();
    const jobId: string = data.id ?? data.task_id ?? data.run_id;
    if (!jobId) {
      throw new Error(`TinyFish returned no job ID: ${JSON.stringify(data)}`);
    }

    console.log(
      `[TinyFish] started job ${jobId} — shop.app search: "${query}"`,
    );

    return NextResponse.json({ jobId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[search] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
