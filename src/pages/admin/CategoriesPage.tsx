import { useState, type FormEvent } from "react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { Category } from "../../types";

export default function CategoriesPage() {
  const { categories, reload } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast(message);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const create = (e: FormEvent) => {
    e.preventDefault();
    run(() => api("/categories", { method: "POST", body: { name, order: categories.length } }), "Categoria criada").then(() => setName(""));
  };

  const move = (index: number, delta: number) => {
    const target = categories[index + delta];
    if (!target) return;
    const current = categories[index];
    run(async () => {
      await api(`/categories/${current.id}`, { method: "PUT", body: { order: index + delta } });
      await api(`/categories/${target.id}`, { method: "PUT", body: { order: index } });
    }, "Ordem atualizada");
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={create} className="mb-6 flex gap-3">
        <input className="input" placeholder="Nova categoria (ex.: Jaquetas)" required value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-acid shrink-0">Adicionar</button>
      </form>

      <ul className="card divide-y divide-line">
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 p-3">
            <div className="flex flex-col">
              <button className="px-1 text-xs text-ash hover:text-acid disabled:opacity-20" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">▲</button>
              <button className="px-1 text-xs text-ash hover:text-acid disabled:opacity-20" disabled={i === categories.length - 1} onClick={() => move(i, 1)} aria-label="Descer">▼</button>
            </div>
            {editing?.id === c.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => api(`/categories/${c.id}`, { method: "PUT", body: { name: editing.name } }), "Categoria renomeada").then(() => setEditing(null));
                }}
              >
                <input autoFocus className="input !py-2" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <button className="btn btn-acid !py-2">Salvar</button>
                <button type="button" className="btn btn-ghost !py-2" onClick={() => setEditing(null)}>✕</button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-semibold uppercase">{c.name}</span>
                <button className="font-mono text-xs uppercase hover:text-acid" onClick={() => setEditing(c)}>Renomear</button>
                <button
                  className="font-mono text-xs uppercase text-blood"
                  onClick={() => window.confirm(`Excluir "${c.name}"?`) && run(() => api(`/categories/${c.id}`, { method: "DELETE" }), "Categoria excluída")}
                >
                  Excluir
                </button>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && <li className="p-6 text-center text-ash">Nenhuma categoria.</li>}
      </ul>
      <p className="mt-3 font-mono text-[11px] text-ash">Renomear uma categoria atualiza os produtos dela automaticamente.</p>
    </div>
  );
}
