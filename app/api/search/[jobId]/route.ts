import { NextResponse } from "next/server";
import type { CartProduct } from "../../../types/shopping";

const TINYFISH_BASE = "https://agent.tinyfish.ai/v1";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey || apiKey === "sk-tinyfish-replace-me") {
    return NextResponse.json(
      { error: "TINYFISH_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${TINYFISH_BASE}/runs/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TinyFish poll failed (HTTP ${res.status}): ${body}`);
    }

    const data = await res.json();
    const status: string = data.status;
    console.log(`[TinyFish] job ${jobId} status: ${status}`);

    if (status === "COMPLETED") {
      const raw = data.result ?? data.resultJson;
      let results: ShopResult[];
      try {
        const parsed =
          typeof raw.result === "string" ? JSON.parse(raw.result) : raw.result;
        results = Array.isArray(parsed) ? parsed : (parsed.products ?? []);
      } catch {
        throw new Error(`Could not parse TinyFish result: ${raw}`);
      }

      if (!results.length) {
        return NextResponse.json(
          { status: "completed", products: [] },
          { status: 200 },
        );
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

      return NextResponse.json({ status: "completed", products });
    }

    if (status === "FAILED" || status === "ERROR") {
      const msg = data.error?.message ?? `Job ${jobId} failed`;
      return NextResponse.json({ status: "failed", error: msg });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[search poll] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
