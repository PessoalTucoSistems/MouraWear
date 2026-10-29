import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { dateTime, money, PAYMENT_LABEL, STATUS_LABEL, time, whatsappLink } from "../../lib/format";
import type { Order, OrderStatus } from "../../types";
import { StatusBadge } from "../OrderPages";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "canceled"];

function OrderModal({ order, onClose, onChange }: { order: Order; onClose: () => void; onChange: (o: Order) => void }) {
  const toast = useToast();

  const setStatus = async (status: OrderStatus) => {
    if (status === order.status) return;
    if (status === "canceled" && !window.confirm("Cancelar o pedido? As peças voltam para o estoque.")) return;
    try {
      onChange(await api<Order>(`/admin/orders/${order.id}/status`, { method: "PUT", body: { status } }));
      toast(`Pedido marcado como "${STATUS_LABEL[status]}"`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const a = order.address;
  const phone = order.customerPhone || a.phone;

  return (
    <Modal title={`Pedido #${order.id}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        <span className="font-mono text-xs text-ash">{dateTime(order.createdAt)} · {PAYMENT_LABEL[order.paymentMethod]}</span>
      </div>

      {order.status === "pending" && order.paymentMethod === "whatsapp" && (
        <div className="mt-5 border-2 border-yellow-300 p-4">
          <p className="text-sm">
            Pedido feito pelo WhatsApp: confirme o pagamento manualmente.
            {order.expiresAt && (
              <> As peças estão reservadas até <span className="font-mono text-yellow-300">{dateTime(order.expiresAt)}</span>; depois disso o pedido é cancelado sozinho e o estoque volta.</>
            )}
          </p>
          <button onClick={() => setStatus("paid")} className="btn btn-acid mt-3 w-full sm:w-auto">Confirmar pagamento</button>
        </div>
      )}
      {order.status === "canceled" && order.cancelReason === "expired" && (
        <p className="mt-5 border border-blood p-3 text-sm text-blood">Cancelado automaticamente: o pagamento não foi confirmado no prazo.</p>
      )}

      <p className="label mt-5">Alterar status</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${
              order.status === s ? "border-acid bg-acid text-ink" : s === "canceled" ? "border-blood text-blood" : "border-line hover:border-bone"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4 text-sm">
          <p className="label">Cliente</p>
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-ash">{order.customerEmail}</p>
          {phone && (
            <a href={whatsappLink(phone, `Olá ${order.customerName.split(" ")[0]}! Sobre seu pedido #${order.id} na MoreiraWear:`)} target="_blank" rel="noreferrer" className="text-acid underline">
              {phone} (WhatsApp)
            </a>
          )}
        </div>
        <div className="card p-4 text-sm">
          <p className="label">Entrega</p>
          <p>{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}</p>
          <p>{a.district ? `${a.district} — ` : ""}{a.city}/{a.state}</p>
          <p className="font-mono text-ash">CEP {a.cep}</p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line border border-line">
        {order.items.map((i) => (
          <li key={`${i.productId}-${i.size}`} className="flex items-center gap-3 p-3 text-sm">
            {i.image && <img src={i.image} alt="" className="h-12 w-10 object-cover" />}
            <span className="flex-1 uppercase">{i.name} <span className="font-mono text-xs text-ash">({i.size})</span></span>
            <span className="font-mono text-xs text-ash">{i.quantity}x {money(i.price)}</span>
            <span className="font-mono">{money(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 text-right font-mono text-sm">
        <p className="text-ash">Subtotal {money(order.subtotal)} · Frete {order.shipping ? money(order.shipping) : "grátis"}</p>
        <p className="text-lg">Total <span className="text-acid">{money(order.total)}</span></p>
      </div>
      {order.notes && (
        <div className="mt-4 border border-line p-3 text-sm">
          <p className="label">Observações</p>
          {order.notes}
        </div>
      )}
    </Modal>
  );
}

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") || "") as OrderStatus | "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api<Order[]>(`/admin/orders${status ? `?status=${status}` : ""}`).then(setOrders).catch(() => {});
  }, [status]);

  const filtered = orders.filter((o) =>
    `${o.id} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(search.toLowerCase()),
  );

  const updateOrder = (updated: Order) => {
    setSelected(updated);
    setOrders((prev) =>
      status && updated.status !== status ? prev.filter((o) => o.id !== updated.id) : prev.map((o) => (o.id === updated.id ? updated : o)),
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["", ...STATUSES] as const).map((s) => (
          <button
            key={s || "all"}
            onClick={() => setParams(s ? { status: s } : {})}
            className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${status === s ? "border-acid bg-acid text-ink" : "border-line hover:border-bone"}`}
          >
            {s ? STATUS_LABEL[s] : "Todos"}
          </button>
        ))}
        <input className="input ml-auto max-w-xs !py-2" placeholder="Buscar nº, nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="rtable w-full text-sm md:min-w-[640px]">
          <thead className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-ash">
            <tr>
              <th className="p-3 text-left">Pedido</th>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Pagamento</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-coal" onClick={() => setSelected(o)}>
                <td className="p-3">
                  <p className="font-mono font-semibold">#{o.id}</p>
                  <p className="font-mono text-xs text-ash">{dateTime(o.createdAt)}</p>
                </td>
                <td className="p-3" data-label="Cliente">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-ash">{o.items.reduce((s, i) => s + i.quantity, 0)} peça(s)</p>
                </td>
                <td className="p-3 font-mono text-xs" data-label="Pagamento">{PAYMENT_LABEL[o.paymentMethod]}</td>
                <td className="p-3" data-label="Status">
                  <StatusBadge status={o.status} />
                  {o.status === "pending" && o.expiresAt && <p className="mt-1 font-mono text-[10px] text-yellow-300">expira {time(o.expiresAt)}</p>}
                  {o.cancelReason === "expired" && o.status === "canceled" && <p className="mt-1 font-mono text-[10px] text-ash">prazo esgotado</p>}
                </td>
                <td className="p-3 text-right font-mono" data-label="Total">{money(o.total)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ash">Nenhum pedido.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onChange={updateOrder} />}
    </div>
  );
}
