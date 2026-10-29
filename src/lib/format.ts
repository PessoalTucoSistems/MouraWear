import type { OrderStatus, PaymentMethod } from "../types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (value: number) => brl.format(value || 0);

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-yellow-300 text-ink",
  paid: "bg-acid text-ink",
  shipped: "bg-sky-300 text-ink",
  delivered: "bg-bone text-ink",
  canceled: "bg-blood text-ink",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  whatsapp: "Combinar no WhatsApp",
  mercadopago: "Cartão / PIX online",
};

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const whatsappLink = (number: string, text: string) =>
  `https://wa.me/${onlyDigits(number)}?text=${encodeURIComponent(text)}`;

export const totalStock = (sizes: { stock: number }[]) => sizes.reduce((sum, s) => sum + (s.stock || 0), 0);

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
