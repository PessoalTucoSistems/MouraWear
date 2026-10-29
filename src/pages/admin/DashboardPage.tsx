import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loading } from "../../components/Guards";
import { api } from "../../lib/api";
import { money } from "../../lib/format";

interface Dashboard {
  revenue: number;
  ordersCount: number;
  soldCount: number;
  pendingCount: number;
  toShipCount: number;
  averageTicket: number;
  customersCount: number;
  productsCount: number;
  salesByDay: { date: string; total: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  lowStock: { productId: string; name: string; size: string; stock: number }[];
}

function Stat({ label, value, accent = false, to }: { label: string; value: string | number; accent?: boolean; to?: string }) {
  const body = (
    <div className={`card h-full p-5 ${to ? "transition hover:border-acid" : ""}`}>
      <p className="label">{label}</p>
      <p className={`display text-4xl ${accent ? "text-acid" : ""}`}>{value}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>("/admin/dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return <Loading />;

  const max = Math.max(1, ...data.salesByDay.map((d) => d.total));
  const last30 = data.salesByDay.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Faturamento" value={money(data.revenue)} accent />
        <Stat label="Ticket médio" value={money(data.averageTicket)} />
        <Stat label="Aguardando pgto." value={data.pendingCount} to="/admin/pedidos?status=pending" />
        <Stat label="Para enviar" value={data.toShipCount} to="/admin/pedidos?status=paid" />
        <Stat label="Pedidos" value={data.ordersCount} to="/admin/pedidos" />
        <Stat label="Vendas pagas" value={data.soldCount} />
        <Stat label="Clientes" value={data.customersCount} to="/admin/usuarios" />
        <Stat label="Produtos ativos" value={data.productsCount} to="/admin/produtos" />
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="label">Vendas — últimos 30 dias</p>
          <p className="font-mono text-sm text-acid">{money(last30)}</p>
        </div>
        <div className="mt-4 flex h-44 items-end gap-[3px]">
          {data.salesByDay.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end">
              <div className="w-full bg-acid/80 transition group-hover:bg-acid" style={{ height: `${Math.max(d.total ? 4 : 1, (d.total / max) * 100)}%` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap bg-bone px-2 py-1 font-mono text-[10px] text-ink group-hover:block">
                {d.date.slice(8, 10)}/{d.date.slice(5, 7)} · {money(d.total)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-ash">
          <span>{data.salesByDay[0].date.slice(8, 10)}/{data.salesByDay[0].date.slice(5, 7)}</span>
          <span>hoje</span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <p className="label">Mais vendidos</p>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-ash">Nenhuma venda paga ainda.</p>
          ) : (
            <ol className="divide-y divide-line">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 py-2 text-sm">
                  <span className="display w-6 text-xl text-acid">{i + 1}</span>
                  <span className="flex-1 truncate uppercase">{p.name}</span>
                  <span className="font-mono text-xs text-ash">{p.quantity} un · {money(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card p-5">
          <p className="label">Estoque baixo (≤ 3)</p>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-ash">Tudo abastecido.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((s) => (
                <li key={s.productId + s.size} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1 truncate uppercase">{s.name}</span>
                  <span className="font-mono text-xs text-ash">Tam. {s.size}</span>
                  <span className={`tag ${s.stock === 0 ? "bg-blood text-ink" : "bg-yellow-300 text-ink"}`}>{s.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
