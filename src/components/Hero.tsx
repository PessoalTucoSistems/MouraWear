import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Banner } from "../types";
import { ArrowIcon } from "./Icons";

// Sem banners cadastrados, mostra o hero tipográfico padrão da marca.
function DefaultHero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-bone">
      {/* Mascote da marca: atrás do texto no celular, ao lado no desktop. */}
      <img
        src="/mascote.webp"
        alt=""
        className="pointer-events-none absolute -right-6 bottom-0 h-[78%] max-w-none select-none opacity-90 sm:right-0 md:right-[4%] md:h-[96%] md:opacity-100 lg:right-[8%]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Drop 01 — disponível agora</p>
        <h1 className="display mt-4 text-[22vw] md:text-[9.5rem] lg:text-[12rem] xl:text-[13rem]">
          Moura<br />
          <span className="text-outline">Wear</span>
        </h1>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a href="#catalogo" className="btn btn-acid">
            Ver catálogo <ArrowIcon className="h-4 w-4" />
          </a>
          <p className="max-w-[14rem] text-sm text-ash sm:max-w-xs">Oversized, heavyweight e sem pedir licença. Peças em tiragem limitada.</p>
        </div>
      </div>
    </section>
  );
}

export default function Hero({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return <DefaultHero />;
  const banner = banners[index % banners.length];

  return (
    <section className="relative h-[70vh] min-h-[420px] overflow-hidden border-b-2 border-bone">
      {banners.map((b, i) => (
        <img
          key={b.id}
          src={b.image}
          alt={b.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/30 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14">
        {banner.subtitle && <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">{banner.subtitle}</p>}
        {banner.title && <h1 className="display mt-3 max-w-4xl text-6xl md:text-9xl">{banner.title}</h1>}
        {banner.buttonLabel && (
          <Link to={banner.category ? `/?cat=${encodeURIComponent(banner.category)}` : "/#catalogo"} className="btn btn-acid mt-6 self-start">
            {banner.buttonLabel} <ArrowIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-5 right-4 flex gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 transition-all ${i === index ? "w-10 bg-acid" : "w-5 bg-bone/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
