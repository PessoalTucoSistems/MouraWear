import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { money } from "../lib/format";
import type { Order } from "../types";

// Pagamento online pela SumUp: o cliente escolhe PIX (QR Code + copia e cola na tela)
// ou cartão (página da SumUp, que volta para o pedido). O status é atualizado pela
// página do pedido, que consulta o backend de tempos em tempos.
export default function SumupPayment({ order, onChange }: { order: Order; onChange: (order: Order) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState<"pix" | "card" | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!order.pixCode) {
      setQr("");
      return;
    }
    QRCode.toDataURL(order.pixCode, { width: 280, margin: 1 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [order.pixCode]);

  const pay = async (method: "pix" | "card") => {
    setLoading(method);
    try {
      const updated = await api<Order>(`/orders/${order.id}/sumup`, { method: "POST", body: { method } });
      onChange(updated);
      if (updated.status !== "pending") return;
      if (method === "card" && updated.paymentUrl) window.location.href = updated.paymentUrl;
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.pixCode || "");
      toast("Código PIX copiado");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  };

  return (
    <div>
      <p className="text-sm text-ash">
        Pague <span className="text-bone">{money(order.total)}</span> com PIX ou cartão. Assim que o pagamento for aprovado, esta página
        atualiza sozinha.
      </p>

      {order.pixCode && (
        <div className="mt-5 border border-line bg-smoke p-4">
          <p className="label">PIX — escaneie o QR Code ou use o copia e cola</p>
          {qr && <img src={qr} alt="QR Code do PIX" className="mx-auto my-3 h-56 w-56 bg-white p-2" />}
          <textarea readOnly value={order.pixCode} className="input h-24 resize-none font-mono !text-xs" onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copy} className="btn btn-acid mt-3 w-full sm:w-auto">Copiar código PIX</button>
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ash">
            <span className="h-2 w-2 animate-pulse bg-acid" /> Aguardando o pagamento…
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => pay("pix")} disabled={!!loading} className={`btn w-full sm:w-auto ${order.pixCode ? "btn-ghost" : "btn-acid"}`}>
          {loading === "pix" ? "Gerando PIX..." : order.pixCode ? "Gerar novo PIX" : "Pagar com PIX"}
        </button>
        <button type="button" onClick={() => pay("card")} disabled={!!loading} className="btn btn-ghost w-full sm:w-auto">
          {loading === "card" ? "Abrindo..." : "Pagar com cartão"}
        </button>
      </div>
    </div>
  );
}
