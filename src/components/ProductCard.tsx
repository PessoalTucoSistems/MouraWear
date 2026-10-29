import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { discountPercent, money, totalStock } from "../lib/format";
import type { Product } from "../types";
import { HeartIcon } from "./Icons";
import ProductArt from "./ProductArt";

export default function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const soldOut = totalStock(product.sizes) === 0;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const [front, back] = product.images;
  const favorite = isFavorite(product.id);

  return (
    <article className="group relative">
      <Link to={`/produto/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-smoke">
          {front ? (
            <>
              <img src={front} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              {back && (
                <img src={back} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
            </>
          ) : (
            <ProductArt product={product} className="transition duration-500 group-hover:scale-[1.04]" />
          )}

          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isNew && <span className="tag bg-acid text-ink">New drop</span>}
            {soldOut && <span className="tag bg-bone text-ink">Esgotado</span>}
          </div>
          {discount > 0 && !soldOut && (
            <span className="display absolute bottom-3 right-3 rotate-[-8deg] bg-blood px-2 py-1 text-xl text-ink shadow-[3px_3px_0_#0a0a0a]">
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
        aria-pressed={favorite}
        className={`absolute right-2 top-2 grid h-9 w-9 place-items-center border border-line bg-ink/70 backdrop-blur transition hover:border-acid ${
          favorite ? "text-acid" : "text-bone"
        }`}
      >
        <HeartIcon className={`h-4 w-4 ${favorite ? "fill-acid" : ""}`} />
      </button>

      <Link to={`/produto/${product.id}`} className="mt-3 block">
        <h3 className="truncate text-sm font-semibold uppercase tracking-wide group-hover:text-acid">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2 font-mono text-sm">
          <span className={discount ? "text-acid" : ""}>{money(product.price)}</span>
          {discount > 0 && <span className="text-xs text-ash line-through">{money(product.compareAtPrice!)}</span>}
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-ash">ou 3x de {money(product.price / 3)}</p>
      </Link>
    </article>
  );
}
