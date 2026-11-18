export const THAI_REGIONS: { group: string; items: string[] }[] = [
  { group: "Northern", items: ["Tak", "Mae Sot", "Mae Hong Son", "Pai", "Chiang Mai", "Chiang Rai", "Nan", "Lampang", "Lamphun", "Phrae", "Phayao", "Sukhothai", "Phitsanulok", "Umphang"] },
  { group: "Central & West", items: ["Bangkok", "Kanchanaburi", "Nakhon Sawan", "Ayutthaya", "Suphan Buri", "Kamphaeng Phet"] },
  { group: "Southern & Border", items: ["Hat Yai (Songkhla)", "Sadao", "Phuket", "Krabi", "Surat Thani", "Trang", "Satun", "Yala", "Narathiwat", "Chumphon"] },
  { group: "Eastern & Coastal", items: ["Pattaya (Chonburi)", "Rayong", "Trat", "Hua Hin (Prachuap Khiri Khan)"] },
  { group: "Northeast", items: ["Khon Kaen", "Nakhon Ratchasima", "Udon Thani", "Loei"] },
  { group: "Other", items: ["Other / not listed"] },
];

export function townsForRegion(region: string): string[] {
  const group = region === "Northern & Touring" ? "Northern" : region;
  return THAI_REGIONS.find((r) => r.group === group)?.items ?? [];
}

/** Region a listed town belongs to, so riders only pick the town. */
export function regionForTown(town: string): string {
  return THAI_REGIONS.find((r) => r.items.includes(town))?.group ?? "";
}
