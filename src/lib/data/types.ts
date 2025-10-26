export type Tx = {
    date: string;           // "YYYY-MM-DD"
    amount: number;
    currency: 'USD'|'EUR'|'GBP'|'CAD'|'JPY';
    category: string;       // e.g., "Cloud/IT"
    merchant: string;
    city: string;
    region: string;         // e.g., "CA", "TX", "ON", "ENG", "BE"
    country: string;        // "USA" | "Canada" | "UK" | "Germany"
  };
  
  export type EmissionFactor = {
    category: string;
    region: string;         // "ANY" or e.g. "US-CA"
    kgCO2e_per_USD: number;
    note?: string;
  };
  
  export type FxRate = { currency: string; usd_per_unit: number; };