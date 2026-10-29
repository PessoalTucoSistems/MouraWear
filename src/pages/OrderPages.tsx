import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loading } from "../components/Guards";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { dateTime, money, PAYMENT_LABEL, STATUS_LABEL, STATUS_STYLE, whatsappLink } from "../lib/format";
import type { Order, OrderStatus } from "../types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`tag ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

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
            <li key={o.id}>
              <Link to={`/pedidos/${o.id}`} className="card flex flex-wrap items-center gap-4 p-5 transition hover:border-acid">
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">#{o.id}</p>
                  <p className="font-mono text-xs text-ash">{dateTime(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} peça(s)</p>
                </div>
                <StatusBadge status={o.status} />
                <span className="display text-2xl">{money(o.total)}</span>
              </Link>
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
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

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
      {isNew && (
        <div className="animate-rise mb-8 border-2 border-acid bg-acid p-6 text-ink">
          <p className="display text-5xl">Pedido recebido!</p>
          <p className="mt-1 text-sm">Obrigado por comprar na MoreiraWear. Siga as instruções de pagamento abaixo.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ash">{dateTime(order.createdAt)}</p>
          <h1 className="display text-5xl">Pedido #{order.id}</h1>
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

      {order.status === "pending" && (
        <section className="mt-8 border-2 border-bone p-6">
          <p className="label">Pagamento — {PAYMENT_LABEL[order.paymentMethod]}</p>
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
          {settings.whatsapp && (
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
