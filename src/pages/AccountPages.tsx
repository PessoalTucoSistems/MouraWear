import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import type { Product, User } from "../types";

export function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user!.name, phone: user!.phone });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });

  const save = async (e: FormEvent, body: object, done?: () => void) => {
    e.preventDefault();
    try {
      const { user } = await api<{ user: User }>("/auth/me", { method: "PUT", body });
      setUser(user);
      toast("Dados atualizados");
      done?.();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-ash">{user!.email}</p>
      <h1 className="display text-6xl">Olá, {user!.name.split(" ")[0]}</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/pedidos" className="btn btn-acid">Meus pedidos</Link>
        <Link to="/favoritos" className="btn btn-ghost">Favoritos</Link>
        {user!.role === "admin" && <Link to="/admin" className="btn btn-ghost">Painel admin</Link>}
        <button
          className="btn btn-danger"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Sair
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <form className="card flex flex-col gap-4 p-6" onSubmit={(e) => save(e, profile)}>
          <h2 className="display text-2xl">Seus dados</h2>
          <div>
            <label className="label" htmlFor="acc-name">Nome</label>
            <input id="acc-name" className="input" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="acc-phone">WhatsApp</label>
            <input id="acc-phone" className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <button className="btn btn-ghost">Salvar</button>
        </form>

        <form
          className="card flex flex-col gap-4 p-6"
          onSubmit={(e) => save(e, passwords, () => setPasswords({ currentPassword: "", newPassword: "" }))}
        >
          <h2 className="display text-2xl">Trocar senha</h2>
          <div>
            <label className="label" htmlFor="acc-cur">Senha atual</label>
            <input id="acc-cur" type="password" className="input" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="acc-new">Nova senha</label>
            <input id="acc-new" type="password" className="input" required minLength={6} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          </div>
          <button className="btn btn-ghost">Alterar senha</button>
        </form>
      </div>
    </div>
  );
}

export function FavoritesPage() {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api<Product[]>("/products").then(setProducts).catch(() => {});
  }, []);

  const list = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="display text-6xl">Favoritos</h1>
      {list.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-ash">Toque no ♡ das peças para salvar aqui.</p>
          <Link to="/" className="btn btn-acid mt-6">Ver catálogo</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <img src="/mascote.webp" alt="" className="mx-auto h-56 md:h-72" />
      <p className="display mt-4 text-[22vw] leading-none text-outline md:text-[10rem]">404</p>
      <p className="mt-2 text-ash">Essa página saiu de linha.</p>
      <Link to="/" className="btn btn-acid mt-8">Voltar ao catálogo</Link>
    </div>
  );
}
