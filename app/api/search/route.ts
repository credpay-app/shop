import { NextResponse } from "next/server";
import type { CartProduct } from "../../types/shopping";

const TINYFISH_BASE = "https://agent.tinyfish.ai/v1";
const POLL_INTERVAL_MS = 6_000;
const MAX_POLL_MS = 5 * 60 * 1_000;

// ─── TinyFish async + poll ──────────────────────────────────────────────────

interface ShopResult {
  name: string;
  store: string;
  storeWebsite: string;
  price: number;
  currency: string;
  availableSizes: string[];
  colors: string[];
  productUrl: string;
  variants: string[];
  imageUrl: string;
}

async function startJob(
  apiKey: string,
  url: string,
  goal: string,
): Promise<string> {
  const res = await fetch(`${TINYFISH_BASE}/automation/run-async`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
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
  if (!jobId)
    throw new Error(`TinyFish returned no job ID: ${JSON.stringify(data)}`);
  return jobId;
}

async function pollJob(apiKey: string, jobId: string): Promise<ShopResult[]> {
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${TINYFISH_BASE}/runs/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });
    console.log(jobId, res);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TinyFish poll failed (HTTP ${res.status}): ${body}`);
    }

    const data = await res.json();
    console.log(`[TinyFish] job ${jobId} status: ${data.status}`);

    if (data.status === "COMPLETED") {
      const raw = data.result ?? data.resultJson;
      console.log(raw);
      try {
        const parsed =
          typeof raw.result === "string" ? JSON.parse(raw.result) : raw.result;
        return Array.isArray(parsed) ? parsed : (parsed.products ?? []);
      } catch {
        throw new Error(`Could not parse TinyFish result: ${raw}`);
      }
    }

    if (data.status === "FAILED" || data.status === "ERROR") {
      throw new Error(data.error?.message ?? `Job ${jobId} failed`);
    }
    // RUNNING / QUEUED — keep polling
  }

  throw new Error(`Timed out waiting for job ${jobId}`);
}

// ─── Route handler ─────────────────────────────────────────────────────────

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
    const jobId = await startJob(apiKey, searchUrl, goal);
    console.log(
      `[TinyFish] started job ${jobId} — shop.app search: "${query}"`,
    );

    const results = await pollJob(apiKey, jobId);
    console.log(`[TinyFish] results: ${JSON.stringify(results)}`);

    if (!results.length) {
      return NextResponse.json({ error: "No products found" }, { status: 404 });
    }

    const products: CartProduct[] = results.slice(0, 5).map((r, i) => ({
      id: `shop-${i}-${Date.now()}`,
      name: r.name,
      store: r.store,
      storeColor: "#96BF48",
      storeWebsite: r.storeWebsite ?? "",
      price: r.price,
      currency: r.currency ?? "USD",
      availableSizes: r.availableSizes ?? [],
      colors: r.colors ?? [],
      productUrl: r.productUrl ?? "",
      variants: r.variants ?? [],
      imageUrl: r.imageUrl ?? "",
    }));

    return NextResponse.json({ products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[search] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
