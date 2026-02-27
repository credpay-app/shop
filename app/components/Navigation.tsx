"use client";

import { useState, useEffect } from "react";
import CredpayLogo from "./CredpayLogo";

const SKILL_TEXT = `---
name: Universal Checkout Agent
description: Complete online shopping purchases on any online store using the Credpay Checkout API with x402 payments. Trigger when a user wants to buy, order, or checkout a product.
---

# Credpay Checkout Skill

**API Base URL:** \`https://checkout-agent.credpay.xyz\`

Trigger this skill whenever the user wants to purchase, order, or checkout a product from any online store.

## What you need from the user

Collect these before starting (ask if missing):

| Field | Example |
|---|---|
| Product URL | \`https://example.com/products/tee\` |
| Quantity | \`1\` |
| Size / Color (if applicable) | \`"Size": "M", "Color": "Black"\` |
| Email | \`customer@example.com\` |
| Goods total (USD) | \`"49.99"\` — item price as a USD string, no currency symbol |
| Shipping address | firstName, lastName, line1, city, state, postalCode, country, phone |

## Step 1 — Get a quote (no payment needed)

\`\`\`http
POST https://checkout-agent.credpay.xyz/v1/quote
Content-Type: application/json

{
  "items": [
    {
      "url": "<product URL>",
      "quantity": 1,
      "options": { "Size": "M", "Color": "Black" }
    }
  ],
  "email": "<email>",
  "shippingAddress": {
    "firstName": "Jane",
    "lastName": "Doe",
    "line1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "United States",
    "countryCode": "US",
    "phone": "+15125551234"
  },
  "goodsTotal": "<item price in USD as string, e.g. \"49.99\">"
}
\`\`\`

→ Save \`maxAmount\` from the response. This is the USDC amount you will pay via x402.

## Step 2 — Submit checkout (x402 payment required)

\`\`\`http
POST https://checkout-agent.credpay.xyz/v1/checkout
Content-Type: application/json
X-PAYMENT: <x402 payment payload for maxAmount on Base chainId 8453>

<same body as Step 1>
\`\`\`

→ On \`202\`: save \`requestId\` and go to Step 3.
→ On \`402\`: re-read the payment requirements from the response and retry with a correct \`X-PAYMENT\` header.

## Step 3 — Poll for completion

\`\`\`http
GET https://checkout-agent.credpay.xyz/v1/checkout/{requestId}
\`\`\`

Poll every 5 seconds. Stop when status is \`completed\` or \`failed\`. Timeout after 10 minutes.

| Status | Action |
|---|---|
| \`processing\` | Keep polling |
| \`authorization_required\` | See Step 4 |
| \`completed\` | Done — return result to user |
| \`failed\` | Report \`errorCode\` + \`errorMessage\` to user |

## Step 4 — Handle extra payment (if needed)

If status is \`authorization_required\`, the order total exceeded the quoted amount:

\`\`\`http
POST https://checkout-agent.credpay.xyz/v1/checkout/{requestId}/authorize
X-PAYMENT: <x402 payment for extraOwed amount>
\`\`\`

Then resume polling from Step 3.

## Rules

- Never create a second checkout for the same intent while a \`requestId\` is active.
- Retry transient network errors with exponential backoff. Never blind-retry \`failed\` status.
- Default \`chainId\` is \`8453\` (Base).

## Success response

\`\`\`json
{
  "requestId": "req_abc123",
  "status": "completed",
  "success": true,
  "orderNumber": "1234"
}
\`\`\`

## Failure response

\`\`\`json
{
  "requestId": "req_abc123",
  "status": "failed",
  "success": false,
  "errorCode": "payment_failed",
  "errorMessage": "Card declined"
}
\`\`\`
`;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(SKILL_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        } border-b border-gray-100`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A2740] flex items-center justify-center">
              <CredpayLogo size={20} color="#0BD751" />
            </div>
            <span className="font-bold text-[#0A2740] text-base">
              Shop <span className="text-[#0BD751]">by Credpay</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="https://x402.credpay.xyz"
              className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors"
            >
              x402 Credit
            </a>
            <a
              href="https://docs.credpay.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors"
            >
              Docs
            </a>
            <button
              onClick={() => setSkillOpen(true)}
              className="text-sm text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors"
            >
              Skills
            </button>
          </div>

          {/* CTA */}
          {/* <a
          href="https://docs.credpay.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#0A2740] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#0A2740]/90 transition-colors"
        >
          Get API Access
        </a> */}
        </div>
      </nav>

      {skillOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSkillOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-[#0A2740] text-sm">
                Agent Skill — Universal Checkout Agent
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#0A2740] text-white hover:bg-[#0A2740]/90 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => setSkillOpen(false)}
                  className="text-[#0A2740]/50 hover:text-[#0A2740] transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="overflow-auto p-5 text-xs text-[#0A2740]/80 font-mono whitespace-pre-wrap select-all">
              {SKILL_TEXT}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
