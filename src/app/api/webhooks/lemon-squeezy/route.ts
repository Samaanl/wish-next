import { NextRequest, NextResponse } from "next/server";
import { recordPurchase } from "@/utils/creditService";
import crypto from "crypto";

// Webhook secret from Lemon Squeezy dashboard
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

// Verify webhook signature
function verifySignature(payload: unknown, signature: string): boolean {
  try {
    if (!WEBHOOK_SECRET) {
      console.warn(
        "No webhook secret configured, skipping signature verification"
      );
      return true; // For development only - remove in production
    }

    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = hmac.update(JSON.stringify(payload)).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(digest, "hex")
    );
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("X-Signature") || "";
    const body = await request.json();

    // Log the webhook data for debugging (remove in production)
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process different webhook event types
    const { meta, data } = body;
    const eventName = meta?.event_name;

    if (eventName === "order_created") {
      // Extract data from the webhook
      const customData = data?.meta?.custom_data;

      if (
        !customData ||
        !customData.user_id ||
        !customData.package_id ||
        !customData.credits
      ) {
        console.error("Missing required custom data", customData);
        return NextResponse.json(
          { error: "Missing required custom data" },
          { status: 400 }
        );
      }

      // Get the total amount from the order
      const total = data?.attributes?.total || 0;

      // Record the purchase and add credits
      await recordPurchase(
        customData.user_id,
        customData.package_id,
        total,
        customData.credits
      );

      return NextResponse.json({ success: true });
    }

    // For other types of events
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
