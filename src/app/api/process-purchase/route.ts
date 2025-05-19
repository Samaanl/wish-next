import { NextRequest, NextResponse } from "next/server";
import { recordPurchase } from "@/utils/creditService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageId, amount, credits } = body;

    if (!userId || !packageId || !amount || !credits) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record the purchase and add credits to the user
    const newCreditBalance = await recordPurchase(
      userId,
      packageId,
      amount,
      credits
    );

    return NextResponse.json({ success: true, credits: newCreditBalance });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
