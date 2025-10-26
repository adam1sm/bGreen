// lib/emissions/factors.ts
import raw from "../../../public/data/naics_factors_min.json" assert { type: "json" };

// Build a lookup map once
export type NaicsFactor = {
  naics_code: string;
  naics_title: string;
  scope3_upstream_kg_per_usd_2021: number | null;
  scope3_full_value_chain_kg_per_usd_2021: number | null;
};

// If the JSON is a single object, wrap it; if it's already an array, use it.
const rows: NaicsFactor[] = Array.isArray(raw)
  ? (raw as NaicsFactor[])
  : [raw as NaicsFactor];

const NAICS_FACTORS: Map<string, NaicsFactor> = new Map(
  rows.map((r) => [r.naics_code, r])
);

export function getNaicsFactor(naics: string): NaicsFactor | undefined {
  return NAICS_FACTORS.get(naics);
}