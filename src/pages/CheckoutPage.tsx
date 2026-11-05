import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WhatsappIcon } from "../components/Icons";
import ProductArt from "../components/ProductArt";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { businessDays, money, ONLINE_HOLD, onlyDigits, WHATSAPP_HOLD, whatsappLink, whatsappOrderMessage } from "../lib/format";
import type { Address, Order, PaymentMethod, ShippingMethod, ShippingOption, ShippingQuote } from "../types";

const PICKUP: ShippingOption = { method: "pickup", label: "Retirar em mãos", price: 0, days: null };

const ADDRESS_KEY = "mw_last_address";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { settings } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState<Address>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADDRESS_KEY) || "null");
      if (saved) return saved;
    } catch {
      /* sem endereço salvo */
    }
    return { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "", phone: user?.phone || "" };
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const cepDigits = onlyDigits(address.cep);
  const cartKey = items.map((i) => `${i.productId}:${i.quantity}`).join("|");

  // Cota PAC/SEDEX assim que o CEP estiver completo (e de novo se o carrinho mudar).
  useEffect(() => {
    setQuote(null);
    if (cepDigits.length !== 8 || !cartKey) return;
    let active = true;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      api<ShippingQuote>("/shipping/quote", {
        method: "POST",
        body: {
          cep: cepDigits,
          items: cartKey.split("|").map((entry) => {
            const [productId, quantity] = entry.split(":");
            return { productId, quantity: Number(quantity) };
          }),
        },
      })
        .then((q) => active && setQuote(q))
        .catch((err) => active && setQuote({ options: [], error: (err as Error).message, pickupAddress: "" }))
        .finally(() => active && setQuoteLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
      setQuoteLoading(false);
    };
  }, [cepDigits, cartKey]);

  const deliveryChoices = [PICKUP, ...(quote?.options || [])];
  const selected = deliveryChoices.find((o) => o.method === shippingMethod) || null;
  const isPickup = shippingMethod === "pickup";
  const pickupAddress = quote?.pickupAddress || settings.pickupAddress;

  const shipping = selected?.price || 0;
  const total = subtotal + shipping;

  const set = (key: keyof Address, value: string) => setAddress((a) => ({ ...a, [key]: value }));

  // Preenche o endereço pelo CEP (ViaCEP, serviço público e gratuito).
  const lookupCep = async (value: string) => {
    const cep = onlyDigits(value);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json());
      if (!data.erro) {
        setAddress((a) => ({ ...a, street: data.logradouro || a.street, district: data.bairro || a.district, city: data.localidade || a.city, state: data.uf || a.state }));
      }
    } catch {
      /* usuário preenche manualmente */
    } finally {
      setCepLoading(false);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Cada botão de finalizar envia a sua forma de pagamento.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const payment = (submitter?.value || "whatsapp") as PaymentMethod;
    if (!selected) {
      toast(quoteLoading ? "Aguarde a cotação do frete terminar." : "Escolha como quer receber: Correios ou retirar em mãos.", "error");
      document.getElementById("entrega")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // A aba do WhatsApp é aberta já no clique: depois do await o navegador bloquearia o pop-up.
    const whatsTab = payment === "whatsapp" ? window.open("", "_blank") : null;
    setSubmitting(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: {
          items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
          address,
          shippingMethod: selected.method,
          paymentMethod: payment,
          notes,
        },
      });
      try {
        localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
      } catch {
        /* armazenamento indisponível */
      }
      clear();
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
        return;
      }
      if (payment === "whatsapp") {
        const link = whatsappLink(settings.whatsapp, whatsappOrderMessage(order));
        if (whatsTab) whatsTab.location.href = link;
        else window.location.href = link;
      }
      navigate(`/pedidos/${order.id}?novo=1`, { replace: true });
    } catch (err) {
      whatsTab?.close();
      toast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="display text-6xl text-outline">Carrinho vazio</p>
        <Link to="/" className="btn btn-acid mt-8">Ir para o catálogo</Link>
      </div>
    );
  }

  const canWhatsapp = !!settings.whatsapp;
  const canPayOnline = !!settings.onlinePayment;

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-10">
        <h1 className="display text-6xl md:text-7xl">Checkout</h1>

        <section>
          <h2 className="display mb-4 text-3xl"><span className="text-acid">01</span> Entrega</h2>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3 md:col-span-2">
              <label className="label" htmlFor="cep">CEP {cepLoading && "…"}</label>
              <input id="cep" className="input" required={!isPickup} inputMode="numeric" value={address.cep} onChange={(e) => { set("cep", e.target.value); lookupCep(e.target.value); }} placeholder="00000-000" />
            </div>
            <div className="col-span-3 md:col-span-4">
              <label className="label" htmlFor="phone">WhatsApp</label>
              <input id="phone" className="input" type="tel" value={address.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div id="entrega" className="mt-6">
            <p className="label">Como você quer receber?</p>
            <div className="flex flex-col gap-2" role="radiogroup">
              {deliveryChoices.map((o) => {
                const checked = shippingMethod === o.method;
                return (
                  <label
                    key={o.method}
                    className={`flex cursor-pointer items-center gap-3 border-2 p-4 transition ${checked ? "border-acid" : "border-line hover:border-bone"}`}
                  >
                    <input type="radio" name="shipping" className="h-4 w-4 accent-current" checked={checked} onChange={() => setShippingMethod(o.method)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold uppercase">{o.label}</span>
                      <span className="block text-xs text-ash">
                        {o.method === "pickup"
                          ? pickupAddress || "Sem custo de frete. Combinamos o local e o horário pelo WhatsApp."
                          : [businessDays(o.days), o.free && "frete grátis ✦"].filter(Boolean).join(" · ") || "Entrega no endereço abaixo"}
                      </span>
                    </span>
                    <span className={`font-mono text-sm ${checked ? "text-acid" : ""}`}>{o.price === 0 ? "Grátis" : money(o.price)}</span>
                  </label>
                );
              })}
            </div>
            {!isPickup && (
              <p className="mt-2 text-xs text-ash">
                {cepDigits.length !== 8
                  ? "Digite o CEP para ver o valor do PAC e do SEDEX."
                  : quoteLoading
                    ? "Consultando os Correios…"
                    : quote?.error || ""}
              </p>
            )}
          </div>

          <div className={`mt-6 grid grid-cols-6 gap-4 ${isPickup ? "hidden" : ""}`}>
            <div className="col-span-6 md:col-span-4">
              <label className="label" htmlFor="street">Rua</label>
              <input id="street" className="input" required={!isPickup} value={address.street} onChange={(e) => set("street", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="number">Número</label>
              <input id="number" className="input" required={!isPickup} value={address.number} onChange={(e) => set("number", e.target.value)} />
            </div>
            <div className="col-span-4 md:col-span-3">
              <label className="label" htmlFor="complement">Complemento</label>
              <input id="complement" className="input" value={address.complement || ""} onChange={(e) => set("complement", e.target.value)} />
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="label" htmlFor="district">Bairro</label>
              <input id="district" className="input" value={address.district || ""} onChange={(e) => set("district", e.target.value)} />
            </div>
            <div className="col-span-4">
              <label className="label" htmlFor="city">Cidade</label>
              <input id="city" className="input" required={!isPickup} value={address.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="state">UF</label>
              <input id="state" className="input uppercase" required={!isPickup} maxLength={2} value={address.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="display mb-4 text-3xl"><span className="text-acid">02</span> Pagamento</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canWhatsapp && (
              <div className="border-2 border-line p-4">
                <p className="flex items-center gap-2 font-semibold uppercase"><WhatsappIcon className="h-5 w-5 text-acid" /> Chamar no Whats</p>
                <p className="mt-1 text-sm text-ash">
                  Seu pedido chega pra gente no WhatsApp e combinamos o pagamento por lá. As peças ficam reservadas por {WHATSAPP_HOLD}.
                </p>
              </div>
            )}
            {canPayOnline && (
              <div className="border-2 border-line p-4">
                <p className="font-semibold uppercase">Pagar online</p>
                <p className="mt-1 text-sm text-ash">
                  PIX com QR Code aqui no site ou cartão {settings.onlinePayment === "sumup" ? "pela SumUp" : "pelo Mercado Pago"}, com confirmação na hora. Você tem {ONLINE_HOLD} para pagar.
                </p>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ash">Escolha como pagar nos botões do resumo do pedido.</p>
          <label className="label mt-6" htmlFor="notes">Observações (opcional)</label>
          <textarea id="notes" className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>
      </div>

      <aside className="h-fit border-2 border-bone bg-smoke p-6 lg:sticky lg:top-32">
        <h2 className="display text-3xl">Resumo</h2>
        <ul className="mt-5 flex flex-col gap-3">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="flex gap-3">
              <div className="h-16 w-13 shrink-0 overflow-hidden border border-line">
                {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : <ProductArt product={{ name: "", color: i.color, category: "" }} className="!p-0" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold uppercase">{i.name}</p>
                <p className="font-mono text-xs text-ash">{i.size} · {i.quantity}x</p>
              </div>
              <span className="font-mono text-sm">{money(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-1 border-t border-line pt-4 font-mono text-sm text-ash">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between gap-3">
            <span>{selected ? (isPickup ? "Retirada" : `Frete · ${selected.label}`) : "Frete"}</span>
            <span className="shrink-0">{!selected ? "Escolha a entrega" : isPickup ? "Sem custo" : shipping === 0 ? "Grátis" : money(shipping)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="display text-2xl">Total</span>
          <span className="display text-4xl text-acid">{money(total)}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {canWhatsapp && (
            <button type="submit" name="payment" value="whatsapp" className="btn btn-acid w-full" disabled={submitting}>
              <WhatsappIcon className="h-5 w-5" /> {submitting ? "Enviando..." : "Chamar no Whats"}
            </button>
          )}
          {canPayOnline && (
            <button type="submit" name="payment" value={settings.onlinePayment || ""} className={`btn w-full ${canWhatsapp ? "btn-ghost" : "btn-acid"}`} disabled={submitting}>
              {submitting ? "Enviando..." : "Pagar online"}
            </button>
          )}
          {!canWhatsapp && !canPayOnline && (
            <p className="text-center text-sm text-ash">Pagamentos indisponíveis no momento. Tente novamente mais tarde.</p>
          )}
        </div>
      </aside>
    </form>
  );
}
