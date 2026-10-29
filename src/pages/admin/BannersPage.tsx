import { useEffect, useState, type FormEvent } from "react";
import ImageField from "../../components/ImageField";
import Modal from "../../components/Modal";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { Banner } from "../../types";

type Draft = Omit<Banner, "id"> & { id?: string };

function BannerForm({ initial, onClose, onSaved }: { initial: Draft; onClose: () => void; onSaved: () => void }) {
  const { categories } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.image) {
      toast("Envie a imagem do banner", "error");
      return;
    }
    try {
      await api(draft.id ? `/banners/${draft.id}` : "/banners", { method: draft.id ? "PUT" : "POST", body: draft });
      toast("Banner salvo");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <Modal title={draft.id ? "Editar banner" : "Novo banner"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="label">Imagem (ideal 1920×900, horizontal)</p>
          {draft.image && <img src={draft.image} alt="" className="mb-3 aspect-[21/9] w-full border border-line object-cover" />}
          <ImageField label={draft.image ? "Trocar imagem" : "Enviar imagem"} onAdd={(url) => set("image", url)} />
        </div>
        <div>
          <label className="label" htmlFor="b-title">Título</label>
          <input id="b-title" className="input" placeholder="DROP 02" value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="b-sub">Subtítulo</label>
          <input id="b-sub" className="input" placeholder="Coleção inverno" value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="b-btn">Texto do botão</label>
          <input id="b-btn" className="input" placeholder="Ver coleção" value={draft.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="b-cat">Botão leva para</label>
          <select id="b-cat" className="input" value={draft.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Catálogo completo</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="b-order">Ordem</label>
          <input id="b-order" className="input" type="number" value={draft.order} onChange={(e) => set("order", Number(e.target.value))} />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#c8ff00]" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
          Ativo
        </label>
        <div className="flex justify-end gap-3 border-t border-line pt-4 md:col-span-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-acid">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function BannersPage() {
  const toast = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = () => api<Banner[]>("/banners?all=1").then(setBanners).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const remove = async (b: Banner) => {
    if (!window.confirm("Excluir este banner?")) return;
    await api(`/banners/${b.id}`, { method: "DELETE" });
    toast("Banner excluído", "info");
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-ash">Sem banners ativos, a home mostra o hero tipográfico da marca.</p>
        <button
          className="btn btn-acid ml-auto"
          onClick={() => setEditing({ image: "", title: "", subtitle: "", buttonLabel: "Ver coleção", category: "", order: banners.length, active: true })}
        >
          + Novo banner
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className={`card overflow-hidden ${b.active ? "" : "opacity-50"}`}>
            <div className="relative aspect-[21/9]">
              <img src={b.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-ink/90 to-transparent p-4">
                <p className="display text-3xl">{b.title || "—"}</p>
                <p className="font-mono text-xs text-acid">{b.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 font-mono text-xs uppercase">
              <span className="text-ash">#{b.order} · {b.active ? "ativo" : "inativo"}{b.category && ` · ${b.category}`}</span>
              <button className="ml-auto hover:text-acid" onClick={() => setEditing(b)}>Editar</button>
              <button className="text-blood" onClick={() => remove(b)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <BannerForm
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
