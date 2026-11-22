import { useI18n } from "@/hooks/use-i18n";
import type { MsgKey } from "@/lib/i18n/dictionary";
import { useState } from "react";
import { Ruler, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { SIZE_GUIDE, formatMeasure, type SizeUnit } from "@/lib/size-guide";

function Measure({ cm, inches, unit }: { cm: number; inches: number; unit: SizeUnit }) {
  if (unit !== "both") return <span className="whitespace-nowrap">{formatMeasure(cm, inches, unit)}</span>;
  return <><span className="whitespace-nowrap">{formatMeasure(cm, inches, "cm")}</span><span className="block whitespace-nowrap text-muted-foreground sm:inline"><span className="hidden sm:inline"> / </span>{formatMeasure(cm, inches, "in")}</span></>;
}

const UNITS: { value: SizeUnit; label: MsgKey | null }[] = [
  { value: "both", label: "sg.both" },
  { value: "cm", label: null },
  { value: "in", label: "sg.inches" },
];

export function SizeGuideTable({ selected }: { selected?: string | undefined }) {
  const [unit, setUnit] = useState<SizeUnit>("both");
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("sg.available")}</p>
        <div role="group" aria-label={t("sg.unit")} className="inline-flex rounded-md border bg-card p-0.5">
          {UNITS.map((u) => (
            <button key={u.value} type="button" aria-pressed={unit === u.value} onClick={() => setUnit(u.value)}
              className={`rounded px-3 py-1 text-xs font-semibold uppercase transition-colors ${unit === u.value ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {u.label ? t(u.label) : "CM"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm tabular-nums">
          <thead className="bg-ink text-ink-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide">{t("p.size")}</th>
              <th scope="col" className="px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide">{t("sg.chest")}</th>
              <th scope="col" className="px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide">{t("sg.length")}</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((r) => {
              const active = r.size === selected;
              return (
                <tr key={r.size} aria-current={active ? "true" : undefined} className={`border-t ${active ? "bg-muted font-semibold" : "bg-background"}`}>
                  <th scope="row" className="px-3 py-2.5 text-left font-display font-bold">
                    <span className="inline-flex flex-wrap items-center gap-1.5">{r.size}{active && <span className="whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-foreground">{t("sg.pick")}</span>}</span>
                  </th>
                  <td className="px-3 py-2.5"><Measure cm={r.chestCm} inches={r.chestIn} unit={unit} /></td>
                  <td className="px-3 py-2.5"><Measure cm={r.lengthCm} inches={r.lengthIn} unit={unit} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li><span className="font-semibold text-foreground">{t("sg.chest")}:</span> {t("sg.chestHow")}</li>
        <li><span className="font-semibold text-foreground">{t("sg.length")}:</span> {t("sg.lengthHow")}</li>
        <li>{t("sg.note")}</li>
      </ul>
    </div>
  );
}

export function ApparelSizeGuide({ selected }: { selected?: string | undefined }) {
  const { t } = useI18n();
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" size="sm"><Ruler className="mr-2 size-4" />{t("sg.button")}</Button></DialogTrigger>
    <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 [&>button:last-child]:hidden">
      <div className="flex items-start justify-between gap-3 border-b bg-background px-5 py-4">
        <div className="min-w-0 space-y-1">
          <DialogTitle className="font-display uppercase leading-tight tracking-wide">{t("sg.title")}</DialogTitle>
          <DialogDescription>{t("sg.desc")}</DialogDescription>
        </div>
        <DialogClose className="grid size-10 shrink-0 place-items-center rounded-full border border-foreground/15 bg-muted text-foreground transition-colors hover:bg-foreground hover:text-background focus:outline-none focus:ring-2 focus:ring-ring" aria-label={t("sg.closeAria")}>
          <X className="size-5" />
        </DialogClose>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4"><SizeGuideTable selected={selected} /></div>
      <div className="border-t bg-background px-5 py-3">
        <DialogClose asChild><Button className="h-11 w-full uppercase tracking-wide">{t("sg.close")}</Button></DialogClose>
      </div>
    </DialogContent>
  </Dialog>;
}
