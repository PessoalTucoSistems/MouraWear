import type { ReactNode } from "react";

type IconProps = { className?: string };

const base = (path: ReactNode) =>
  function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square" aria-hidden="true">
        {path}
      </svg>
    );
  };

export const BagIcon = base(<path d="M5 8h14l-1 13H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" />);
export const UserIcon = base(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
export const HeartIcon = base(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />);
export const SearchIcon = base(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>);
export const CloseIcon = base(<path d="M6 6l12 12M18 6 6 18" />);
export const MenuIcon = base(<path d="M4 7h16M4 12h16M4 17h16" />);
export const ArrowIcon = base(<path d="M5 12h14m-5-5 5 5-5 5" />);
export const PlusIcon = base(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = base(<path d="M5 12h14" />);
export const TrashIcon = base(<path d="M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13" />);
