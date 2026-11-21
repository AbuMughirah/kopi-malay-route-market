import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext } from "./i18n-context";
import { isLang, LANG_STORAGE_KEY, translate, type Lang } from "@/lib/i18n/dictionary";

// SSR always renders English; the saved choice is applied after hydration to avoid mismatches.
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try { const saved = localStorage.getItem(LANG_STORAGE_KEY); if (isLang(saved)) setLangState(saved); } catch { /* storage blocked */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* storage blocked */ }
  }, []);
  const value = useMemo(() => ({ lang, setLang, t: (k: Parameters<typeof translate>[1]) => translate(lang, k) }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
