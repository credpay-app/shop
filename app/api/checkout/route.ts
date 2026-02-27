import { NextRequest } from "next/server";

const API_BASE = process.env.CHECKOUT_API_BASE ?? "";

export async function POST(req: NextRequest) {
  if (!API_BASE) {
    return new Response(
      JSON.stringify({ error: "CHECKOUT_API_BASE is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Forward all headers except host/content-length so x402 headers (X-PAYMENT,
  // PAYMENT-REQUIRED, PAYMENT-RESPONSE) pass through transparently.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  req.headers.forEach((value, key) => {
    if (key !== "host" && key !== "content-length" && key !== "content-type") {
      headers[key] = value;
    }
  });

  const res = await fetch(`${API_BASE}/v1/checkout`, {
    method: "POST",
    headers,
    body: req.body,
    // @ts-expect-error — duplex required for streaming request body in Node 18+
    duplex: "half",
  });

  // Stream response back including all headers (x402 needs PAYMENT-REQUIRED etc.)
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
