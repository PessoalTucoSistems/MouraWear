import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import type { CartItem, Product } from "../types";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Adiciona ao carrinho; sem login, guarda o item e leva para o login. */
  addToCart: (product: Product, size: string, quantity?: number) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "mw_cart";
const PENDING_KEY = "mw_pending_add";

const sameLine = (item: CartItem, productId: string, size: string) =>
  item.productId === productId && item.size === size;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* armazenamento indisponível */
    }
  }, [items]);

  const addLine = (line: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, line.productId, line.size));
      if (!existing) return [...prev, { ...line, quantity: Math.min(line.quantity, line.maxStock) }];
      return prev.map((i) =>
        sameLine(i, line.productId, line.size)
          ? { ...i, maxStock: line.maxStock, quantity: Math.min(i.quantity + line.quantity, line.maxStock) }
          : i,
      );
    });
  };

  // Depois do login/cadastro, coloca no carrinho o item que motivou o login.
  useEffect(() => {
    if (!user) return;
    let pending: CartItem | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      pending = null;
    }
    if (pending) {
      addLine(pending);
      setIsOpen(true);
      toast(`${pending.name} (${pending.size}) no carrinho`);
    }
  }, [user]);

  const addToCart = (product: Product, size: string, quantity = 1) => {
    const stock = product.sizes.find((s) => s.size === size)?.stock ?? 0;
    if (stock <= 0) {
      toast("Tamanho esgotado", "error");
      return;
    }
    const line: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      quantity,
      image: product.images[0] || null,
      color: product.color,
      maxStock: stock,
    };

    if (!user) {
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(line));
      } catch {
        /* armazenamento indisponível */
      }
      toast("Entre ou crie sua conta para continuar", "info");
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    addLine(line);
    setIsOpen(true);
  };

  const value: CartContextValue = {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    addToCart,
    updateQuantity: (productId, size, quantity) =>
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => !sameLine(i, productId, size))
          : prev.map((i) => (sameLine(i, productId, size) ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i)),
      ),
    remove: (productId, size) => setItems((prev) => prev.filter((i) => !sameLine(i, productId, size))),
    clear: () => setItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
};
