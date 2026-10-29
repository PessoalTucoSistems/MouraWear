import { useEffect, useMemo, useState, type FormEvent } from "react";
import ImageField from "../../components/ImageField";
import { CloseIcon } from "../../components/Icons";
import Modal from "../../components/Modal";
import ProductArt from "../../components/ProductArt";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { money, totalStock } from "../../lib/format";
import type { Product, SizeStock } from "../../types";

type Draft = Omit<Product, "id" | "createdAt"> & { id?: string };

const SIZE_PRESETS: Record<string, string[]> = {
  "P–GG": ["P", "M", "G", "GG"],
  "PP–XGG": ["PP", "P", "M", "G", "GG", "XGG"],
  "36–46": ["36", "38", "40", "42", "44", "46"],
  Único: ["U"],
};

const emptyDraft = (category = ""): Draft => ({
  name: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  category,
  images: [],
  sizes: SIZE_PRESETS["P–GG"].map((size) => ({ size, stock: 0 })),
  featured: false,
  isNew: true,
  active: true,
  color: "#1a1a1a",
});

function ProductForm({ initial, onClose, onSaved }: { initial: Draft; onClose: () => void; onSaved: () => void }) {
  const { categories } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setSize = (index: number, patch: Partial<SizeStock>) =>
    set("sizes", draft.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const applyPreset = (sizes: string[]) =>
    set("sizes", sizes.map((size) => ({ size, stock: draft.sizes.find((s) => s.size === size)?.stock ?? 0 })));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(draft.id ? `/products/${draft.id}` : "/products", { method: draft.id ? "PUT" : "POST", body: draft });
      toast(draft.id ? "Produto atualizado" : "Produto criado");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={draft.id ? "Editar produto" : "Novo produto"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="p-name">Nome</label>
          <input id="p-name" className="input" required value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="p-cat">Categoria</label>
          <select id="p-cat" className="input" required value={draft.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="p-price">Preço</label>
            <input id="p-price" className="input" type="number" step="0.01" min="0.01" required value={draft.price || ""} onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="p-cmp">Preço "de"</label>
            <input id="p-cmp" className="input" type="number" step="0.01" min="0" placeholder="opcional" value={draft.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="p-desc">Descrição</label>
          <textarea id="p-desc" className="input min-h-24" value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <p className="label">Fotos (a primeira é a capa, a segunda aparece ao passar o mouse)</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {draft.images.map((src, i) => (
              <div key={src + i} className="group relative h-24 w-20 border border-line">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => set("images", draft.images.filter((_, j) => j !== i))} className="absolute right-0 top-0 bg-blood p-0.5 text-ink" aria-label="Remover foto">
                  <CloseIcon className="h-3 w-3" />
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => set("images", [src, ...draft.images.filter((_, j) => j !== i)])}
                    className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 font-mono text-[9px] uppercase opacity-0 group-hover:opacity-100"
                  >
                    Tornar capa
                  </button>
                )}
              </div>
            ))}
            {draft.images.length === 0 && (
              <div className="h-24 w-20 border border-line">
                <ProductArt product={draft} className="!p-1 [&_span:last-child]:!text-xs" />
              </div>
            )}
          </div>
          <ImageField onAdd={(url) => setDraft((d) => ({ ...d, images: [...d.images, url] }))} />
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="label !mb-0 mr-2">Tamanhos e estoque</p>
            {Object.entries(SIZE_PRESETS).map(([name, sizes]) => (
              <button key={name} type="button" onClick={() => applyPreset(sizes)} className="border border-line px-2 py-1 font-mono text-[10px] uppercase hover:border-acid">
                {name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {draft.sizes.map((s, i) => (
              <div key={i} className="flex border border-line">
                <input className="w-14 bg-coal px-2 text-center font-mono text-sm uppercase outline-none" value={s.size} onChange={(e) => setSize(i, { size: e.target.value.toUpperCase() })} aria-label="Tamanho" />
                <input className="w-full bg-smoke px-2 py-2 font-mono text-sm outline-none" type="number" min="0" value={s.stock} onChange={(e) => setSize(i, { stock: Number(e.target.value) })} aria-label={`Estoque ${s.size}`} />
                <button type="button" className="px-2 text-ash hover:text-blood" onClick={() => set("sizes", draft.sizes.filter((_, j) => j !== i))} aria-label="Remover tamanho">
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("sizes", [...draft.sizes, { size: "", stock: 0 }])} className="border border-dashed border-line py-2 font-mono text-xs uppercase hover:border-acid">
              + Tamanho
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 md:col-span-2">
          {([
            ["active", "Ativo na loja"],
            ["featured", "Destaque (Em alta)"],
            ["isNew", "Selo New drop"],
          ] as const).map(([key, text]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#c8ff00]" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} />
              {text}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="color" value={draft.color} onChange={(e) => set("color", e.target.value)} className="h-7 w-10 cursor-pointer border border-line bg-transparent" />
            Cor do card sem foto
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-4 md:col-span-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-acid" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const toast = useToast();
  const { categories } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");

  const load = () => api<Product[]>("/products?all=1").then(setProducts).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const remove = async (p: Product) => {
    if (!window.confirm(`Excluir "${p.name}"? Pedidos antigos continuam com o histórico.`)) return;
    await api(`/products/${p.id}`, { method: "DELETE" });
    toast("Produto excluído", "info");
    load();
  };

  const toggleActive = async (p: Product) => {
    await api(`/products/${p.id}`, { method: "PUT", body: { ...p, active: !p.active } });
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Buscar produto…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-acid ml-auto" onClick={() => setEditing(emptyDraft(categories[0]?.name))}>+ Novo produto</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="rtable w-full text-sm md:min-w-[640px]">
          <thead className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-ash">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">Preço</th>
              <th className="p-3 text-left">Estoque</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-11 shrink-0 overflow-hidden border border-line">
                      {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: p.color }} />}
                    </div>
                    <div>
                      <p className="font-semibold uppercase">{p.name}</p>
                      <p className="font-mono text-xs text-ash">{p.category}{p.featured && " · ★ destaque"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono" data-label="Preço">{money(p.price)}</td>
                <td className="p-3 font-mono text-xs" data-label="Estoque">
                  <span className={totalStock(p.sizes) === 0 ? "text-blood" : ""}>{totalStock(p.sizes)} un</span>
                  <p className="text-ash">{p.sizes.map((s) => `${s.size}:${s.stock}`).join(" ")}</p>
                </td>
                <td className="p-3" data-label="Status">
                  <button onClick={() => toggleActive(p)} className={`tag ${p.active ? "bg-acid text-ink" : "bg-coal text-ash"}`}>
                    {p.active ? "Ativo" : "Oculto"}
                  </button>
                </td>
                <td className="rtable-actions p-3 text-right whitespace-nowrap">
                  <button className="mr-3 font-mono text-xs uppercase hover:text-acid" onClick={() => setEditing(p)}>Editar</button>
                  <button className="font-mono text-xs uppercase text-blood" onClick={() => remove(p)}>Excluir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ash">Nenhum produto.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
