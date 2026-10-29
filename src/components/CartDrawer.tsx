import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { shippingFor, useStore } from "../context/StoreContext";
import { money } from "../lib/format";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";
import ProductArt from "./ProductArt";

export default function CartDrawer() {
  const { items, isOpen, close, subtotal, updateQuantity, remove } = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const missing = settings.freeShippingMin - subtotal;
  const progress = settings.freeShippingMin > 0 ? Math.min(100, (subtotal / settings.freeShippingMin) * 100) : 100;
  const shipping = shippingFor(subtotal, settings);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={close} />
      <aside className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l-2 border-bone bg-ink">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="display text-3xl">Carrinho</h2>
          <button onClick={close} className="grid h-10 w-10 place-items-center hover:text-acid" aria-label="Fechar carrinho">
            <CloseIcon />
          </button>
        </div>

        {settings.freeShippingMin > 0 && items.length > 0 && (
          <div className="border-b border-line px-5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wider">
              {missing > 0 ? (
                <>Faltam <span className="text-acid">{money(missing)}</span> para o frete grátis</>
              ) : (
                <span className="text-acid">Você ganhou frete grátis ✦</span>
              )}
            </p>
            <div className="mt-2 h-1.5 bg-coal">
              <div className="h-full bg-acid transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="display text-5xl text-outline">Vazio</p>
              <p className="text-sm text-ash">Seu carrinho está esperando o próximo drop.</p>
              <button onClick={close} className="btn btn-ghost">Continuar comprando</button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`} className="flex gap-4 border-b border-line pb-4">
                  <Link to={`/produto/${item.productId}`} onClick={close} className="h-28 w-22 shrink-0 overflow-hidden border border-line">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ProductArt product={{ name: "", color: item.color, category: "" }} />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold uppercase">{item.name}</p>
                    <p className="font-mono text-xs text-ash">Tam. {item.size}</p>
                    <p className="mt-1 font-mono text-sm">{money(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button className="grid h-8 w-8 place-items-center hover:text-acid" onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} aria-label="Diminuir">
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                        <button
                          className="grid h-8 w-8 place-items-center hover:text-acid disabled:opacity-30"
                          disabled={item.quantity >= item.maxStock}
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          aria-label="Aumentar"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button onClick={() => remove(item.productId, item.size)} className="text-ash hover:text-blood" aria-label="Remover">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t-2 border-bone p-5">
            <div className="flex justify-between font-mono text-sm text-ash">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between font-mono text-sm text-ash">
              <span>Frete</span>
              <span>{shipping === 0 ? "Grátis" : money(shipping)}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="display text-2xl">Total</span>
              <span className="display text-3xl text-acid">{money(subtotal + shipping)}</span>
            </div>
            <button
              className="btn btn-acid mt-5 w-full"
              onClick={() => {
                close();
                navigate("/checkout");
              }}
            >
              Finalizar compra
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
