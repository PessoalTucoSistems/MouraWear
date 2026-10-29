import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Category, StoreSettings } from "../types";

const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "NOVO DROP DISPONÍVEL ✦ PARCELE EM ATÉ 6X",
  whatsapp: "",
  instagram: "",
  pixKey: "",
  shippingFee: 0,
  freeShippingMin: 0,
  mercadoPagoEnabled: false,
  onlinePayment: null,
};

interface StoreContextValue {
  settings: StoreSettings;
  categories: Category[];
  reload: () => void;
}

const StoreContext = createContext<StoreContextValue>({
  settings: DEFAULT_SETTINGS,
  categories: [],
  reload: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);

  const reload = useCallback(() => {
    api<StoreSettings>("/settings").then(setSettings).catch(() => {});
    api<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(reload, [reload]);

  return <StoreContext.Provider value={{ settings, categories, reload }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

export const shippingFor = (subtotal: number, settings: StoreSettings) =>
  settings.freeShippingMin > 0 && subtotal >= settings.freeShippingMin ? 0 : settings.shippingFee;
