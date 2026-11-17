export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // exchange rate relative to USD (USD = 1.0)
  isBase?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // base price in USD
  categoryId: string;
  categoryName: string;
  inventory: number;
  imageUrl: string;
  sku: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartItemDetail {
  product: Product;
  quantity: number;
  unitPriceUSD: number;
  unitPriceConverted: number;
  totalConverted: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'mock_card' | 'mock_stripe' | 'mock_cod';

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded';

export interface PaymentDetails {
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  paidAt?: string;
  failureReason?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPriceBase: number; // in base currency (USD)
  unitPriceCharged: number; // in selected currency
  totalCharged: number; // in selected currency
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  currency: CurrencyCode;
  exchangeRate: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  payment: PaymentDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  items: CartItem[];
  currency: CurrencyCode;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  cardNumber?: string; // for mock payment simulation
  promoCode?: string;
}

export interface AdminStats {
  totalRevenueUSD: number;
  totalOrders: number;
  paidOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}
