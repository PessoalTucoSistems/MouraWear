import { useStore } from "../context/StoreContext";

export default function AnnouncementBar() {
  const { settings } = useStore();
  if (!settings.announcement) return null;
  // Texto repetido duas vezes para o loop do marquee não ter emenda.
  const text = Array(4).fill(settings.announcement).join("  ✦  ");

  return (
    <div className="overflow-hidden border-b-2 border-ink bg-acid py-2 text-ink">
      <div className="animate-marquee flex w-max whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.2em]">
        <span className="px-4">{text}</span>
        <span className="px-4" aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}
