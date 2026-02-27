export interface IntentMandate {
  query: string;
}

export interface CartProduct {
  id: string;
  name: string;
  store: string;
  storeColor: string;
  storeWebsite: string;
  productUrl: string;
  price: number;
  currency: string;
  availableSizes: string[];
  colors: string[];
  imageUrl?: string;
}

export interface ShippingOption {
  name: string;
  price: number;
  estimatedDays?: string;
}

export interface CartMandate {
  products: CartProduct[];
  expiresAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface StoredUserData {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface PaymentMandate {
  productId: string;
  selectedSize: string;
  credentials: StoredUserData;
  paymentMethod: "x402_usdc";
}

export interface CheckoutPaymentData {
  product: CartProduct;
  selectedSize?: string;
  selectedColor?: string;
  userData: StoredUserData;
  shippingOption?: ShippingOption;
  productCost: number;
  currency: string;
  goodsTotal: string;
}

export type ChatMessageType =
  | "text"
  | "loading"
  | "products"
  | "size_selector"
  | "color_selector"
  | "confirm_details"
  | "address_form"
  // | "shipping_options"  // SHIPPING: uncomment to re-enable delivery options step
  | "checkout_payment"
  | "success";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  type: ChatMessageType;
  content: string;
  data?: {
    products?: CartProduct[];
    sizes?: string[];
    colors?: string[];
    selectedProduct?: CartProduct;
    selectedSize?: string;
    selectedColor?: string;
    storedData?: StoredUserData;
    shippingOptions?: ShippingOption[];
    productCost?: number;
    currency?: string;
    orderRef?: string;
    checkoutPayment?: CheckoutPaymentData;
  };
}
