"use client";

// ========================= Client Component Root =========================
// This component renders a demo dashboard that can load sample data or generate
// Stripe Issuing test transactions, calculate Scope 3 emissions, run a scenario,
// and display tiles + a top categories table.

// ----------------------------- Imports ----------------------------------
import React from "react";
import { Chart } from "react-google-charts";
import { useMemo, useState, useEffect } from "react";
import { loadDemo } from "../lib/data/loaders";
import { baselineTotals, applyScenario } from "../lib/data/math";
import { estimateMany } from "../lib/emissions/estimate";

// Type alias for the aggregate baseline totals computed from (tx, ef, fx)
type Totals = ReturnType<typeof baselineTotals>;

// ======================= Feature: Scenario Config ========================
// Defines a what-if scenario the user can run against baseline totals.
const scenario = {
  title: "Cut flights by 25% + move cloud to Oregon?",
  steps: [
    {
      action: "scale_category_spend",
      category: "Travel-Air",
      scale_factor: 0.75,
    },
    {
      action: "region_override_for_category",
      category: "Cloud/IT",
      from_region: "ANY",
      to_region: "US-OR",
    },
  ],
};

// ======================== Component: DemoClient ==========================
export default function DemoClient() {
  // ------------------------ UI + Data State -------------------------------
  // loading/genLoading -> button spinners; tx/ef/fx -> core datasets
  // after -> scenario result; error -> UI error banner; source -> data origin
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [tx, setTx] = useState<any[] | null>(null);
  const [ef, setEf] = useState<any[] | null>(null);
  const [fx, setFx] = useState<any[] | null>(null);
  const [after, setAfter] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"sample" | "generated" | null>(null);

  // ------------------------ Animation State -------------------------------
  // revealing -> brief skeleton for baseline; showScenarioCols -> toggle scenario cols
  // revealingScenario -> skeleton state while scenario numbers compute
  const [revealing, setRevealing] = useState(false);
  const [showScenarioCols, setShowScenarioCols] = useState(false);
  const [revealingScenario, setRevealingScenario] = useState(false);

  // ========================= Feature: Debug Logs ==========================
  // Logs key state changes to the console to help diagnose data flow issues.
  useEffect(() => {
    console.log("[STATE]", {
      loading,
      genLoading,
      revealing,
      source,
      txLen: tx?.length ?? 0,
      efLen: ef?.length ?? 0,
      fxLen: fx?.length ?? 0,
    });
  }, [loading, genLoading, revealing, source, tx, ef, fx]);

  // ================= Feature: Emission Footprints (client) ==================
  // We compute TWO sets of footprints so tiles don't show the same number:
  // 1) Scope 3 (upstream-only)
  // 2) Full value chain (S1 + S2 + S3)

  // Per-transaction Scope 3 (upstream) estimates
  const scope3Footprints = useMemo(() => {
    if (!Array.isArray(tx) || tx.length === 0) return [];
    return estimateMany(tx, { method: "scope3_upstream" });
  }, [tx]);

  // Sum of Scope 3 (upstream) in kg CO2e across all transactions
  const scope3Kg = useMemo(
    () => scope3Footprints.reduce((s, f) => s + (f.kg_co2e ?? 0), 0),
    [scope3Footprints]
  );

  // Per-transaction Full value chain (S1+S2+S3) estimates
  const fullChainFootprints = useMemo(() => {
    if (!Array.isArray(tx) || tx.length === 0) return [];
    return estimateMany(tx, { method: "scope3_full_value_chain" });
  }, [tx]);

  // Sum of Full value chain in kg CO2e across all transactions
  const fullChainKg = useMemo(
    () => fullChainFootprints.reduce((s, f) => s + (f.kg_co2e ?? 0), 0),
    [fullChainFootprints]
  );

  // ======================= Feature: Baseline Math =========================
  // If tx/ef/fx are all present, compute baselineTotals for the table + scenario.
  const base: Totals | null = useMemo(() => {
    if (!tx || !ef || !fx) return null;
    return baselineTotals(tx, ef, fx);
  }, [tx, ef, fx]);

  // Prefer baseline (S1+S2+S3) if available; otherwise fall back to Full value chain total
  const totalAllKg = useMemo(() => {
    const v = base?.totalKg ?? fullChainKg;
    console.log("[totalAllKg] base.totalKg vs fullChainKg", {
      baseTotalKg: base?.totalKg,
      fullChainKg,
      chosen: v,
    });
    return v;
  }, [base, fullChainKg]);

  // =================== Feature: Spend Total (from tx) =====================
  // Sums transaction amounts (in cents) -> USD; independent from baseline totals.
  const spendTotalUSD = useMemo(() => {
    if (!Array.isArray(tx) || tx.length === 0) {
      console.log("[spendTotalUSD] empty tx");
      return 0;
    }
    const total = tx.reduce((sum, t) => {
      const cents =
        typeof t.amount === "number"
          ? Math.abs(t.amount) // Stripe amounts are in cents; charges are negative
          : typeof t.merchant_amount === "number"
          ? Math.abs(t.merchant_amount)
          : 0;
      return sum + cents;
    }, 0);
    const usd = total / 100;
    console.log("[spendTotalUSD] txLen:", tx.length, "totalUSD:", usd);
    return usd;
  }, [tx]);

  // ==================== Action: Load Sample Data ==========================
  // Fetches static demo data (tx/ef/fx) and triggers a brief reveal animation.
  const loadSample = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadDemo();
      console.log("[loadSample] data keys:", Object.keys(data ?? {}));
      console.log(
        "[loadSample] sizes -> tx/ef/fx:",
        data?.tx?.length ?? 0,
        data?.ef?.length ?? 0,
        data?.fx?.length ?? 0
      );

      // Set datasets -> enable baselineTotals calculations
      setTx(data.tx);
      setEf(data.ef);
      setFx(data.fx);
      setSource("sample");

      // reset scenario view
      setAfter(null);
      setShowScenarioCols(false);
      setRevealingScenario(false);

      // 1s reveal for baseline tiles/table
      setRevealing(true);
      setTimeout(() => setRevealing(false), 1000);
    } catch (e: any) {
      console.error("[loadSample] error:", e);
      setError(e?.message || String(e));
      setTx(null);
      setEf(null);
      setFx(null);
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  // ============ Action: Generate Stripe Test Transactions =================
  // Calls /api/transactions/generate to create Stripe Issuing test txns.
  const generateTransactions = async () => {
    try {
      setGenLoading(true);
      setError(null);

      const res = await fetch("/api/transactions/generate", { method: "POST" });
      console.log("[generateTransactions] status:", res.status);

      const json = await res.json();
      console.log(
        "[generateTransactions] payload keys:",
        Object.keys(json ?? {})
      );

      if (!res.ok || !json.success) {
        console.error("[generateTransactions] error body:", json);
        throw new Error(json.error || "Failed to generate transactions");
      }

      console.log(
        "[generateTransactions] tx count:",
        json.data?.length ?? 0,
        "example:",
        json.data?.[0]
      );

      // Save generated transactions; factors (ef/fx) can be provided later if needed
      setTx(json.data || []);
      setSource("generated");

      // reset scenario view
      setAfter(null);
      setShowScenarioCols(false);
      setRevealingScenario(false);

      // quick reveal animation for consistency
      setRevealing(true);
      setTimeout(() => setRevealing(false), 800);
    } catch (e: any) {
      console.error("[generateTransactions] error:", e);
      setError(e?.message || String(e));
    } finally {
      setGenLoading(false);
    }
  };

  // ===================== Action: Run Scenario =============================
  // Applies the scenario to (tx, ef, fx) and shows scenario columns.
  const runScenario = () => {
    if (!tx || !ef || !fx) return;
    setShowScenarioCols(true);
    setRevealingScenario(true);

    const res = applyScenario(tx, ef, fx, scenario as any);
    setTimeout(() => {
      setAfter(res);
      setRevealingScenario(false);
    }, 1000);
  };

  // ================== Feature: Top Categories Table =======================
  // Derives the top categories by kg CO2e from baselineTotals for display.
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

  // ================== Pie: Scope 3 vs Total (two-slice) ==================
  const scopeShareData = useMemo(() => {
    const total = Number(totalAllKg) || 0;
    const s3 = Number(scope3Kg) || 0;
    const s1s2 = Math.max(total - s3, 0); // guard against negatives
    return [
      ["Component", "kg CO₂e"],
      ["Scope 3", Math.round(s3)],
      ["Scope 1+2", Math.round(s1s2)],
    ];
  }, [totalAllKg, scope3Kg]);

  const scopeShareOptions = useMemo(
    () => ({
      title: "Scope 3 share of total emissions",
      legend: { position: "right" },
      chartArea: { width: "85%", height: "80%" },
      pieHole: 0.35, // donut style; set to 0 for full pie
      slices: {
        0: { color: "#16a34a" }, // Scope 3
        1: { color: "#94a3b8" }, // Scope 1+2
      },
      tooltip: { trigger: "focus" },
    }),
    []
  );

  // ============================= Render ===================================
  return (
    <div className="space-y-6">
      {/* ----------------------- Controls: Buttons ---------------------------- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={loadSample}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          disabled={loading || genLoading}
        >
          {loading ? "Loading…" : "Use sample data"}
        </button>

        <button
          onClick={generateTransactions}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
          disabled={loading || genLoading}
        >
          {genLoading ? "Generating…" : "Generate 30 transactions"}
        </button>

        <button
          onClick={runScenario}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60"
          disabled={!base || revealing || genLoading || loading}
        >
          {scenario.title}
        </button>
      </div>

      {/* ------------------- Panel: Credibility / Debug ---------------------- */}
      <div className="text-xs p-3 rounded-xl border border-zinc-700/40">
        <div>
          tx: {tx?.length ?? 0} • ef: {ef?.length ?? 0} • fx: {fx?.length ?? 0}
          {source ? (
            <span className="ml-2 opacity-70">
              source: <span className="uppercase">{source}</span>
            </span>
          ) : null}
        </div>
        {(loading || genLoading) && (
          <div className="opacity-70 mt-1">Working…</div>
        )}
        {error && <div className="text-red-500 mt-1">Error: {error}</div>}
        {tx && tx.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">
              See all generated transactions (JSON)
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto">
              {JSON.stringify(tx, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* --------------------------- Tiles ----------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Tile: Total Spend (USD) computed from tx only */}
        <Tile
          title="Baseline: total spend (USD)"
          value={
            loading || genLoading || revealing
              ? "—"
              : Array.isArray(tx) && tx.length > 0
              ? `$${spendTotalUSD.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : "$0"
          }
          loading={loading || genLoading || revealing}
        />

        {/* Tile: Total Scope 3 (kg CO2e) computed from estimateMany */}
        <Tile
          title="Total Scope 3 (kg CO₂e)"
          value={!tx ? "—" : `${Math.round(scope3Kg).toLocaleString()} kg CO₂e`}
          loading={loading || genLoading || revealing}
        />

        {/* Tile: Total Emissions (S1+S2+S3) */}
        <Tile
          title="Total emissions (S1+S2+S3)"
          value={
            loading || genLoading || revealing
              ? "—"
              : Number.isFinite(totalAllKg)
              ? `${Math.round(totalAllKg).toLocaleString()} kg CO₂e`
              : "—"
          }
          loading={loading || genLoading || revealing}
        />

        {showScenarioCols && (
          <Tile
            title="Scenario delta"
            value={
              after
                ? `↓ ${((1 - after.totalKg / base!.totalKg) * 100).toFixed(
                    1
                  )}% decrease`
                : "—"
            }
            accent={!!after}
            loading={revealingScenario}
            valueClassName={after ? "text-emerald-600" : ""}
          />
        )}
      </div>

      {/* ---------------- Pie: Scope 3 vs Total (two-slice) ---------------- */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="text-sm font-medium mb-2">
          Scope 3 vs Total emissions
        </div>
        {Number(totalAllKg) > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <Chart
              chartType="PieChart"
              data={scopeShareData}
              options={scopeShareOptions}
              width="100%"
              height="100%"
            />
          </div>
        ) : (
          <div className="text-xs opacity-70">No emission data yet.</div>
        )}
      </div>

      {/* ------------------------ Table: Top Categories ----------------------- */}
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
            {loading || genLoading || revealing
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className="border-t border-zinc-200 dark:border-zinc-800 animate-pulse"
                  >
                    <Td>
                      <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </Td>
                    <Td className="text-right">
                      <div className="ml-auto h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </Td>
                    <Td className="text-right">
                      <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </Td>
                    <Td className="text-right">
                      <div className="ml-auto h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </Td>
                    {showScenarioCols && (
                      <>
                        <Td className="text-right">
                          <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                        </Td>
                        <Td className="text-right">
                          <div className="ml-auto h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
                        </Td>
                      </>
                    )}
                  </tr>
                ))
              : rows.map((r) => {
                  const afterKg = after?.byCat?.[r.category]?.kg as
                    | number
                    | undefined;
                  const hasAfter = typeof afterKg === "number";

                  const deltaRaw = hasAfter ? afterKg - r.kg : undefined;
                  const deltaRounded =
                    typeof deltaRaw === "number"
                      ? Math.round(deltaRaw)
                      : undefined;
                  const showDelta =
                    typeof deltaRounded === "number" && deltaRounded !== 0;

                  return (
                    <tr
                      key={r.category}
                      className="border-t border-zinc-200 dark:border-zinc-800"
                    >
                      <Td>{r.category}</Td>
                      <Td className="text-right">
                        ${Math.round(r.usd).toLocaleString()}
                      </Td>
                      <Td className="text-right">
                        {Math.round(r.kg).toLocaleString()}
                      </Td>
                      <Td className="text-right">{r.kg_perc.toFixed(1)}%</Td>

                      {showScenarioCols && (
                        <>
                          <Td className="text-right">
                            {revealingScenario ? (
                              <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            ) : hasAfter ? (
                              Math.round(afterKg!).toLocaleString()
                            ) : (
                              "\u00A0"
                            )}
                          </Td>
                          <Td
                            className={`text-right ${
                              !revealingScenario &&
                              showDelta &&
                              deltaRounded! < 0
                                ? "text-emerald-600"
                                : ""
                            } ${
                              !revealingScenario &&
                              showDelta &&
                              deltaRounded! > 0
                                ? "text-rose-500"
                                : ""
                            }`}
                          >
                            {revealingScenario ? (
                              <div className="ml-auto h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            ) : showDelta ? (
                              deltaRounded!.toLocaleString()
                            ) : (
                              "\u00A0"
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

      {/* --------------------------- Footer ---------------------------------- */}
      <p className="text-xs opacity-70">
        Greenline is a work in progress. More features and data sources coming
        soon.
      </p>
    </div>
  );
}

// ===================== Presentational Helpers =========================
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
        <div className={`text-xl font-semibold mt-1 ${valueClassName}`}>
          {value}
        </div>
      )}
    </div>
  );
}

// Table header cell with consistent spacing/weight
function Th({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) {
  return <th className={`px-4 py-2 font-medium ${className}`}>{children}</th>;
}

// Table data cell with consistent spacing
function Td({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}
