import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext } from "./context";
import { LANGS, translate, type Key, type Lang } from "./dictionary";

const STORE = "km-lang";
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem(STORE) as Lang | null;
    if (saved && LANGS.includes(saved)) setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem(STORE, l); }, []);
  const value = useMemo(() => ({ lang, setLang, t: (k: Key) => translate(lang, k) }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useT = () => useContext(I18nContext);
