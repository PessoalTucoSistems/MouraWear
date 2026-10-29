export type Role = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt?: string;
  ordersCount?: number;
}

export interface SizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  images: string[];
  sizes: SizeStock[];
  featured: boolean;
  isNew: boolean;
  active: boolean;
  color: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  category: string;
  order: number;
  active: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string | null;
  color: string;
  maxStock: number;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district?: string;
  city: string;
  state: string;
  phone?: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "canceled";
export type PaymentMethod = "pix" | "whatsapp" | "mercadopago";

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string | null;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentUrl: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  announcement: string;
  whatsapp: string;
  instagram: string;
  pixKey: string;
  shippingFee: number;
  freeShippingMin: number;
  mercadoPagoEnabled: boolean;
}
