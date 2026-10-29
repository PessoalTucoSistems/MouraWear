import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

interface Settings {
  announcement: string;
  whatsapp: string;
  instagram: string;
  pixKey: string;
  shippingFee: string;
  freeShippingMin: string;
}

const FIELDS: { key: keyof Settings; label: string; hint?: string; type?: string }[] = [
  { key: "announcement", label: "Faixa de anúncio (topo do site)", hint: "Use ✦ para separar as mensagens. Vazio esconde a faixa." },
  { key: "whatsapp", label: "WhatsApp da loja", hint: "Com DDD, ex.: 11999999999. Habilita a opção \"Combinar no WhatsApp\"." },
  { key: "instagram", label: "Instagram", hint: "Ex.: @moreira_wear" },
  { key: "pixKey", label: "Chave PIX", hint: "Mostrada ao cliente após o pedido com pagamento via PIX." },
  { key: "shippingFee", label: "Frete fixo (R$)", type: "number" },
  { key: "freeShippingMin", label: "Frete grátis a partir de (R$)", hint: "0 desativa o frete grátis.", type: "number" },
];

export default function SettingsPage() {
  const toast = useToast();
  const { reload } = useStore();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    api<Settings>("/admin/settings").then(setSettings).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSettings(await api<Settings>("/admin/settings", { method: "PUT", body: settings }));
      reload();
      toast("Configurações salvas");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  if (!settings) return null;

  return (
    <form onSubmit={submit} className="card flex max-w-2xl flex-col gap-5 p-6">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="label" htmlFor={`s-${f.key}`}>{f.label}</label>
          <input
            id={`s-${f.key}`}
            className="input"
            type={f.type || "text"}
            step={f.type === "number" ? "0.01" : undefined}
            min={f.type === "number" ? "0" : undefined}
            value={settings[f.key]}
            onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
          />
          {f.hint && <p className="mt-1 text-xs text-ash">{f.hint}</p>}
        </div>
      ))}
      <p className="border border-line p-3 text-xs text-ash">
        Pagamento online (cartão/PIX automático) é ativado configurando <code className="text-acid">MP_ACCESS_TOKEN</code> do Mercado Pago nas variáveis do Render.
      </p>
      <button className="btn btn-acid self-start">Salvar</button>
    </form>
  );
}
