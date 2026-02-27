import { NextRequest } from "next/server";

const API_BASE = process.env.CHECKOUT_API_BASE ?? "";

export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  if (!API_BASE) {
    return new Response(JSON.stringify({ error: "CHECKOUT_API_BASE is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key !== "host" && key !== "content-length") headers[key] = value;
  });

  const res = await fetch(`${API_BASE}/v1/checkout/${params.requestId}/authorize`, {
    method: "POST",
    headers,
    body: req.body,
    // @ts-expect-error — duplex required for streaming request body in Node 18+
    duplex: "half",
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
