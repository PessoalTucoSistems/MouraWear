import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Painel" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/banners", label: "Banners" },
  { to: "/admin/usuarios", label: "Usuários" },
  { to: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-acid">Admin</p>
          <h1 className="display text-5xl">Painel MouraWear</h1>
        </div>
        <p className="font-mono text-xs text-ash">{user?.email}</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-32 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:px-0">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `shrink-0 border px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition ${
                  isActive ? "border-acid bg-acid text-ink" : "border-line hover:border-bone"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="shrink-0 border border-line px-4 py-2.5 text-left font-mono text-xs uppercase tracking-widest text-blood hover:border-blood"
          >
            Sair
          </button>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
