/** Only human-readable details are capitalized; identifiers and selection values stay intact. */
const CAPITAL_FIELDS = new Set([
  "name", "full_name", "address", "city", "postcode", "nationality", "passport_number",
  "plate_number", "motorcycle_plate", "motorcycle_make", "motorcycle_model",
  "breakdown_location", "destination",
]);

export function capitalizeFormValue(key: string, value: string): string {
  return CAPITAL_FIELDS.has(key) ? value.toUpperCase() : value;
}

export function capitalizeFormDetails<T extends Record<string, string>>(details: T): T {
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [key, capitalizeFormValue(key, value)])) as T;
}