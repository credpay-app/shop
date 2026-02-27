"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { ClientEvmSigner } from "@x402/evm";
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Identity, Avatar, Name, Address } from "@coinbase/onchainkit/identity";
import { useUserStore } from "../hooks/useUserStore";
import type {
  ChatMessage,
  CartProduct,
  StoredUserData,
  // ShippingOption,  // SHIPPING: uncomment to re-enable delivery options step
  CheckoutPaymentData,
} from "../types/shopping";
import { Country, State } from "country-state-city";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

// ─── API calls ─────────────────────────────────────────────────────────────

async function fetchProducts(query: string): Promise<CartProduct[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Search failed (${res.status})`);
  }
  const data = await res.json();
  return data.products as CartProduct[];
}

// SHIPPING: uncomment to re-enable delivery options step
// async function fetchShippingOptions(
//   product: CartProduct,
//   selectedSize: string | undefined,
//   selectedColor: string | undefined,
//   address: StoredUserData["address"]
// ): Promise<{ productCost: number; currency: string; shippingOptions: ShippingOption[] }> {
//   const res = await fetch("/api/shipping", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       storeWebsite: product.storeWebsite,
//       productUrl: product.productUrl,
//       selectedSize,
//       selectedColor,
//       address,
//     }),
//   });
//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(body.error ?? `Shipping lookup failed (${res.status})`);
//   }
//   return res.json();
// }

const SEARCH_STATUS = [
  "Searching...",
  "Finding the best matches...",
  "Checking prices & availability...",
  "Comparing stores...",
  "Almost there...",
];

const CHIPS = [
  "Nike Air Max 95 size 10",
  "AirPods Pro (USB-C)",
  "Levi's 501 Original Jeans",
  "Adidas Ultraboost 24",
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function assistantMsg(
  content: string,
  type: ChatMessage["type"] = "text",
  data?: ChatMessage["data"]
): ChatMessage {
  return { id: uid(), role: "assistant", type, content, data };
}

function userMsg(content: string): ChatMessage {
  return { id: uid(), role: "user", type: "text", content };
}

function loadingMsg(): ChatMessage {
  return { id: uid(), role: "assistant", type: "loading", content: "" };
}

// ─── Sub-components ───────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#0A2740]/30 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function ProductCards({
  products,
  onSelect,
}: {
  products: CartProduct[];
  onSelect: (p: CartProduct) => void;
}) {
  return (
    <div className="space-y-2.5 mt-2 w-full max-w-sm">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Product image */}
          {p.imageUrl ? (
            <div className="w-full h-36 bg-gray-50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div
              className="w-full h-20 flex items-center justify-center text-white text-3xl font-bold"
              style={{ background: p.storeColor }}
            >
              {p.store[0]}
            </div>
          )}

          {/* Details row */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="min-w-0 mr-3">
              <p className="font-semibold text-[#0A2740] text-sm leading-tight truncate">{p.name}</p>
              <p className="text-[#0A2740]/45 text-xs mt-0.5">{p.store}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="font-bold text-[#0A2740] text-sm">
                {p.currency ?? "$"}{p.price}
              </span>
              <button
                onClick={() => onSelect(p)}
                className="bg-[#0A2740] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0A2740]/85 transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorGrid({
  colors,
  onSelect,
}: {
  colors: string[];
  onSelect: (c: string) => void;
}) {
  return (
    <div className="mt-2">
      <p className="text-xs text-[#0A2740]/50 mb-2.5">Choose your color</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className="min-w-[3rem] h-10 px-3 rounded-xl text-sm font-bold border-2 transition-all border-[#0A2740]/20 text-[#0A2740] hover:border-[#0A2740] hover:bg-[#0A2740] hover:text-white"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeGrid({
  sizes,
  onSelect,
}: {
  sizes: string[];
  onSelect: (s: string) => void;
}) {
  if (sizes.length === 0) {
    return (
      <div className="mt-2">
        <p className="text-xs text-[#0A2740]/50 mb-2.5">Choose your size</p>
        <p className="text-xs text-[#0A2740]/40 italic">No sizes available</p>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <p className="text-xs text-[#0A2740]/50 mb-2.5">Choose your size</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="min-w-[3rem] h-12 px-2 rounded-xl text-sm font-bold border-2 transition-all border-[#0A2740]/20 text-[#0A2740] hover:border-[#0A2740] hover:bg-[#0A2740] hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmDetails({
  data,
  onConfirm,
  onEdit,
}: {
  data: StoredUserData;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-sm w-full">
      <p className="text-xs font-semibold text-[#0A2740]/40 uppercase tracking-wider mb-3">
        Saved details
      </p>
      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex gap-2">
          <span className="text-[#0A2740]/40 w-16 shrink-0">Name</span>
          <span className="font-medium text-[#0A2740]">{data.name}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[#0A2740]/40 w-16 shrink-0">Email</span>
          <span className="font-medium text-[#0A2740]">{data.email}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[#0A2740]/40 w-16 shrink-0">Phone</span>
          <span className="font-medium text-[#0A2740]">{data.phone}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[#0A2740]/40 w-16 shrink-0">Ship to</span>
          <span className="font-medium text-[#0A2740] leading-snug">
            {data.address.line1}, {data.address.city}, {data.address.state}{" "}
            {data.address.zip}
          </span>
        </div>
      </div>
      <button
        onClick={onConfirm}
        className="w-full bg-[#0BD751] text-[#0A2740] font-bold py-2.5 rounded-xl text-sm hover:bg-[#09c248] transition-colors"
      >
        Confirm &amp; Checkout
      </button>
      <button
        onClick={onEdit}
        className="w-full text-xs text-[#0A2740]/35 hover:text-[#0A2740]/60 transition-colors mt-2.5 underline underline-offset-2"
      >
        Edit details
      </button>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#0A2740] placeholder-gray-300 focus:outline-none focus:border-[#0BD751] bg-gray-50/50 transition-colors";
const selectCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#0A2740] focus:outline-none focus:border-[#0BD751] bg-gray-50/50 transition-colors";
const labelCls = "block text-xs font-medium text-[#0A2740]/50 mb-1";

function AddressForm({ onSubmit }: { onSubmit: (d: StoredUserData) => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [phone, setPhone] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "country") setForm((f) => ({ ...f, country: v, state: "" }));
  };

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(form.country);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Enter a valid phone number");
      return;
    }
    setPhoneError("");
    onSubmit({
      name: form.name,
      email: form.email,
      phone,
      address: {
        line1: form.line1,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-sm w-full space-y-3"
    >
      <p className="text-xs font-semibold text-[#0A2740]/40 uppercase tracking-wider">
        Delivery details
      </p>

      <div>
        <label className={labelCls}>Full name</label>
        <input required placeholder="Jane Doe" value={form.name}
          onChange={(e) => set("name", e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Email</label>
        <input type="email" required placeholder="jane@example.com" value={form.email}
          onChange={(e) => set("email", e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Phone</label>
        <PhoneInput
          international
          defaultCountry="US"
          value={phone}
          onChange={(v) => { setPhone(v); setPhoneError(""); }}
          className="phone-input"
        />
        {phoneError && (
          <p className="text-xs text-red-500 mt-1">{phoneError}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>Address</label>
        <input required placeholder="123 Main St" value={form.line1}
          onChange={(e) => set("line1", e.target.value)} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Country</label>
          <select value={form.country} onChange={(e) => set("country", e.target.value)} className={selectCls}>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>State / Province</label>
          {states.length > 0 ? (
            <select required value={form.state} onChange={(e) => set("state", e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input placeholder="State" value={form.state}
              onChange={(e) => set("state", e.target.value)} className={inputCls} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>City</label>
          <input required placeholder="New York" value={form.city}
            onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ZIP / Postal</label>
          <input required placeholder="10001" value={form.zip}
            onChange={(e) => set("zip", e.target.value)} className={inputCls} />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#0BD751] text-[#0A2740] font-bold py-2.5 rounded-xl text-sm hover:bg-[#09c248] transition-colors mt-1"
      >
        Save &amp; Continue
      </button>
    </form>
  );
}

// SHIPPING: uncomment to re-enable delivery options step
// function ShippingOptionsCard({
//   productCost,
//   currency,
//   shippingOptions,
//   onSelect,
// }: {
//   productCost: number;
//   currency: string;
//   shippingOptions: ShippingOption[];
//   onSelect: (option: ShippingOption) => void;
// }) {
//   return (
//     <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-sm w-full">
//       <div className="flex justify-between items-center mb-3">
//         <p className="text-xs font-semibold text-[#0A2740]/40 uppercase tracking-wider">
//           Delivery options
//         </p>
//         <span className="text-sm font-bold text-[#0A2740]">
//           Item: {currency} {productCost.toFixed(2)}
//         </span>
//       </div>
//       <div className="space-y-2">
//         {shippingOptions.map((opt) => (
//           <button
//             key={opt.name}
//             onClick={() => onSelect(opt)}
//             className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm hover:border-[#0A2740] hover:bg-[#0A2740]/5 transition-all text-left"
//           >
//             <div>
//               <p className="font-semibold text-[#0A2740]">{opt.name}</p>
//               {opt.estimatedDays && (
//                 <p className="text-xs text-[#0A2740]/40">{opt.estimatedDays}</p>
//               )}
//             </div>
//             <span className="font-bold text-[#0A2740] shrink-0 ml-4">
//               {opt.price === 0 ? "Free" : `${currency} ${opt.price.toFixed(2)}`}
//             </span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// ─── x402 helpers ─────────────────────────────────────────────────────────

const POLL_INTERVAL = 5_000;
const POLL_TIMEOUT = 10 * 60 * 1_000;

function buildCheckoutBody(data: CheckoutPaymentData) {
  const nameParts = data.userData.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const addr = data.userData.address;
  const countryName = Country.getCountryByCode(addr.country)?.name ?? addr.country;

  const options: Record<string, string> = {};
  if (data.selectedSize) options["Size"] = data.selectedSize;
  if (data.selectedColor) options["Color"] = data.selectedColor;

  return {
    items: [
      {
        url: data.product.productUrl,
        quantity: 1,
        ...(Object.keys(options).length > 0 ? { options } : {}),
      },
    ],
    email: data.userData.email,
    shippingAddress: {
      firstName,
      lastName,
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.zip,
      country: countryName,
      countryCode: addr.country,
      phone: data.userData.phone,
    },
    goodsTotal: data.goodsTotal,
    chainId: 8453,
  };
}

// ─── PaymentCard component ─────────────────────────────────────────────────

type PayPhase = "idle" | "signing" | "polling" | "auth_required" | "done" | "failed";

function PaymentCard({
  data,
  onSuccess,
  onFailed,
}: {
  data: CheckoutPaymentData;
  onSuccess: (orderNumber: string) => void;
  onFailed: (msg: string) => void;
}) {
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [error, setError] = useState("");
  const doneRef = useRef(false);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: 8453 });

  const setErr = (msg: string) => {
    setError(msg);
    setPhase("failed");
    onFailed(msg);
  };

  const buildFetchWithPayment = () => {
    if (!walletClient) throw new Error("Wallet not connected");
    const signer: ClientEvmSigner = {
      address: walletClient.account.address,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signTypedData: (msg) => walletClient.signTypedData({ ...msg, account: walletClient.account } as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readContract: (args) => publicClient!.readContract(args as any),
    };
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });
    return wrapFetchWithPayment(fetch, client);
  };

  async function pollStatus(id: string, fetchWP: typeof fetch) {
    setPhase("polling");
    const deadline = Date.now() + POLL_TIMEOUT;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      if (doneRef.current) return;

      const res = await fetch(`/api/checkout/${id}`);
      const json = await res.json().catch(() => ({}));

      if (json.status === "completed") {
        doneRef.current = true;
        setPhase("done");
        onSuccess(json.orderNumber ?? id);
        return;
      }
      if (json.status === "failed") {
        setErr(json.errorMessage ?? "Checkout failed");
        return;
      }
      if (json.status === "authorization_required") {
        setPhase("auth_required");
        try {
          await fetchWP(`/api/checkout/${id}/authorize`, { method: "POST" });
          setPhase("polling");
        } catch (err) {
          if (err instanceof Error && err.message.includes("User rejected")) {
            setPhase("idle");
            setError("Authorization cancelled.");
          } else {
            setErr(err instanceof Error ? err.message : "Authorization failed");
          }
          return;
        }
      }
      // "processing" | "pending" → keep polling
    }
    setErr("Checkout timed out. Please contact support.");
  }

  async function handlePay() {
    if (!isConnected || !walletClient) return;
    try {
      setPhase("signing");
      setError("");
      const fetchWP = buildFetchWithPayment();
      const body = buildCheckoutBody(data);

      const checkoutRes = await fetchWP("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json().catch(() => ({}));
        setErr(err.error ?? `Checkout failed (${checkoutRes.status})`);
        return;
      }

      const checkout = await checkoutRes.json();
      await pollStatus(checkout.requestId, fetchWP);
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setPhase("idle");
        setError("Payment cancelled.");
      } else {
        setErr(err instanceof Error ? err.message : "Unexpected error");
      }
    }
  }

  const statusLabel: Partial<Record<PayPhase, string>> = {
    signing: "Check your wallet to sign...",
    polling: "Processing order...",
    auth_required: "Additional payment — check your wallet...",
  };

  const isBusy = phase === "signing" || phase === "polling" || phase === "auth_required";

  return (
    <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-sm w-full">
      {/* Order summary */}
      <p className="text-xs font-semibold text-[#0A2740]/40 uppercase tracking-wider mb-3">
        Order summary
      </p>
      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-[#0A2740]/60 truncate max-w-[65%]">{data.product.name}</span>
          <span className="font-medium text-[#0A2740]">{data.currency} {data.productCost.toFixed(2)}</span>
        </div>
        {data.selectedSize && (
          <div className="text-xs text-[#0A2740]/40">Size: {data.selectedSize}{data.selectedColor ? ` · ${data.selectedColor}` : ""}</div>
        )}
        {/* SHIPPING: uncomment to re-enable shipping line in order summary
        <div className="flex justify-between text-xs text-[#0A2740]/50">
          <span>{data.shippingOption?.name}</span>
          <span>{data.shippingOption?.price === 0 ? "Free" : `${data.currency} ${data.shippingOption?.price.toFixed(2)}`}</span>
        </div>
        */}
        <div className="flex justify-between font-bold text-[#0A2740] border-t border-gray-100 pt-2 mt-2">
          <span>Total</span>
          <span>{data.currency} {data.goodsTotal}</span>
        </div>
      </div>

      {/* Status */}
      {isBusy && (
        <div className="flex items-center gap-2 mb-3 text-sm text-[#0A2740]/70">
          <span className="w-4 h-4 border-2 border-[#0BD751] border-t-transparent rounded-full animate-spin shrink-0" />
          {statusLabel[phase]}
        </div>
      )}

      {/* Error */}
      {phase === "failed" && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Wallet connect / identity */}
      {phase !== "done" && phase !== "failed" && (
        <Wallet>
          <ConnectWallet className="w-full bg-[#0BD751] text-[#0A2740] font-bold py-2.5 rounded-xl text-sm hover:bg-[#09c248] transition-colors" />
          <WalletDropdown>
            <Identity hasCopyAddressOnClick className="px-4 pt-3 pb-2">
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      )}

      {/* Pay button */}
      {isConnected && phase === "idle" && (
        <div className="space-y-2 mt-2">
          <button
            onClick={handlePay}
            className="w-full bg-[#0BD751] text-[#0A2740] font-bold py-2.5 rounded-xl text-sm hover:bg-[#09c248] transition-colors"
          >
            Pay {data.currency} {data.goodsTotal} · USDC
          </button>
          {error && <p className="text-xs text-[#0A2740]/40 text-center">{error}</p>}
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="flex items-center gap-2 text-sm text-[#0A2740]/60">
          <div className="w-6 h-6 rounded-full bg-[#0BD751] flex items-center justify-center text-white text-xs font-bold">✓</div>
          Payment sent successfully
        </div>
      )}

      <p className="text-xs text-[#0A2740]/25 text-center mt-3">
        Settled in USDC on Base · Powered by x402
      </p>
    </div>
  );
}

function SuccessCard({ orderRef }: { orderRef: string }) {
  return (
    <div className="mt-2 bg-[#0BD751]/10 border border-[#0BD751]/30 rounded-2xl p-5 max-w-sm w-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#0BD751] flex items-center justify-center text-white font-bold text-lg">
          ✓
        </div>
        <div>
          <p className="font-bold text-[#0A2740]">Order confirmed!</p>
          <p className="text-xs text-[#0A2740]/50">Ref: {orderRef}</p>
        </div>
      </div>
      <p className="text-sm text-[#0A2740]/60 leading-relaxed">
        Your order is being processed. Checkout was completed via x402 · USDC.
        You&apos;ll receive a confirmation shortly.
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ShoppingAssistant() {
  const { data: storedUser, loaded: userLoaded, save: saveUser, clear: clearUser } =
    useUserStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [started, setStarted] = useState(false);
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);
  const selectionRef = useRef<{
    product?: CartProduct;
    size?: string;
    color?: string;
  }>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMsg = messages[messages.length - 1];
  const isSearchLoading = !!lastMsg && lastMsg.type === "loading" && !lastMsg.content;

  useEffect(() => {
    if (!isSearchLoading) return;
    setLoadingStatusIdx(0);
    const interval = setInterval(() => {
      setLoadingStatusIdx((prev) => Math.min(prev + 1, SEARCH_STATUS.length - 1));
    }, 30000);
    return () => clearInterval(interval);
  }, [isSearchLoading]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const push = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const replaceLast = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev.slice(0, -1), msg]);
  }, []);

  // Step 1: User sends query → intent mandate → TinyFish cart mandate
  const handleSend = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setStarted(true);
    setQuery("");

    push(userMsg(trimmed), loadingMsg());

    try {
      const products = await fetchProducts(trimmed);
      replaceLast(
        assistantMsg(
          `Found ${products.length} result${products.length !== 1 ? "s" : ""} for "${trimmed}". Pick a store:`,
          "products",
          { products }
        )
      );
    } catch (err) {
      replaceLast(
        assistantMsg(
          `Sorry, I couldn't find "${trimmed}" right now. ${err instanceof Error ? err.message : "Please try again."}`,
          "text"
        )
      );
    }
  };

  // Step 2: User selects product → show size/color pickers only if non-empty
  const handleSelectProduct = (product: CartProduct) => {
    selectionRef.current = { product };
    push(userMsg(`I'll go with ${product.store} — $${product.price}`));

    if (product.availableSizes.length > 0) {
      push(
        assistantMsg(
          `Great choice! Select your size for the ${product.name} from ${product.store}:`,
          "size_selector",
          { sizes: product.availableSizes, colors: product.colors, selectedProduct: product }
        )
      );
    } else if (product.colors.length > 0) {
      push(
        assistantMsg(
          `Great choice! Pick your color for the ${product.name} from ${product.store}:`,
          "color_selector",
          { colors: product.colors }
        )
      );
    } else {
      promptForDelivery();
    }
  };

  // Step 3: User picks size → show color picker if colors available, else proceed
  const handleSelectSize = (size: string, colors: string[]) => {
    selectionRef.current.size = size;
    push(userMsg(`Size ${size}`));

    if (colors.length > 0) {
      push(assistantMsg("Nice! Now pick your color:", "color_selector", { colors }));
    } else {
      promptForDelivery();
    }
  };

  // Step 3b: User picks color → prompt for delivery
  const handleSelectColor = (color: string) => {
    selectionRef.current.color = color;
    push(userMsg(`Color: ${color}`));
    promptForDelivery();
  };

  const promptForDelivery = () => {
    if (userLoaded && storedUser) {
      push(
        assistantMsg(
          "I found your saved delivery details. Please confirm:",
          "confirm_details",
          { storedData: storedUser }
        )
      );
    } else {
      push(
        assistantMsg(
          "Almost there! I need your delivery details to complete the checkout:",
          "address_form"
        )
      );
    }
  };

  // Shared helper: build and push the payment card directly using product price
  const goToPayment = (userData: StoredUserData) => {
    const { product, size, color } = selectionRef.current;
    if (!product) return;
    const goodsTotal = product.price.toFixed(2);
    const currency = product.currency ?? "USD";
    push(
      assistantMsg(
        `Ready to checkout! Total: ${currency} ${goodsTotal}`,
        "checkout_payment",
        {
          checkoutPayment: {
            product,
            selectedSize: size,
            selectedColor: color,
            userData,
            productCost: product.price,
            currency,
            goodsTotal,
          },
        }
      )
    );
  };

  // Step 4a: User confirms stored details → go straight to payment
  // SHIPPING: to re-enable, replace goToPayment(storedUser) with fetchShipping(storedUser.address)
  const handleConfirmDetails = () => {
    if (storedUser) goToPayment(storedUser);
  };

  // Step 4b: User wants to edit → clear stored, show form
  const handleEditDetails = () => {
    clearUser();
    push(assistantMsg("No problem — enter your updated delivery details:", "address_form"));
  };

  // Step 4c: User submits form → save → go straight to payment
  // SHIPPING: to re-enable, replace goToPayment(d) with fetchShipping(d.address)
  const handleFormSubmit = (d: StoredUserData) => {
    saveUser(d);
    push(userMsg("Details saved ✓"));
    goToPayment(d);
  };

  // SHIPPING: uncomment to re-enable delivery options step (Steps 5 & 6)
  // const fetchShipping = async (address: StoredUserData["address"]) => {
  //   const { product, size, color } = selectionRef.current;
  //   if (!product) return;
  //   push(assistantMsg("Looking up delivery options...", "loading"));
  //   try {
  //     const result = await fetchShippingOptions(product, size, color, address);
  //     replaceLast(
  //       assistantMsg(
  //         "Here are the available delivery options. Pick one to see the total:",
  //         "shipping_options",
  //         {
  //           shippingOptions: result.shippingOptions,
  //           productCost: result.productCost,
  //           currency: result.currency,
  //         }
  //       )
  //     );
  //   } catch {
  //     const price = product.price.toFixed(2);
  //     const currency = product.currency ?? "USD";
  //     console.warn("[shipping] failed, falling back to product price");
  //     if (!storedUser) return;
  //     const fallbackOption: ShippingOption = { name: "Standard", price: 0 };
  //     const checkoutData: CheckoutPaymentData = {
  //       product,
  //       selectedSize: selectionRef.current.size,
  //       selectedColor: selectionRef.current.color,
  //       userData: storedUser,
  //       shippingOption: fallbackOption,
  //       productCost: product.price,
  //       currency,
  //       goodsTotal: price,
  //     };
  //     replaceLast(
  //       assistantMsg(`Ready to checkout! Total: ${currency} ${price}`, "checkout_payment", {
  //         checkoutPayment: checkoutData,
  //       })
  //     );
  //   }
  // };

  // const handleSelectShipping = (option: ShippingOption, productCost: number, currency: string) => {
  //   push(userMsg(`${option.name} — ${option.price === 0 ? "Free" : `${currency} ${option.price.toFixed(2)}`}`));
  //   const { product, size, color } = selectionRef.current;
  //   if (!product || !storedUser) return;
  //   const goodsTotal = (productCost + option.price).toFixed(2);
  //   const checkoutData: CheckoutPaymentData = {
  //     product,
  //     selectedSize: size,
  //     selectedColor: color,
  //     userData: storedUser,
  //     shippingOption: option,
  //     productCost,
  //     currency,
  //     goodsTotal,
  //   };
  //   push(
  //     assistantMsg(
  //       `Ready to checkout! Total: ${currency} ${goodsTotal}`,
  //       "checkout_payment",
  //       { checkoutPayment: checkoutData }
  //     )
  //   );
  // };

  return (
    <div className="flex flex-col" style={{ minHeight: 400 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-[#0BD751]/15 flex items-center justify-center text-xl">
          🛍️
        </div>
        <div>
          <h3 className="font-bold text-[#0A2740] text-lg leading-tight">
            Shopping Assistant
          </h3>
          <p className="text-[#0A2740]/45 text-sm">
            Tell me what you want to buy
          </p>
        </div>
      </div>

      {/* Chat messages */}
      {started && (
        <div className="flex-1 overflow-y-auto max-h-[420px] space-y-3 mb-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="bg-[#0A2740] text-white text-sm font-medium px-4 py-2.5 rounded-3xl rounded-tr-sm max-w-[75%]">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%]">
                  {msg.type === "loading" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">
                        {msg.content || SEARCH_STATUS[loadingStatusIdx]}
                      </p>
                      <TypingDots />
                    </div>
                  )}

                  {msg.type === "text" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm text-[#0A2740]">
                      {msg.content}
                    </div>
                  )}

                  {msg.type === "products" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-2">{msg.content}</p>
                      <ProductCards
                        products={msg.data?.products ?? []}
                        onSelect={handleSelectProduct}
                      />
                    </div>
                  )}

                  {msg.type === "size_selector" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <SizeGrid
                        sizes={msg.data?.sizes ?? []}
                        onSelect={(s) => handleSelectSize(s, msg.data?.colors ?? [])}
                      />
                    </div>
                  )}

                  {msg.type === "color_selector" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <ColorGrid
                        colors={msg.data?.colors ?? []}
                        onSelect={handleSelectColor}
                      />
                    </div>
                  )}

                  {msg.type === "confirm_details" && msg.data?.storedData && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <ConfirmDetails
                        data={msg.data.storedData}
                        onConfirm={handleConfirmDetails}
                        onEdit={handleEditDetails}
                      />
                    </div>
                  )}

                  {msg.type === "address_form" && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <AddressForm onSubmit={handleFormSubmit} />
                    </div>
                  )}

                  {/* SHIPPING: uncomment to re-enable delivery options step
                  {msg.type === "shipping_options" && msg.data?.shippingOptions && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <ShippingOptionsCard
                        productCost={msg.data.productCost ?? 0}
                        currency={msg.data.currency ?? "USD"}
                        shippingOptions={msg.data.shippingOptions}
                        onSelect={(opt) =>
                          handleSelectShipping(
                            opt,
                            msg.data?.productCost ?? 0,
                            msg.data?.currency ?? "USD"
                          )
                        }
                      />
                    </div>
                  )}
                  */}

                  {msg.type === "checkout_payment" && msg.data?.checkoutPayment && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-[#0A2740] mb-1">{msg.content}</p>
                      <PaymentCard
                        data={msg.data.checkoutPayment}
                        onSuccess={(orderNumber) =>
                          push(
                            assistantMsg("Order placed!", "success", { orderRef: orderNumber })
                          )
                        }
                        onFailed={(errMsg) =>
                          push(assistantMsg(`Checkout failed: ${errMsg}`, "text"))
                        }
                      />
                    </div>
                  )}

                  {msg.type === "success" && msg.data?.orderRef && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <SuccessCard orderRef={msg.data.orderRef} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input — visible only before first message */}
      {!started && (
        <div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
              placeholder='e.g. "Nike Air Max 95 size 10 in white"'
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-[#0A2740] placeholder-gray-300 text-sm focus:outline-none focus:border-[#0BD751] transition-colors bg-gray-50/50"
            />
            <button
              onClick={() => handleSend(query)}
              className="bg-[#0BD751] text-[#0A2740] font-bold px-5 py-3 rounded-xl hover:bg-[#09c248] transition-colors text-sm shrink-0"
            >
              Find
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="text-xs bg-white border border-gray-200 text-[#0A2740]/60 hover:text-[#0A2740] hover:border-[#0A2740]/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-[#0A2740]/25 mt-5">
        Payments settled in USDC · Powered by <a href="https://x402.credpay.xyz" className="text-[#0A2740]/60 hover:text-[#0A2740] font-medium transition-colors">x402</a> · 
      </p>
    </div>
  );
}
