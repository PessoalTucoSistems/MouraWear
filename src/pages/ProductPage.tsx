import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loading } from "../components/Guards";
import { HeartIcon, MinusIcon, PlusIcon } from "../components/Icons";
import ProductArt from "../components/ProductArt";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { discountPercent, money } from "../lib/format";
import type { Product } from "../types";

const SIZE_GUIDE = [
  ["P", "54", "72"],
  ["M", "57", "74"],
  ["G", "60", "76"],
  ["GG", "63", "78"],
];

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [image, setImage] = useState(0);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setProduct(null);
    setSize("");
    setImage(0);
    setQuantity(1);
    api<Product>(`/products/${id}`)
      .then((p) => {
        setProduct(p);
        // Peça de tamanho único já vem selecionada.
        if (p.sizes.length === 1 && p.sizes[0].stock > 0) setSize(p.sizes[0].size);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="display text-6xl text-outline">404</p>
        <p className="mt-2 text-ash">{error}</p>
        <Link to="/" className="btn btn-acid mt-6">Voltar ao catálogo</Link>
      </div>
    );
  }
  if (!product) return <Loading />;

  const discount = discountPercent(product.price, product.compareAtPrice);
  const stock = product.sizes.find((s) => s.size === size)?.stock ?? 0;
  const allSoldOut = product.sizes.every((s) => s.stock <= 0) || !product.active;
  const favorite = isFavorite(product.id);

  const handleAdd = () => {
    if (!size) {
      toast("Escolha um tamanho", "error");
      return;
    }
    addToCart(product, size, quantity);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <nav className="mb-6 font-mono text-[11px] uppercase tracking-widest text-ash">
        <Link to="/" className="hover:text-acid">Shop</Link> /{" "}
        <Link to={`/?cat=${encodeURIComponent(product.category)}`} className="hover:text-acid">{product.category}</Link> /{" "}
        <span className="text-bone">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden border border-line bg-smoke">
            {product.images.length ? (
              <img src={product.images[image]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ProductArt product={product} />
            )}
            {product.isNew && <span className="tag absolute left-3 top-3 bg-acid text-ink">New drop</span>}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImage(i)}
                  className={`aspect-square overflow-hidden border-2 ${i === image ? "border-acid" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-32 md:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-acid">{product.category}</p>
          <h1 className="display mt-2 text-5xl md:text-7xl">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="display text-4xl">{money(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="font-mono text-ash line-through">{money(product.compareAtPrice!)}</span>
                <span className="tag bg-blood text-ink">-{discount}%</span>
              </>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-ash">ou 3x de {money(product.price / 3)} sem juros</p>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="label !mb-0">Tamanho {size && <span className="text-bone">— {size}</span>}</span>
              <button onClick={() => setShowGuide((v) => !v)} className="font-mono text-[11px] uppercase tracking-widest underline underline-offset-4 hover:text-acid">
                Guia de medidas
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.size}
                  disabled={s.stock <= 0}
                  onClick={() => {
                    setSize(s.size);
                    setQuantity(1);
                  }}
                  className={`relative h-12 min-w-14 border-2 px-3 font-mono text-sm font-semibold transition ${
                    size === s.size ? "border-acid bg-acid text-ink" : "border-line hover:border-bone"
                  } disabled:cursor-not-allowed disabled:text-ash disabled:line-through disabled:hover:border-line`}
                >
                  {s.size}
                </button>
              ))}
            </div>
            {size && stock > 0 && stock <= 3 && (
              <p className="mt-2 font-mono text-xs uppercase text-blood">Últimas {stock} unidade(s)!</p>
            )}
            {showGuide && (
              <table className="animate-rise mt-4 w-full border border-line font-mono text-xs">
                <thead className="bg-coal text-ash">
                  <tr>
                    <th className="p-2 text-left">Tam.</th>
                    <th className="p-2 text-left">Largura (cm)</th>
                    <th className="p-2 text-left">Compr. (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map(([s, w, l]) => (
                    <tr key={s} className="border-t border-line">
                      <td className="p-2">{s}</td>
                      <td className="p-2">{w}</td>
                      <td className="p-2">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <div className="flex items-center border-2 border-line">
              <button className="grid h-12 w-11 place-items-center hover:text-acid" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-mono">{quantity}</span>
              <button
                className="grid h-12 w-11 place-items-center hover:text-acid disabled:opacity-30"
                disabled={!!size && quantity >= stock}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <button className="btn btn-acid flex-1" disabled={allSoldOut} onClick={handleAdd}>
              {allSoldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </button>
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`grid w-12 place-items-center border-2 transition ${favorite ? "border-acid text-acid" : "border-line hover:border-bone"}`}
              aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <HeartIcon className={favorite ? "fill-acid" : ""} />
            </button>
          </div>

          {product.description && (
            <div className="mt-10 border-t border-line pt-6">
              <p className="label">Detalhes</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-bone/80">{product.description}</p>
            </div>
          )}

          <ul className="mt-8 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wider text-ash">
            <li className="border border-line p-3">✦ Envio para todo o Brasil</li>
            <li className="border border-line p-3">✦ Troca grátis em 30 dias</li>
            <li className="border border-line p-3">✦ Compra segura</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
