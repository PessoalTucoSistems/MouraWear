import type { Product } from "../types";

// Arte tipográfica usada quando o produto ainda não tem foto.
export default function ProductArt({ product, className = "" }: { product: Pick<Product, "name" | "color" | "category">; className?: string }) {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-end overflow-hidden p-4 ${className}`}
      style={{ background: product.color || "#1a1a1a" }}
    >
      <span className="display pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none text-[9rem] text-white/[0.06]">MW</span>
      {product.category && <span className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60">{product.category}</span>}
      <span className="display relative text-3xl text-bone/90 md:text-4xl">{product.name}</span>
    </div>
  );
}
