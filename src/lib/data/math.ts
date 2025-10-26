import type { Tx, EmissionFactor, FxRate } from './types';

const regionKey = (t: Tx) => {
  // Canonicalize to "COUNTRY-STATE" when USA; else "ANY"
  if (t.country === 'USA') return `US-${t.region}`;
  return 'ANY';
};

export function usdAmount(t: Tx, fx: FxRate[]) {
  const r = fx.find(f => f.currency === t.currency);
  return (r ? r.usd_per_unit : 1) * t.amount;
}

function lookupFactor(category: string, region: string, ef: EmissionFactor[]): number {
  return (
    ef.find(e => e.category === category && e.region === region)?.kgCO2e_per_USD ??
    ef.find(e => e.category === category && e.region === 'ANY')?.kgCO2e_per_USD ??
    0
  );
}

export function baselineTotals(tx: Tx[], ef: EmissionFactor[], fx: FxRate[]) {
  let totalUSD = 0, totalKg = 0;
  const byCat: Record<string, { usd: number; kg: number }> = {};
  for (const t of tx) {
    const usd = usdAmount(t, fx);
    const f = lookupFactor(t.category, regionKey(t), ef);
    const kg = usd * f;
    totalUSD += usd; totalKg += kg;
    byCat[t.category] ??= { usd: 0, kg: 0 };
    byCat[t.category].usd += usd;
    byCat[t.category].kg += kg;
  }
  return { totalUSD, totalKg, byCat };
}

export function applyScenario(tx: Tx[], ef: EmissionFactor[], fx: FxRate[], scenario: {
  steps: Array<
    | { action: 'scale_category_spend'; category: string; scale_factor: number }
    | { action: 'region_override_for_category'; category: string; from_region: string; to_region: string }
  >
}) {
  // Clone transactions
  let tx2 = tx.map(t => ({ ...t }));
  // Transform
  for (const step of scenario.steps) {
    if (step.action === 'scale_category_spend') {
      tx2 = tx2.map(t => t.category === step.category ? { ...t, amount: t.amount * step.scale_factor } : t);
    } else if (step.action === 'region_override_for_category') {
      tx2 = tx2.map(t => t.category === step.category ? { ...t, region: step.to_region.replace('US-', '') , country: step.to_region.startsWith('US-') ? 'USA' : t.country } : t);
    }
  }
  // Recompute totals
  return baselineTotals(tx2, ef, fx);
}