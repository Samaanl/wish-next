import { NextRequest, NextResponse } from "next/server";
import { addCredits, recordPurchase } from "@/utils/creditService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Processing purchase manually:", body);

    const { userId, packageId, amount, credits } = body;

    if (!userId || !packageId || !amount || !credits) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is a numeric string and convert it
    const creditsNumber =
      typeof credits === "string" ? parseInt(credits, 10) : credits;
    const amountNumber =
      typeof amount === "string" ? parseFloat(amount) : amount;

    try {
      // Record the purchase in the purchases collection
      const newBalance = await recordPurchase(
        userId,
        packageId,
        amountNumber,
        creditsNumber
      );

      return NextResponse.json({
        success: true,
        newBalance,
        message: "Credits added successfully",
      });
    } catch (error) {
      console.error("Error processing purchase:", error);

      // Fallback: just add the credits directly if recordPurchase failed
      try {
        const newBalance = await addCredits(userId, creditsNumber);
        return NextResponse.json({
          success: true,
          newBalance,
          message: "Credits added directly as fallback",
          wasFailover: true,
        });
      } catch (fallbackError) {
        console.error("Both purchase methods failed:", fallbackError);
        return NextResponse.json(
          { error: "Failed to process purchase" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in process-purchase API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
