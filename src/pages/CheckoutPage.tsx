import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductArt from "../components/ProductArt";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { shippingFor, useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { money, onlyDigits } from "../lib/format";
import type { Address, Order, PaymentMethod } from "../types";

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
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const shipping = shippingFor(subtotal, settings);
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: {
          items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
          address,
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
      navigate(`/pedidos/${order.id}?novo=1`, { replace: true });
    } catch (err) {
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

  const methods: { id: PaymentMethod; title: string; text: string; show: boolean }[] = [
    { id: "pix", title: "PIX", text: "Você recebe a chave PIX após confirmar o pedido.", show: true },
    { id: "mercadopago", title: "Cartão ou PIX online", text: "Pagamento seguro pelo Mercado Pago, em até 12x.", show: settings.mercadoPagoEnabled },
    { id: "whatsapp", title: "Combinar no WhatsApp", text: "Fale com a gente para combinar pagamento e entrega.", show: !!settings.whatsapp },
  ];

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-10">
        <h1 className="display text-6xl md:text-7xl">Checkout</h1>

        <section>
          <h2 className="display mb-4 text-3xl"><span className="text-acid">01</span> Entrega</h2>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3 md:col-span-2">
              <label className="label" htmlFor="cep">CEP {cepLoading && "…"}</label>
              <input id="cep" className="input" required inputMode="numeric" value={address.cep} onChange={(e) => set("cep", e.target.value)} onBlur={(e) => lookupCep(e.target.value)} placeholder="00000-000" />
            </div>
            <div className="col-span-3 md:col-span-4">
              <label className="label" htmlFor="phone">WhatsApp</label>
              <input id="phone" className="input" type="tel" value={address.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="col-span-6 md:col-span-4">
              <label className="label" htmlFor="street">Rua</label>
              <input id="street" className="input" required value={address.street} onChange={(e) => set("street", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="number">Número</label>
              <input id="number" className="input" required value={address.number} onChange={(e) => set("number", e.target.value)} />
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
              <input id="city" className="input" required value={address.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="state">UF</label>
              <input id="state" className="input uppercase" required maxLength={2} value={address.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="display mb-4 text-3xl"><span className="text-acid">02</span> Pagamento</h2>
          <div className="grid gap-3">
            {methods.filter((m) => m.show).map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-start gap-4 border-2 p-4 transition ${payment === m.id ? "border-acid bg-acid/5" : "border-line hover:border-bone"}`}
              >
                <input type="radio" name="payment" className="mt-1 accent-[#c8ff00]" checked={payment === m.id} onChange={() => setPayment(m.id)} />
                <span>
                  <span className="block font-semibold uppercase">{m.title}</span>
                  <span className="text-sm text-ash">{m.text}</span>
                </span>
              </label>
            ))}
          </div>
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
          <div className="flex justify-between"><span>Frete</span><span>{shipping === 0 ? "Grátis" : money(shipping)}</span></div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="display text-2xl">Total</span>
          <span className="display text-4xl text-acid">{money(total)}</span>
        </div>
        <button className="btn btn-acid mt-6 w-full" disabled={submitting}>
          {submitting ? "Enviando..." : "Confirmar pedido"}
        </button>
      </aside>
    </form>
  );
}
