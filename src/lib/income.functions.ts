import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IncomeFiltersSchema, buildIncomeReport, incomeCsv } from "./income";

export const checkIncomeOwner = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertOwnerCaller } = await import("./owner-gate.server");
  await assertOwnerCaller(context);
  return true;
});

export const getIncomeReport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IncomeFiltersSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertOwnerCaller } = await import("./owner-gate.server");
    await assertOwnerCaller(context);
    const { loadIncomeOrders } = await import("./income.server");
    return buildIncomeReport(await loadIncomeOrders(), data);
  });

export const exportIncomeCsv = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IncomeFiltersSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertOwnerCaller } = await import("./owner-gate.server");
    await assertOwnerCaller(context);
    const { loadIncomeOrders } = await import("./income.server");
    return incomeCsv(buildIncomeReport(await loadIncomeOrders(), data), data.view);
  });
