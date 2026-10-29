import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { expiredText } from "../lib/format";
import { useRepeatOrder } from "../pages/OrderPages";
import type { Order } from "../types";
import { CloseIcon } from "./Icons";

// Aviso no topo do site para pedidos cancelados automaticamente que o cliente ainda não viu.
export default function OrderNotices() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const repeat = useRepeatOrder();
  const [notices, setNotices] = useState<Order[]>([]);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setNotices([]);
      return;
    }
    const load = () => api<Order[]>("/orders/notices").then(setNotices).catch(() => {});
    load();
    window.addEventListener("mw:notices", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("mw:notices", load);
      window.removeEventListener("focus", load);
    };
  }, [user, pathname]);

  if (notices.length === 0) return null;

  const dismiss = (order: Order) => {
    setNotices((list) => list.filter((o) => o.id !== order.id));
    api(`/orders/${order.id}/notice-seen`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="border-b-2 border-blood bg-blood/10" role="status">
      {notices.map((order) => (
        <div key={order.id} className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <p className="min-w-0 flex-1 basis-64 text-sm">
            <span className="font-mono font-semibold text-blood">Pedido #{order.id} cancelado.</span> {expiredText(order)}
          </p>
          <div className="flex items-center gap-2">
            <Link to={`/pedidos/${order.id}`} className="font-mono text-xs uppercase tracking-wider underline hover:text-acid">
              Ver pedido
            </Link>
            <button
              onClick={() => {
                repeat(order);
                dismiss(order);
              }}
              className="btn btn-acid !px-3 !py-2"
            >
              Repetir pedido
            </button>
            <button onClick={() => dismiss(order)} className="grid h-9 w-9 place-items-center hover:text-acid" aria-label="Fechar aviso">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
