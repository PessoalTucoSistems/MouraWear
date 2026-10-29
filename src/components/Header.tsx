import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useStore } from "../context/StoreContext";
import AnnouncementBar from "./AnnouncementBar";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "./Icons";
import Logo from "./Logo";

export default function Header() {
  const { user, logout } = useAuth();
  const { count, open } = useCart();
  const { favorites } = useFavorites();
  const { categories } = useStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(term.trim() ? `/?q=${encodeURIComponent(term.trim())}` : "/");
  };

  const iconBtn = "relative grid h-10 w-10 place-items-center border border-transparent transition hover:border-line hover:text-acid";

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div className="border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <button className={`${iconBtn} lg:hidden`} onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <MenuIcon />
          </button>
          <Logo />

          <nav className="ml-6 hidden items-center gap-5 font-mono text-xs uppercase tracking-widest lg:flex">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "text-acid" : "hover:text-acid")}>
              Shop all
            </NavLink>
            {categories.slice(0, 5).map((c) => (
              <Link key={c.id} to={`/?cat=${encodeURIComponent(c.name)}`} className="hover:text-acid">
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar">
              <SearchIcon />
            </button>
            <Link to="/favoritos" className={`${iconBtn} hidden sm:grid`} aria-label="Favoritos">
              <HeartIcon />
              {favorites.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 bg-acid" />}
            </Link>
            <Link to={user ? (user.role === "admin" ? "/admin" : "/conta") : "/login"} className={iconBtn} aria-label="Minha conta">
              <UserIcon />
            </Link>
            <button className={iconBtn} onClick={open} aria-label={`Carrinho com ${count} itens`}>
              <BagIcon />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center bg-acid px-1 font-mono text-[10px] font-bold text-ink">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="animate-rise border-t border-line">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
              <SearchIcon className="h-5 w-5 text-ash" />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar peças, coleções..."
                className="w-full bg-transparent font-mono text-sm uppercase tracking-wider outline-none placeholder:text-ash"
              />
              <button type="submit" className="btn btn-acid !py-2">Buscar</button>
            </div>
          </form>
        )}
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/70" onClick={() => setMenuOpen(false)} />
          <aside className="animate-rise absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r border-line bg-ink p-6">
            <div className="flex items-center justify-between">
              <Logo />
              <button className={iconBtn} onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
                <CloseIcon />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-4" onClick={() => setMenuOpen(false)}>
              <Link to="/" className="display text-4xl hover:text-acid">Shop all</Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/?cat=${encodeURIComponent(c.name)}`} className="display text-4xl hover:text-acid">
                  {c.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-line pt-6 font-mono text-xs uppercase tracking-widest" onClick={() => setMenuOpen(false)}>
              <Link to="/favoritos">Favoritos ({favorites.length})</Link>
              {user ? (
                <>
                  <Link to="/pedidos">Meus pedidos</Link>
                  <Link to="/conta">Minha conta</Link>
                  {user.role === "admin" && <Link to="/admin" className="text-acid">Painel admin</Link>}
                  <button className="text-left text-blood" onClick={logout}>Sair</button>
                </>
              ) : (
                <Link to="/login" className="text-acid">Entrar / Criar conta</Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
