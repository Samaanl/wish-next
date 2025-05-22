import { NextRequest, NextResponse } from "next/server";
import { recordPurchase, refundPurchase } from "@/utils/creditService";
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
      return true; // For development only -> remove in production
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
    console.log("Signature:", signature);
    console.log("Webhook secret configured:", !!WEBHOOK_SECRET);

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error("Invalid webhook signature", {
        receivedSignature: signature,
        hasSecret: !!WEBHOOK_SECRET,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process different webhook event types
    const { meta, data } = body;
    const eventName = meta?.event_name;

    console.log("Processing webhook event:", eventName);

    // Extract common data
    const customData = data?.meta?.custom_data;
    const total = data?.attributes?.total || 0;

    // Validate custom data
    if (
      !customData ||
      !customData.user_id ||
      !customData.package_id ||
      !customData.credits
    ) {
      console.error("Missing required custom data", {
        customData,
        eventName,
        data,
      });
      return NextResponse.json(
        { error: "Missing required custom data" },
        { status: 400 }
      );
    }

    switch (eventName) {
      case "order_created":
        console.log("Processing new purchase:", {
          userId: customData.user_id,
          packageId: customData.package_id,
          credits: customData.credits,
          total,
        });

        await recordPurchase(
          customData.user_id,
          customData.package_id,
          total,
          customData.credits
        );
        break;

      case "order_refunded":
        console.log("Processing refund:", {
          userId: customData.user_id,
          packageId: customData.package_id,
          credits: customData.credits,
          total,
        });

        await refundPurchase(
          customData.user_id,
          customData.package_id,
          total,
          customData.credits
        );
        break;

      case "subscription_payment_failed":
        console.log("Subscription payment failed:", {
          userId: customData.user_id,
          packageId: customData.package_id,
        });
        // Handle failed payment (e.g., notify user)
        break;

      case "subscription_payment_success":
        console.log("Subscription payment successful:", {
          userId: customData.user_id,
          packageId: customData.package_id,
          credits: customData.credits,
        });
        // Handle successful subscription payment
        break;

      default:
        console.log("Unhandled webhook event:", eventName);
        return NextResponse.json({ received: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Add a GET endpoint for webhook testing
export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint is active",
    hasSecret: !!WEBHOOK_SECRET,
    supportedEvents: [
      "order_created",
      "order_refunded",
      "subscription_payment_failed",
      "subscription_payment_success",
    ],
  });
}
