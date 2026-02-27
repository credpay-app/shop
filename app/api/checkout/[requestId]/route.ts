import { NextRequest } from "next/server";

const API_BASE = process.env.CHECKOUT_API_BASE ?? "";

export async function GET(
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
    if (key !== "host") headers[key] = value;
  });

  const res = await fetch(`${API_BASE}/v1/checkout/${params.requestId}`, {
    method: "GET",
    headers,
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
