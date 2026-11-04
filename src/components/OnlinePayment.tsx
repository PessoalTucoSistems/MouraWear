import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { money } from "../lib/format";
import type { Order } from "../types";

const PROVIDER = { mercadopago: "Mercado Pago", sumup: "SumUp" } as const;

// Pagamento online (Mercado Pago ou SumUp) sem sair da tela do pedido:
// - PIX: QR Code + copia e cola aqui mesmo;
// - cartão: a página do provedor abre em outra aba e esta continua aguardando.
// O status é atualizado pela página do pedido, que consulta o backend a cada poucos segundos.
export default function OnlinePayment({ order, onChange }: { order: Order; onChange: (order: Order) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState<"pix" | "card" | null>(null);
  const [qr, setQr] = useState("");
  const [cardOpened, setCardOpened] = useState(false);
  const provider = PROVIDER[order.paymentMethod as keyof typeof PROVIDER] || "pagamento online";

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
    // A aba do cartão é aberta já no clique: depois do await o navegador bloquearia o pop-up.
    const tab = method === "card" ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    if (tab) tab.document.write(`<p style="font-family:sans-serif;padding:2rem">Abrindo o ${provider}…</p>`);
    setLoading(method);
    try {
      const updated = await api<Order>(`/orders/${order.id}/pay`, { method: "POST", body: { method } });
      onChange(updated);
      if (updated.status !== "pending") {
        tab?.close();
        return;
      }
      if (method === "card" && updated.paymentUrl) {
        if (tab) tab.location.href = updated.paymentUrl;
        setCardOpened(true);
      }
    } catch (e) {
      tab?.close();
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

  const waiting = (
    <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ash">
      <span className="h-2 w-2 animate-pulse bg-acid" /> Aguardando o pagamento…
    </p>
  );

  return (
    <div>
      <p className="text-sm text-ash">
        Pague <span className="text-bone">{money(order.total)}</span> com PIX aqui mesmo ou com cartão pelo {provider}. Assim que o
        pagamento for aprovado, esta página atualiza sozinha.
      </p>

      {order.pixCode && (
        <div className="mt-5 border border-line bg-smoke p-4">
          <p className="label">PIX — escaneie o QR Code ou use o copia e cola</p>
          {qr && <img src={qr} alt="QR Code do PIX" className="mx-auto my-3 h-56 w-56 bg-white p-2" />}
          <textarea readOnly value={order.pixCode} className="input h-24 resize-none font-mono !text-xs" onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copy} className="btn btn-acid mt-3 w-full sm:w-auto">Copiar código PIX</button>
          {waiting}
        </div>
      )}

      {cardOpened && order.paymentUrl && (
        <div className="mt-5 border border-line bg-smoke p-4">
          <p className="text-sm text-ash">
            A página de pagamento do {provider} abriu em outra aba. Conclua lá e volte para cá: a confirmação aparece nesta tela.
          </p>
          <a href={order.paymentUrl} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-acid underline">
            Não abriu? Clique aqui para pagar com cartão
          </a>
          {waiting}
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
