// lib/emissions/estimate.ts
import { MCC_TO_NAICS_2017, FALLBACK_NAICS } from "./crosswalk";
import { getNaicsFactor } from "./factors"

export type Tx = {
  id: string;
  amount: number; // cents (negative for charges)
  currency: string; // "usd"
  merchant_data?: {
    category_code?: string; // MCC e.g., "5411"
    category?: string;
    name?: string;
  };
};

export type Footprint = {
  tx_id: string;
  usd: number;
  mcc?: string;
  naics?: string;
  naics_title?: string;
  factor_used?: number | null;
  kg_co2e?: number | null;
  method: "scope3_upstream" | "scope3_full_value_chain";
};

export function estimateTxFootprint(
  tx: Tx,
  opts: { method?: Footprint["method"]; useFallback?: boolean } = {}
): Footprint {
  const { method = "scope3_full_value_chain", useFallback = true } = opts;

  const cents = typeof tx.amount === "number" ? Math.abs(tx.amount) : 0;
  const usd = cents / 100;

  const mcc = tx.merchant_data?.category_code;
  let naics: string | undefined;

  if (mcc && MCC_TO_NAICS_2017[mcc]) {
    naics = MCC_TO_NAICS_2017[mcc].naics;
  } else if (useFallback) {
    naics = FALLBACK_NAICS;
  }

  const factorRow = naics ? getNaicsFactor(naics) : undefined;

  const perUsd =
    method === "scope3_upstream"
      ? factorRow?.scope3_upstream_kg_per_usd_2021 ?? null
      : factorRow?.scope3_full_value_chain_kg_per_usd_2021 ?? null;

  const kg = perUsd != null ? usd * perUsd : null;

  return {
    tx_id: tx.id,
    usd,
    mcc,
    naics,
    naics_title: factorRow?.naics_title,
    factor_used: perUsd,
    kg_co2e: kg,
    method,
  };
}

export function estimateMany(
  txs: Tx[],
  opts?: Parameters<typeof estimateTxFootprint>[1]
) {
  return txs.map((t) => estimateTxFootprint(t, opts));
}