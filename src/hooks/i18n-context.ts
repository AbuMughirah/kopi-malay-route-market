import { createContext } from "react";
import type { Lang, MsgKey } from "@/lib/i18n/dictionary";
export type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (k: MsgKey) => string };
export const I18nContext = createContext<I18nValue | null>(null);
