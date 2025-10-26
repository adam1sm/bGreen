// src/lib/data/loaders.ts
import Papa from 'papaparse';

async function fetchTextOrThrow(path: string) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} (${res.status})`);
  }
  return res.text();
}

function parseCSV<T>(text: string): T[] {
  const { data, errors, meta } = Papa.parse<T>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (errors?.length) {
    console.error('PapaParse errors:', errors.slice(0, 3));
  }
  // quick peek at types
  if ((data as any[]).length) {
    const sample = data[0] as any;
    const types = Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, typeof v]));
    console.log('CSV sample row:', sample);
    console.log('CSV field types:', types);
  }
  return data as T[];
}

export const loadDemo = async () => {
  console.log('Loading demo CSVs from /public/data ...');
  const [txText, efText, fxText] = await Promise.all([
    fetchTextOrThrow('/data/transactions_demo.csv'),
    fetchTextOrThrow('/data/emission_factors_demo.csv'),
    fetchTextOrThrow('/data/fx_table_demo.csv'),
  ]);
  const tx = parseCSV<any>(txText);
  const ef = parseCSV<any>(efText);
  const fx = parseCSV<any>(fxText);
  console.log('Counts -> tx:', tx.length, 'ef:', ef.length, 'fx:', fx.length);
  return { tx, ef, fx };
};