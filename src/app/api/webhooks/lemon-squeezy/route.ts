import { NextRequest, NextResponse } from "next/server";
import { recordPurchase, refundPurchase } from "@/utils/creditService";
import crypto from "crypto";
import { databases, DATABASE_ID } from "@/utils/appwrite";
import { Query } from "appwrite";

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

    console.log("Processing webhook event:", eventName); // Extract common data
    const customData = data?.meta?.custom_data;
    const total = data?.attributes?.total || 0;
    const orderId = data?.id;
    const orderAttributes = data?.attributes;

    // Enhanced logging for debugging
    console.log("Webhook payload analysis:", {
      eventName,
      orderId,
      customData,
      total,
      orderAttributes: orderAttributes ? Object.keys(orderAttributes) : null,
    });

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
        orderId,
      });
      return NextResponse.json(
        { error: "Missing required custom data" },
        { status: 400 }
      );
    }

    switch (eventName) {
      case "order_created":
        // Extract the custom_data from the webhook payload
        const attributes = data.attributes;
        const customData = attributes.custom_data || {};
        const total = attributes.total || 0;
        
        // CRITICAL FIX: Use a consistent transaction ID format
        // If we have a session ID in custom data, use the same format as thank-you page
        const sessionId = customData.session_id || "";
        const packageId = customData.package_id || "";
        
        // If we have both session_id and package_id, use the same format as the thank-you page
        // Otherwise fall back to the order ID
        const orderId = (sessionId && packageId) 
          ? `tx_${sessionId}_${packageId}` 
          : (data.id || `order_${Date.now()}`);

        console.log("Processing order_created webhook with data:", {
          orderId,
          customData,
          total,
          isConsistentFormat: !!(sessionId && packageId)
        });
        
        // Add extra logging to track duplicate prevention
        console.log("DUPLICATE CHECK: Using transaction ID:", orderId);

        if (!customData.user_id || !customData.package_id) {
          console.error("Missing required custom_data in webhook");
          return NextResponse.json(
            { error: "Missing required custom_data" },
            { status: 400 }
          );
        }

        // CRITICAL FIX: Check if this order has already been processed
        try {
          // Use the databases module to check for existing purchase records
          const existingPurchases = await databases.listDocuments(
            DATABASE_ID,
            "purchases", // Use the purchases collection
            [Query.equal("$id", orderId)]
          );

          if (existingPurchases.total > 0) {
            console.log("DUPLICATE ORDER DETECTED - Order already processed:", orderId);
            return NextResponse.json({
              success: true,
              duplicate: true,
              message: "Order already processed",
            });
          }
        } catch (error) {
          // Log the error but continue processing
          console.error("Error checking for duplicate order:", error);
        }

        // Determine the correct credit amount based on the package ID
        let creditsToAdd = 0;
        if (customData.package_id === "basic") {
          creditsToAdd = 10; // $1 plan gets exactly 10 credits
        } else if (customData.package_id === "premium") {
          creditsToAdd = 100; // $5 plan gets exactly 100 credits
        } else {
          // Fallback to the requested credits only if it's a valid number
          creditsToAdd = parseInt(customData.credits) || 0;
        }

        console.log(
          `Enforcing exact credit amount: ${creditsToAdd} for package ${customData.package_id}`
        );

        // Record the purchase with the order ID to prevent duplicates
        try {
          // First create a purchase record to prevent duplicate processing
          await databases.createDocument(
            DATABASE_ID,
            "purchases",
            orderId,
            {
              user_id: customData.user_id,
              package_id: customData.package_id,
              amount: Math.round(total),
              credits: creditsToAdd,
              timestamp: new Date().toISOString(),
              source: "webhook",
            }
          );

          // Then add the credits
          await recordPurchase(
            customData.user_id,
            customData.package_id,
            total,
            creditsToAdd // Use the enforced credit amount
          );

          return NextResponse.json({ success: true });
        } catch (error) {
          // If there's a document conflict (409), it means this order was already processed
          if (error && typeof error === "object" && "code" in error && error.code === 409) {
            console.log("Order already processed (document conflict):", orderId);
            return NextResponse.json({
              success: true,
              duplicate: true,
              message: "Order already processed",
            });
          } else {
            throw error; // Re-throw unexpected errors
          }
        }
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
