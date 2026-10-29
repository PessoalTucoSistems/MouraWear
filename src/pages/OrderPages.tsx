import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loading } from "../components/Guards";
import { WhatsappIcon } from "../components/Icons";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { dateTime, money, PAYMENT_LABEL, STATUS_LABEL, STATUS_STYLE, time, whatsappLink, whatsappOrderMessage } from "../lib/format";
import type { Order, OrderStatus, Product } from "../types";

// Mesmo prazo do backend (WHATSAPP_HOLD_HOURS).
export const HOLD_HOURS = 7;
export const EXPIRED_TEXT = `O pagamento não foi confirmado em ${HOLD_HOURS} horas, então o pedido foi cancelado automaticamente e as peças voltaram para o estoque.`;

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`tag ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

/** Coloca de novo no carrinho os itens de um pedido, respeitando o estoque atual. */
export function useRepeatOrder() {
  const { addToCart } = useCart();
  const toast = useToast();
  return async (order: Order) => {
    let products: Product[];
    try {
      products = await api<Product[]>("/products");
    } catch (e) {
      toast((e as Error).message, "error");
      return;
    }
    const missing: string[] = [];
    let added = 0;
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      const stock = product?.sizes.find((s) => s.size === item.size)?.stock ?? 0;
      if (!product || stock <= 0) {
        missing.push(`${item.name} (${item.size})`);
        continue;
      }
      addToCart(product, item.size, Math.min(item.quantity, stock));
      added++;
      if (stock < item.quantity) missing.push(`${item.name} (${item.size}): só ${stock} disponível(is)`);
    }
    if (!added) toast("Os itens deste pedido estão esgotados no momento.", "error");
    else if (missing.length) toast(`Alguns itens não puderam voltar ao carrinho: ${missing.join(", ")}`, "info");
    else toast("Itens do pedido de volta ao carrinho");
  };
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const repeat = useRepeatOrder();

  useEffect(() => {
    api<Order[]>("/orders/mine").then(setOrders).catch(() => setOrders([]));
  }, []);

  if (!orders) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="display text-6xl">Meus pedidos</h1>
      {orders.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-ash">Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="btn btn-acid mt-6">Ver catálogo</Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="card transition hover:border-acid">
              <Link to={`/pedidos/${o.id}`} className="flex flex-wrap items-center gap-4 p-5">
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">#{o.id}</p>
                  <p className="font-mono text-xs text-ash">{dateTime(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} peça(s)</p>
                  {o.status === "pending" && o.expiresAt && (
                    <p className="mt-1 font-mono text-xs text-yellow-300">Reservado até {time(o.expiresAt)}</p>
                  )}
                </div>
                <StatusBadge status={o.status} />
                <span className="display text-2xl">{money(o.total)}</span>
              </Link>
              {o.status === "canceled" && (
                <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
                  <p className="flex-1 text-xs text-ash">
                    {o.cancelReason === "expired" ? "Cancelado automaticamente por falta de pagamento." : "Pedido cancelado."}
                  </p>
                  <button onClick={() => repeat(o)} className="btn btn-ghost !px-4 !py-2">Repetir pedido</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STEPS: OrderStatus[] = ["pending", "paid", "shipped", "delivered"];

export function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { settings } = useStore();
  const toast = useToast();
  const repeat = useRepeatOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  // Ao abrir um pedido cancelado automaticamente, o aviso do site deixa de aparecer.
  useEffect(() => {
    if (order?.cancelReason === "expired") {
      api(`/orders/${order.id}/notice-seen`, { method: "POST" })
        .then(() => window.dispatchEvent(new Event("mw:notices")))
        .catch(() => {});
    }
  }, [order?.id, order?.cancelReason]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-20 text-center text-blood">{error}</p>;
  if (!order) return <Loading />;

  const isNew = params.get("novo") === "1";
  const step = STEPS.indexOf(order.status);
  const message = `Olá! Fiz o pedido #${order.id} na MoreiraWear (total ${money(order.total)}).`;

  const cancel = async () => {
    if (!window.confirm("Cancelar este pedido?")) return;
    try {
      setOrder(await api<Order>(`/orders/${order.id}/cancel`, { method: "POST" }));
      toast("Pedido cancelado", "info");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(settings.pixKey);
      toast("Chave PIX copiada");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {isNew && order.status === "pending" && (
        <div className="animate-rise mb-8 border-2 border-acid bg-acid p-6 text-ink">
          <p className="display text-5xl">Pedido recebido!</p>
          <p className="mt-1 text-sm">
            {order.paymentMethod === "whatsapp"
              ? "Obrigado por comprar na MoreiraWear! Enviamos seu pedido para o nosso WhatsApp. É só mandar a mensagem que vamos combinar o pagamento."
              : "Obrigado por comprar na MoreiraWear. Siga as instruções de pagamento abaixo."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ash">{dateTime(order.createdAt)}</p>
          <h1 className="display text-4xl sm:text-5xl">Pedido #{order.id}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== "canceled" && (
        <ol className="mt-8 grid grid-cols-4 gap-1">
          {STEPS.map((s, i) => (
            <li key={s}>
              <div className={`h-1.5 ${i <= step ? "bg-acid" : "bg-coal"}`} />
              <p className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${i <= step ? "text-bone" : "text-ash"}`}>{STATUS_LABEL[s]}</p>
            </li>
          ))}
        </ol>
      )}

      {order.status === "canceled" && (
        <section className="mt-8 border-2 border-blood p-6">
          <p className="label !text-blood">Pedido cancelado</p>
          <p className="text-sm">{order.cancelReason === "expired" ? EXPIRED_TEXT : "Este pedido foi cancelado e as peças voltaram para o estoque."}</p>
          <button onClick={() => repeat(order)} className="btn btn-acid mt-4">Repetir pedido</button>
        </section>
      )}

      {order.status === "pending" && (
        <section className="mt-8 border-2 border-bone p-6">
          <p className="label">Pagamento — {PAYMENT_LABEL[order.paymentMethod]}</p>
          {order.paymentMethod === "whatsapp" && (
            <>
              <p className="text-sm text-ash">
                Estamos aguardando a confirmação do pagamento pelo WhatsApp.
                {order.expiresAt && (
                  <>
                    {" "}Suas peças estão reservadas até <span className="text-bone">{dateTime(order.expiresAt)}</span>. Se o pagamento não for
                    confirmado até lá, o pedido será cancelado automaticamente.
                  </>
                )}
              </p>
              {settings.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, whatsappOrderMessage(order))} target="_blank" rel="noreferrer" className="btn btn-acid mt-4">
                  <WhatsappIcon className="h-5 w-5" /> Abrir conversa no WhatsApp
                </a>
              )}
            </>
          )}
          {order.paymentMethod === "pix" && (
            settings.pixKey ? (
              <>
                <p className="text-sm text-ash">Faça um PIX de <span className="text-bone">{money(order.total)}</span> para a chave:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <code className="flex-1 break-all border border-line bg-smoke px-4 py-3 font-mono">{settings.pixKey}</code>
                  <button onClick={copyPix} className="btn btn-acid">Copiar</button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ash">Em breve entraremos em contato com os dados para pagamento.</p>
            )
          )}
          {order.paymentMethod === "mercadopago" && order.paymentUrl && (
            <a href={order.paymentUrl} className="btn btn-acid">Pagar agora</a>
          )}
          {settings.whatsapp && order.paymentMethod !== "whatsapp" && (
            <a
              href={whatsappLink(settings.whatsapp, order.paymentMethod === "pix" ? `${message} Segue o comprovante do PIX.` : message)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost mt-4"
            >
              {order.paymentMethod === "pix" ? "Enviar comprovante no WhatsApp" : "Falar no WhatsApp"}
            </a>
          )}
        </section>
      )}

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <p className="label">Itens</p>
          <ul className="divide-y divide-line">
            {order.items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex items-center gap-3 py-3">
                {i.image && <img src={i.image} alt="" className="h-14 w-11 border border-line object-cover" />}
                <div className="flex-1 text-sm">
                  <Link to={`/produto/${i.productId}`} className="font-semibold uppercase hover:text-acid">{i.name}</Link>
                  <p className="font-mono text-xs text-ash">Tam. {i.size} · {i.quantity}x {money(i.price)}</p>
                </div>
                <span className="font-mono text-sm">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 font-mono text-sm">
            <div className="flex justify-between text-ash"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="flex justify-between text-ash"><span>Frete</span><span>{order.shipping ? money(order.shipping) : "Grátis"}</span></div>
            <div className="flex justify-between text-lg"><span>Total</span><span className="text-acid">{money(order.total)}</span></div>
          </div>
        </div>
        <div className="card h-fit p-5 text-sm">
          <p className="label">Entrega</p>
          <p>{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
          {order.address.district && <p>{order.address.district}</p>}
          <p>{order.address.city}/{order.address.state}</p>
          <p className="font-mono text-ash">CEP {order.address.cep}</p>
          {order.notes && (
            <>
              <p className="label mt-4">Observações</p>
              <p className="text-ash">{order.notes}</p>
            </>
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/pedidos" className="btn btn-ghost">Meus pedidos</Link>
        {order.status === "pending" && <button onClick={cancel} className="btn btn-danger">Cancelar pedido</button>}
      </div>
    </div>
  );
}
