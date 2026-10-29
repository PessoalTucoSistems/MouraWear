import { Link } from "react-router-dom";

// Coroa da marca, redesenhada em vetor a partir da arte original (public/mouralogo.jpeg).
export function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="100 55 260 250" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M145 243 L120 127 L186 200 L240 74 L263 190 L344 84 L309 222" />
      <path d="M116 289 Q200 254 324 247" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`display inline-flex min-w-0 shrink items-center whitespace-nowrap text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl ${className}`} aria-label="MoreiraWear — início">
      <Crown className="mr-1.5 h-[1.05em] w-[1.1em] shrink-0 -translate-y-[0.06em] text-acid" />
      <span>MOREIRA</span>
      <span className="mx-0.5 text-acid">/</span>
      <span className="text-outline">WEAR</span>
    </Link>
  );
}
