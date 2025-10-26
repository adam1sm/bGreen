"use client";

import { useMemo, useState } from "react";
import { loadDemo } from "@/lib/data/loaders";
import { baselineTotals, applyScenario } from "@/lib/data/math";

type Totals = ReturnType<typeof baselineTotals>;

const scenario = {
  title: "Cut flights by 25% + move cloud to Oregon?",
  steps: [
    { action: "scale_category_spend", category: "Travel-Air", scale_factor: 0.75 },
    { action: "region_override_for_category", category: "Cloud/IT", from_region: "ANY", to_region: "US-OR" },
  ],
};

export default function DemoClient() {
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<any[] | null>(null);
  const [ef, setEf] = useState<any[] | null>(null);
  const [fx, setFx] = useState<any[] | null>(null);
  const [after, setAfter] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reveal states
  const [revealing, setRevealing] = useState(false);
  const [showScenarioCols, setShowScenarioCols] = useState(false);
  const [revealingScenario, setRevealingScenario] = useState(false);

  const base: Totals | null = useMemo(() => {
    if (!tx || !ef || !fx) return null;
    return baselineTotals(tx, ef, fx);
  }, [tx, ef, fx]);

  const loadSample = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadDemo();
      setTx(data.tx);
      setEf(data.ef);
      setFx(data.fx);

      // reset scenario view
      setAfter(null);
      setShowScenarioCols(false);
      setRevealingScenario(false);

      // 1s reveal for baseline tiles/table
      setRevealing(true);
      setTimeout(() => setRevealing(false), 1000);
    } catch (e: any) {
      setError(e?.message || String(e));
      setTx(null); setEf(null); setFx(null);
    } finally {
      setLoading(false);
    }
  };

  const runScenario = () => {
    if (!tx || !ef || !fx) return;

    // show scenario columns immediately; populate after 1s
    setShowScenarioCols(true);
    setRevealingScenario(true);

    const res = applyScenario(tx, ef, fx, scenario as any);
    setTimeout(() => {
      setAfter(res);
      setRevealingScenario(false);
    }, 1000);
  };

  const rows = useMemo(() => {
    if (!base) return [];
    const entries = Object.entries(base.byCat).map(([k, v]: any) => ({
      category: k,
      usd: v.usd,
      kg: v.kg,
      kg_perc: base.totalKg ? (v.kg / base.totalKg) * 100 : 0,
    }));
    return entries.sort((a, b) => b.kg - a.kg).slice(0, 8);
  }, [base]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={loadSample}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Loading…" : "Use sample data"}
        </button>
        <button
          onClick={runScenario}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60"
          disabled={!base || revealing}
        >
          {scenario.title}
        </button>
      </div>

      {/* Credibility panel (simple counts + expandable raw row) */}
      <div className="text-xs p-3 rounded-xl border border-zinc-700/40">
        <div>tx: {tx?.length ?? 0} • ef: {ef?.length ?? 0} • fx: {fx?.length ?? 0}</div>
        {error && <div className="text-red-500 mt-1">Error: {error}</div>}
        {tx && tx.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">See an example transaction entry</summary>
            <pre className="mt-2 overflow-auto">{JSON.stringify(tx[0], null, 2)}</pre>
          </details>
        )}
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tile
          title="Baseline: total spend (USD)"
          value={!base || revealing ? "—" : `$${Math.round(base.totalUSD).toLocaleString()}`}
          loading={loading || revealing}
        />
        <Tile
          title="Baseline: total emissions"
          value={!base || revealing ? "—" : `${Math.round(base.totalKg).toLocaleString()} kg CO₂e`}
          loading={loading || revealing}
        />
        {showScenarioCols && (
          <Tile
            title="Scenario delta"
            value={
              after
                ? `↓ ${((1 - after.totalKg / (base!.totalKg)) * 100).toFixed(1)}% decrease`
                : "—"
            }
            accent={!!after}
            loading={revealingScenario}
            valueClassName={after ? "text-emerald-600" : ""} // <-- now applied
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/40">
          Top categories by kg CO₂e (baseline)
        </div>
        <table className="w-full text-sm">
          <thead className="text-left bg-zinc-50/60 dark:bg-zinc-900/20">
            <tr>
              <Th>Category</Th>
              <Th className="text-right">Spend (USD)</Th>
              <Th className="text-right">kg CO₂e</Th>
              <Th className="text-right">% of total</Th>
              {showScenarioCols && <Th className="text-right">kg after</Th>}
              {showScenarioCols && <Th className="text-right">Δ kg</Th>}
            </tr>
          </thead>
          <tbody>
            {(loading || revealing)
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-t border-zinc-200 dark:border-zinc-800 animate-pulse">
                    <Td><div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                    <Td className="text-right"><div className="ml-auto h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                    <Td className="text-right"><div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                    <Td className="text-right"><div className="ml-auto h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                    {showScenarioCols && (
                      <>
                        <Td className="text-right"><div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                        <Td className="text-right"><div className="ml-auto h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" /></Td>
                      </>
                    )}
                  </tr>
                ))
              : rows.map((r) => {
                const afterKg = after?.byCat?.[r.category]?.kg as number | undefined;
                const hasAfter = typeof afterKg === "number";
              
                const deltaRaw = hasAfter ? afterKg - r.kg : undefined;
                const deltaRounded =
                  typeof deltaRaw === "number" ? Math.round(deltaRaw) : undefined;
                const showDelta = typeof deltaRounded === "number" && deltaRounded !== 0;
              
                return (
                  <tr key={r.category} className="border-t border-zinc-200 dark:border-zinc-800">
                    <Td>{r.category}</Td>
                    <Td className="text-right">${Math.round(r.usd).toLocaleString()}</Td>
                    <Td className="text-right">{Math.round(r.kg).toLocaleString()}</Td>
                    <Td className="text-right">{r.kg_perc.toFixed(1)}%</Td>
              
                    {showScenarioCols && (
                      <>
                        {/* kg after */}
                        <Td className="text-right">
                          {revealingScenario ? (
                            <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                          ) : (
                            hasAfter ? Math.round(afterKg!).toLocaleString() : "\u00A0"
                          )}
                        </Td>
              
                        {/* Δ kg — blank when 0 */}
                        <Td
                          className={`text-right ${
                            !revealingScenario && showDelta && deltaRounded! < 0
                              ? "text-emerald-600"
                              : ""
                          } ${
                            !revealingScenario && showDelta && deltaRounded! > 0
                              ? "text-rose-500"
                              : ""
                          }`}
                        >
                          {revealingScenario ? (
                            <div className="ml-auto h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                          ) : (
                            showDelta ? deltaRounded!.toLocaleString() : "\u00A0"
                          )}
                        </Td>
                      </>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <p className="text-xs opacity-70">
        Greenline is a work in progress. More features and data sources coming soon.
      </p>
    </div>
  );
}

function Tile({
  title,
  value,
  accent = false,
  loading = false,
  valueClassName = "",
}: {
  title: string;
  value: string;
  accent?: boolean;
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        accent
          ? "border-emerald-400/60 bg-emerald-50 dark:bg-emerald-500/10"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="text-xs opacity-70">{title}</div>
      {loading ? (
        <div className="mt-2 h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      ) : (
        <div className={`text-xl font-semibold mt-1 ${valueClassName}`}>{value}</div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: any; className?: string }) {
  return <th className={`px-4 py-2 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: any; className?: string }) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}