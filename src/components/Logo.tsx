import { Link } from "react-router-dom";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`display inline-flex items-baseline text-2xl md:text-3xl ${className}`} aria-label="MouraWear — início">
      <span>MOURA</span>
      <span className="mx-0.5 text-acid">/</span>
      <span className="text-outline">WEAR</span>
    </Link>
  );
}
