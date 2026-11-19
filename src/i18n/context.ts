import { createContext } from "react";
import { translate, type Key, type Lang } from "./dictionary";
export type I18n = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string };
export const I18nContext = createContext<I18n>({ lang: "en", setLang: () => {}, t: (k) => translate("en", k) });
