import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { Loading } from "../components/Guards";
import { useStore } from "../context/StoreContext";
import { api } from "../lib/api";
import { discountPercent, totalStock } from "../lib/format";
import type { Banner, Product } from "../types";

type Sort = "new" | "price-asc" | "price-desc" | "sale";

export default function CatalogPage() {
  const { categories } = useStore();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("new");

  const category = params.get("cat") || "";
  const query = params.get("q") || "";

  useEffect(() => {
    api<Product[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e.message));
    api<Banner[]>("/banners").then(setBanners).catch(() => {});
  }, []);

  // Ao filtrar por categoria/busca, rola direto para a vitrine.
  useEffect(() => {
    if (category || query) document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }, [category, query]);

  const visible = useMemo(() => {
    if (!products) return [];
    const q = query.toLowerCase();
    const list = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
    const inStockFirst = (a: Product, b: Product) => Number(totalStock(b.sizes) > 0) - Number(totalStock(a.sizes) > 0);
    return [...list].sort((a, b) => {
      const stock = inStockFirst(a, b);
      if (stock) return stock;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "sale") return discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice);
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [products, category, query, sort]);

  const featured = useMemo(() => (products || []).filter((p) => p.featured).slice(0, 4), [products]);

  const setFilter = (cat: string) => {
    const next = new URLSearchParams(params);
    if (cat) next.set("cat", cat);
    else next.delete("cat");
    next.delete("q");
    setParams(next);
  };

  const chip = (active: boolean) =>
    `shrink-0 border px-4 py-2 font-mono text-xs uppercase tracking-widest transition ${
      active ? "border-acid bg-acid text-ink" : "border-line hover:border-bone"
    }`;

  return (
    <>
      <Hero banners={banners} />

      {!category && !query && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="display text-5xl md:text-7xl">
              Em <span className="text-acid">alta</span>
            </h2>
            <span className="font-mono text-xs uppercase tracking-widest text-ash">Seleção da semana</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-5xl md:text-7xl">
            {query ? (
              <>Busca: <span className="text-acid">{query}</span></>
            ) : category ? (
              category
            ) : (
              <>Shop <span className="text-outline">all</span></>
            )}
          </h2>
          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ash">
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="border border-line bg-smoke px-3 py-2 text-bone outline-none focus:border-acid">
              <option value="new">Lançamentos</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="sale">Promoções</option>
            </select>
          </label>
        </div>

        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2">
          <button className={chip(!category)} onClick={() => setFilter("")}>[ Todos ]</button>
          {categories.map((c) => (
            <button key={c.id} className={chip(category === c.name)} onClick={() => setFilter(c.name)}>
              [ {c.name} ]
            </button>
          ))}
        </div>

        {error ? (
          <p className="card p-6 text-center text-blood">{error}</p>
        ) : !products ? (
          <Loading />
        ) : visible.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="display text-4xl text-outline">Nada por aqui</p>
            <p className="mt-2 text-sm text-ash">Tente outra categoria ou busca.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ash">{visible.length} peça(s)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
