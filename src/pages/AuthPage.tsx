import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Login e cadastro na mesma tela: o cliente chega aqui ao tentar comprar.
export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  if (user && !loading) return <Navigate to={next || (user.role === "admin" ? "/admin" : "/")} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const logged = isLogin ? await login(form.email, form.password) : await register(form);
      toast(isLogin ? `Bem-vindo de volta, ${logged.name.split(" ")[0]}` : "Conta criada!");
      navigate(next || (logged.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
      <div className="relative hidden flex-col justify-between overflow-hidden border-2 border-bone bg-acid p-8 text-ink md:flex">
        <img src="/mascote.webp" alt="" className="pointer-events-none absolute -bottom-2 -right-8 h-[92%] max-w-none select-none lg:right-0" />
        <p className="relative font-mono text-xs uppercase tracking-[0.3em]">MoreiraWear club</p>
        <p className="display relative text-8xl">
          Join<br />the<br />crew.
        </p>
        <p className="relative max-w-[12rem] text-sm lg:max-w-[14rem]">Acompanhe seus pedidos, salve seus dados de entrega e fique por dentro dos próximos drops.</p>
      </div>

      <div>
        <div className="mb-8 flex border-b border-line font-mono text-xs uppercase tracking-widest">
          <Link to={`/login${query}`} className={`-mb-px border-b-2 px-4 py-3 ${isLogin ? "border-acid text-acid" : "border-transparent text-ash"}`}>
            Entrar
          </Link>
          <Link to={`/cadastro${query}`} className={`-mb-px border-b-2 px-4 py-3 ${!isLogin ? "border-acid text-acid" : "border-transparent text-ash"}`}>
            Criar conta
          </Link>
        </div>

        <h1 className="display text-5xl md:text-6xl">{isLogin ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-2 text-sm text-ash">
          {next ? "Faça login para adicionar ao carrinho e finalizar sua compra." : isLogin ? "Use seu e-mail e senha." : "Leva menos de um minuto."}
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="label" htmlFor="name">Nome completo</label>
              <input id="name" className="input" required autoComplete="name" {...field("name")} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="input" required autoComplete="email" {...field("email")} />
          </div>
          {!isLogin && (
            <div>
              <label className="label" htmlFor="phone">WhatsApp (opcional)</label>
              <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="(11) 99999-9999" {...field("phone")} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={isLogin ? undefined : 6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              {...field("password")}
            />
          </div>
          {error && <p className="border border-blood px-3 py-2 text-sm text-blood">{error}</p>}
          <button className="btn btn-acid mt-2" disabled={loading}>
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
          </button>
          <p className="text-center text-sm text-ash">
            {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
            <Link to={`${isLogin ? "/cadastro" : "/login"}${query}`} className="text-bone underline underline-offset-4 hover:text-acid">
              {isLogin ? "Cadastre-se" : "Entre"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
