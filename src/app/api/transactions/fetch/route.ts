import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";

export async function GET() {
  try {
    const transactions = await stripe.issuing.transactions.list({ limit: 10 });
    const formatted = transactions.data.map((t) => ({
      id: t.id,
      amount: t.amount / 100,
      currency: t.currency.toUpperCase(),
      merchant: t.merchant_data?.name || "Unknown",
      mcc: t.merchant_data?.merchant_category_code,
      category: t.merchant_data?.category,
      created: new Date(t.created * 1000).toLocaleString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
