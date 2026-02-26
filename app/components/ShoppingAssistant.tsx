"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUserStore } from "../hooks/useUserStore";
import type {
  ChatMessage,
  CartProduct,
  StoredUserData,
  ShippingOption,
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

async function fetchShippingOptions(
  product: CartProduct,
  selectedSize: string | undefined,
  selectedColor: string | undefined,
  address: StoredUserData["address"]
): Promise<{ productCost: number; currency: string; shippingOptions: ShippingOption[] }> {
  const res = await fetch("/api/shipping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storeWebsite: product.storeWebsite,
      productUrl: product.productUrl,
      selectedSize,
      selectedColor,
      address,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Shipping lookup failed (${res.status})`);
  }
  return res.json();
}

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
          className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: p.storeColor }}
            >
              {p.store[0]}
            </div>
            <div>
              <p className="font-semibold text-[#0A2740] text-sm leading-tight">{p.name}</p>
              <p className="text-[#0A2740]/45 text-xs">{p.store}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-bold text-[#0A2740] text-sm">
              ${p.price}
            </span>
            <button
              onClick={() => onSelect(p)}
              className="bg-[#0A2740] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0A2740]/85 transition-colors"
            >
              Select
            </button>
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

function ShippingOptionsCard({
  productCost,
  currency,
  shippingOptions,
  onSelect,
}: {
  productCost: number;
  currency: string;
  shippingOptions: ShippingOption[];
  onSelect: (option: ShippingOption) => void;
}) {
  return (
    <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-sm w-full">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-semibold text-[#0A2740]/40 uppercase tracking-wider">
          Delivery options
        </p>
        <span className="text-sm font-bold text-[#0A2740]">
          Item: {currency} {productCost.toFixed(2)}
        </span>
      </div>
      <div className="space-y-2">
        {shippingOptions.map((opt) => (
          <button
            key={opt.name}
            onClick={() => onSelect(opt)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm hover:border-[#0A2740] hover:bg-[#0A2740]/5 transition-all text-left"
          >
            <div>
              <p className="font-semibold text-[#0A2740]">{opt.name}</p>
              {opt.estimatedDays && (
                <p className="text-xs text-[#0A2740]/40">{opt.estimatedDays}</p>
              )}
            </div>
            <span className="font-bold text-[#0A2740] shrink-0 ml-4">
              {opt.price === 0 ? "Free" : `${currency} ${opt.price.toFixed(2)}`}
            </span>
          </button>
        ))}
      </div>
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

  // Step 4a: User confirms stored details → fetch shipping
  const handleConfirmDetails = () => {
    if (storedUser) fetchShipping(storedUser.address);
  };

  // Step 4b: User wants to edit → clear stored, show form
  const handleEditDetails = () => {
    clearUser();
    push(assistantMsg("No problem — enter your updated delivery details:", "address_form"));
  };

  // Step 4c: User submits form → save → fetch shipping
  const handleFormSubmit = (d: StoredUserData) => {
    saveUser(d);
    push(userMsg("Details saved ✓"));
    fetchShipping(d.address);
  };

  // Step 5: Fetch shipping options from TinyFish
  const fetchShipping = async (address: StoredUserData["address"]) => {
    const { product, size, color } = selectionRef.current;
    if (!product) return;

    push(assistantMsg("Looking up delivery options...", "loading"));

    try {
      const result = await fetchShippingOptions(product, size, color, address);
      replaceLast(
        assistantMsg(
          "Here are the available delivery options. Pick one to see the total:",
          "shipping_options",
          {
            shippingOptions: result.shippingOptions,
            productCost: result.productCost,
            currency: result.currency,
          }
        )
      );
    } catch {
      const price = product.price.toFixed(2);
      const currency = product.currency ?? "USD";
      console.warn("[shipping] failed, proceeding with product price only");
      replaceLast(assistantMsg(`Processing your order...`, "loading"));
      triggerCheckout(price, currency);
    }
  };

  // Step 6: User picks shipping → show total → checkout
  const handleSelectShipping = (option: ShippingOption, productCost: number, currency: string) => {
    const total = (productCost + option.price).toFixed(2);
    push(userMsg(`${option.name} — ${option.price === 0 ? "Free" : `${currency} ${option.price.toFixed(2)}`}`));
    triggerCheckout(total, currency);
  };

  // Final step: Process payment
  const triggerCheckout = (total: string, currency: string) => {
    push(
      assistantMsg(
        `Sending payment of ${currency} ${total} via x402...`,
        "loading"
      )
    );

    setTimeout(() => {
      const ref = "CPY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      replaceLast(
        assistantMsg(
          "Checkout complete!",
          "success",
          { orderRef: ref }
        )
      );
    }, 2200);
  };

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
