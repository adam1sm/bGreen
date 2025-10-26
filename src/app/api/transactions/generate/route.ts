import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";


export async function POST() {
  try {
    const txn = await stripe.testHelpers.issuing.transactions.create({
      amount: Math.floor(Math.random() * 5000) + 500, // $5–$50
      currency: "usd",
      merchant_data: {
        name: "Test Merchant",
        category: "retail",
        merchant_category_code: "5411",
        city: "Columbus",
        country: "US",
      },
    });

    return NextResponse.json({ success: true, data: txn });
  } catch (error: any) {
    console.error("Error creating test transaction:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
