import { useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { dateTime } from "../../lib/format";
import type { Role, User } from "../../types";

const MAIN_ADMIN = "moreirawear@admin.com";

interface Draft {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
}

function UserForm({ initial, onClose, onSaved }: { initial: Draft; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const isMainAdmin = draft.email === MAIN_ADMIN;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...draft, password: draft.password || undefined };
      await api(draft.id ? `/admin/users/${draft.id}` : "/admin/users", { method: draft.id ? "PUT" : "POST", body });
      toast("Usuário salvo");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <Modal title={draft.id ? "Editar usuário" : "Novo usuário"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="u-name">Nome</label>
          <input id="u-name" className="input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="u-email">E-mail</label>
          <input id="u-email" type="email" className="input disabled:opacity-50" required disabled={!!draft.id} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="u-phone">WhatsApp</label>
          <input id="u-phone" className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="u-role">Perfil</label>
          <select id="u-role" className="input disabled:opacity-50" disabled={isMainAdmin} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}>
            <option value="customer">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="u-pass">{draft.id ? "Nova senha (deixe vazio para manter)" : "Senha"}</label>
          <input
            id="u-pass"
            type="text"
            className="input font-mono"
            required={!draft.id}
            minLength={6}
            autoComplete="new-password"
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
          />
          {isMainAdmin && (
            <p className="mt-2 text-xs text-ash">
              Esta senha vale até a variável <code className="text-acid">ADMIN_PASSWORD</code> ser alterada no Render.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-acid">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");

  const load = () => api<User[]>("/admin/users").then(setUsers).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const remove = async (u: User) => {
    if (!window.confirm(`Excluir ${u.name}?`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      toast("Usuário excluído", "info");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const filtered = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Buscar nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-acid ml-auto" onClick={() => setEditing({ name: "", email: "", phone: "", role: "customer", password: "" })}>
          + Novo usuário
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="rtable w-full text-sm md:min-w-[640px]">
          <thead className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-ash">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Perfil</th>
              <th className="p-3 text-left">Pedidos</th>
              <th className="p-3 text-left">Desde</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-ash">{u.email}{u.phone && ` · ${u.phone}`}</p>
                </td>
                <td className="p-3" data-label="Perfil"><span className={`tag ${u.role === "admin" ? "bg-acid text-ink" : "bg-coal text-bone"}`}>{u.role === "admin" ? "Admin" : "Cliente"}</span></td>
                <td className="p-3 font-mono" data-label="Pedidos">{u.ordersCount}</td>
                <td className="p-3 font-mono text-xs text-ash" data-label="Desde">{u.createdAt ? dateTime(u.createdAt) : "—"}</td>
                <td className="rtable-actions p-3 text-right whitespace-nowrap">
                  <button className="mr-3 font-mono text-xs uppercase hover:text-acid" onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, password: "" })}>
                    Editar
                  </button>
                  {u.email !== MAIN_ADMIN && u.id !== me?.id && (
                    <button className="font-mono text-xs uppercase text-blood" onClick={() => remove(u)}>Excluir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <UserForm
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
