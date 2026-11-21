import { LANGS, LANG_LABEL, LANG_NAME } from "@/lib/i18n/dictionary";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("nav.language")} className={cn("flex items-center rounded-full border border-foreground/20 p-0.5", className)}>
      {LANGS.map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} lang={l} title={LANG_NAME[l]}
          className={cn("rounded-full px-2.5 py-1 font-display text-xs font-bold transition-colors", lang === l ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground")}>
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
