import type { Order, OrderStatus, PaymentMethod } from "../types";

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
  whatsapp: "Pedido pelo WhatsApp",
  mercadopago: "Cartão / PIX online",
};

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const whatsappLink = (number: string, text: string) =>
  `https://wa.me/${onlyDigits(number)}?text=${encodeURIComponent(text)}`;

export const totalStock = (sizes: { stock: number }[]) => sizes.reduce((sum, s) => sum + (s.stock || 0), 0);

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

export const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Mensagem que o cliente envia à loja ao finalizar um pedido pelo WhatsApp. */
export function whatsappOrderMessage(order: Order) {
  const a = order.address;
  const items = order.items
    .map((i) => `• ${i.quantity}x ${i.name} (tam. ${i.size}) — ${money(i.price * i.quantity)}`)
    .join("\n");
  return [
    `Olá! Meu nome é ${order.customerName} e acabei de fazer o pedido *#${order.id}* no site da MoreiraWear.`,
    "",
    "Gostaria de finalizar a compra dos seguintes itens:",
    items,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Frete: ${order.shipping ? money(order.shipping) : "Grátis"}`,
    `*Total: ${money(order.total)}*`,
    "",
    `Entrega: ${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ""}${a.district ? `, ${a.district}` : ""} — ${a.city}/${a.state}, CEP ${a.cep}`,
    "",
    "Fico no aguardo das instruções para o pagamento. Obrigado!",
  ].join("\n");
}
