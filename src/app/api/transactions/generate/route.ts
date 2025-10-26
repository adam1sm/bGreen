import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Categories (Stripe will auto-assign merchant_category_code from these)
const CATEGORIES = [
  "grocery_stores_supermarkets",              // ~ MCC 5411
  "eating_places_restaurants",                // ~ MCC 5812
  "computer_software_stores",                 // ~ MCC 5734
  "electronics_stores",                       // ~ MCC 5732
  "miscellaneous_specialty_retail"            // ~ MCC 5999
] as const;

const N_TX = 5;

// simple concurrency helper
async function runWithConcurrency<T>(jobs: Array<() => Promise<T>>, limit = 3) {
  const results: T[] = new Array(jobs.length);
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      results[idx] = await jobs[idx]!();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}

export async function POST() {
  try {
    const CARD_ID = process.env.STRIPE_TEST_ISSUING_CARD_ID;
    if (!CARD_ID) {
      return NextResponse.json(
        { success: false, error: "Missing STRIPE_TEST_ISSUING_CARD_ID in env" },
        { status: 400 }
      );
    }

    // Build 5 jobs, one per category (shuffle if you want randomness)
    const plan = CATEGORIES.slice(0, N_TX);

    const jobs = plan.map((category) => async () => {
      const amount = Math.floor(Math.random() * 5000) + 500; // $5–$55
      // One-call force capture → directly creates an issuing.transaction
      const txn = await stripe.testHelpers.issuing.transactions.createForceCapture({
        amount,
        currency: "usd",
        card: CARD_ID,
        merchant_data: {
          name: `Demo ${category.replace(/_/g, " ")}`,
          city: "Columbus",
          country: "US",
          category, // ✅ valid enum; MCC auto-filled on the returned transaction
        },
      });
      // You can decorate for UI grouping if you want
      return { ...txn, simulated_category: category } as any;
    });

    const data = await runWithConcurrency(jobs, 3);

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("Batch generate error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}