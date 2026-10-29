import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { whatsappLink } from "../lib/format";

export default function Footer() {
  const { settings, categories } = useStore();
  const instagram = settings.instagram.replace(/^@/, "");

  return (
    <footer className="mt-24 border-t-2 border-bone">
      <div className="overflow-hidden border-b border-line py-6">
        <p className="display animate-marquee w-max whitespace-nowrap text-[18vw] leading-none text-outline md:text-[11vw]">
          MOURAWEAR ✦ STREET CULTURE ✦ MOURAWEAR ✦ STREET CULTURE ✦&nbsp;
        </p>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-4xl">Feito na rua.<br /><span className="text-acid">Vestido por você.</span></p>
          <p className="mt-4 max-w-sm text-sm text-ash">Streetwear com modelagem oversized, tecidos pesados e drops em quantidade limitada.</p>
        </div>
        <div>
          <p className="label">Shop</p>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/?cat=${encodeURIComponent(c.name)}`} className="hover:text-acid">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Atendimento</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/pedidos" className="hover:text-acid">Meus pedidos</Link></li>
            <li><Link to="/conta" className="hover:text-acid">Minha conta</Link></li>
            {settings.whatsapp && (
              <li><a href={whatsappLink(settings.whatsapp, "Olá, MouraWear!")} target="_blank" rel="noreferrer" className="hover:text-acid">WhatsApp</a></li>
            )}
            {instagram && (
              <li><a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="hover:text-acid">@{instagram}</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center font-mono text-[11px] uppercase tracking-widest text-ash">
        © {new Date().getFullYear()} MouraWear — todos os direitos reservados
      </div>
    </footer>
  );
}
