import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`animate-rise relative w-full border-2 border-bone bg-ink shadow-[8px_8px_0_#c8ff00] ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="display text-2xl">{title}</h2>
          <button onClick={onClose} className="hover:text-acid" aria-label="Fechar">
            <CloseIcon />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
