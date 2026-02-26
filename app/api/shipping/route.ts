import { NextResponse } from "next/server";
import type { ShippingOption } from "../../types/shopping";

const TINYFISH_BASE = "https://agent.tinyfish.ai/v1";
const POLL_INTERVAL_MS = 6_000;
const MAX_POLL_MS = 5 * 60 * 1_000;

interface ShippingResult {
  productCost: number;
  currency: string;
  shippingOptions: ShippingOption[];
}

async function startJob(apiKey: string, url: string, goal: string): Promise<string> {
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
  if (!jobId) throw new Error(`TinyFish returned no job ID: ${JSON.stringify(data)}`);
  return jobId;
}

async function pollJob(apiKey: string, jobId: string): Promise<ShippingResult> {
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${TINYFISH_BASE}/runs/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TinyFish poll failed (HTTP ${res.status}): ${body}`);
    }

    const data = await res.json();
    console.log(`[TinyFish/shipping] job ${jobId} status: ${data.status}`);

    if (data.status === "COMPLETED") {
      const raw = data.result ?? data.resultJson;
      try {
        const parsed = typeof raw.result === "string" ? JSON.parse(raw.result) : raw.result;
        return parsed as ShippingResult;
      } catch {
        throw new Error(`Could not parse TinyFish shipping result: ${raw}`);
      }
    }

    if (data.status === "FAILED" || data.status === "ERROR") {
      throw new Error(data.error?.message ?? `Job ${jobId} failed`);
    }
  }

  throw new Error(`Timed out waiting for shipping job ${jobId}`);
}

function buildProductUrl(storeWebsite: string, shopAppProductUrl: string): string {
  try {
    const slug = new URL(shopAppProductUrl).pathname.split("/").filter(Boolean).pop() ?? "";
    const base = storeWebsite.replace(/\/$/, "");
    return `${base}/products/${slug}`;
  } catch {
    return shopAppProductUrl;
  }
}

export async function POST(req: Request) {
  let body: {
    storeWebsite: string;
    productUrl: string;
    selectedSize?: string;
    selectedColor?: string;
    address: {
      line1: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { storeWebsite, productUrl, selectedSize, selectedColor, address } = body;
  if (!storeWebsite || !productUrl || !address) {
    return NextResponse.json({ error: "storeWebsite, productUrl and address are required" }, { status: 400 });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey || apiKey === "sk-tinyfish-replace-me") {
    return NextResponse.json({ error: "TINYFISH_API_KEY is not configured" }, { status: 500 });
  }

  const storeProductUrl = buildProductUrl(storeWebsite, productUrl);
  console.log(`[shipping] fetching shipping options from ${storeProductUrl}`);

  const variantParts = [
    selectedSize ? `size "${selectedSize}"` : "",
    selectedColor ? `color "${selectedColor}"` : "",
  ].filter(Boolean).join(" and ");

  const goal = `
You are shopping on a Shopify store. Navigate to this product page: ${storeProductUrl}
${variantParts ? `Select the variant with ${variantParts}.` : ""}
Size: ${selectedSize ?? "N/A"}
Color: ${selectedColor ?? "N/A"}
Add the item to the cart, then proceed to checkout.
At checkout, enter the following shipping address:
  Address: ${address.line1}
  City: ${address.city}
  State/Province: ${address.state}
  ZIP/Postal: ${address.zip}
  Country: ${address.country}

Once the shipping options are shown, collect:
- productCost: the item price as a number
- currency: the currency code (e.g. "USD")
- shippingOptions: array of available shipping methods, each with:
    - name: shipping method name (e.g. "Standard Shipping", "Express")
    - price: cost as a number (0 if free)
    - estimatedDays: estimated delivery window as a string (e.g. "3-5 business days"), or omit if not shown

Return ONLY a valid JSON object:
{
  "productCost": number,
  "currency": string,
  "shippingOptions": [
    { "name": string, "price": number, "estimatedDays": string },
    ...
  ]
}

If the country is not in the country list or store's shipping zones, return { error: "Shipping not available to this country" }

If any step fails (e.g. product not found, cannot add to cart, checkout error), return a JSON object with an "error" field describing the issue:
{ "error": string }
`.trim();

  try {
    const jobId = await startJob(apiKey, storeProductUrl, goal);
    console.log(`[TinyFish/shipping] started job ${jobId}`);

    const result = await pollJob(apiKey, jobId);
    console.log(`[TinyFish/shipping] result: ${JSON.stringify(result)}`);

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shipping] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}