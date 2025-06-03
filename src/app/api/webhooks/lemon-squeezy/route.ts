import { NextRequest, NextResponse } from "next/server";
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
    const orderId = data?.id;
    const orderAttributes = data?.attributes;
    const customData = orderAttributes?.custom_data || {};

    // Enhanced logging for debugging
    console.log("Webhook payload analysis:", {
      eventName,
      orderId,
      customData,
      orderAttributes: orderAttributes ? Object.keys(orderAttributes) : null,
    });

    switch (eventName) {
      case "order_created":
        try {
          // Extract the custom_data from the webhook payload
          const userId = customData.user_id;
          const packageId = customData.package_id;
          const amount = orderAttributes?.total || 0;

          console.log("Processing order for customer:", userId, "package:", packageId);

          if (!userId || !packageId) {
            console.error("Missing required custom_data in webhook");
            return NextResponse.json(
              { error: "Missing required custom data" },
              { status: 400 }
            );
          }
          
          // EMERGENCY FIX: Use consistent transaction ID format matching thank-you page
          const transactionId = `tx_${orderId}_${packageId}`;
          console.log("Using consistent transaction ID for webhook:", transactionId);
          
          // Call the Appwrite Cloud Function to process the purchase
          try {
            // Import Appwrite client and functions
            const { client, functions } = await import('@/utils/appwrite');
            
            // Call the cloud function to process the purchase
            const execution = await functions.createExecution(
              '683eaf99003799365f40', // Function ID for process-credits
              JSON.stringify({
                userId,
                packageId,
                amount,
                transactionId,
              }),
              false // Async execution
            );

            // Parse the response
            const result = JSON.parse(execution.responseBody || '{}');
            console.log("Webhook purchase processed via Cloud Function:", result);

            if (result.duplicate) {
              console.log("DUPLICATE WEBHOOK TRANSACTION DETECTED:", transactionId);
              return NextResponse.json({
                success: true,
                duplicate: true,
                message: "Credits were already added for this transaction",
              });
            }

            return NextResponse.json({
              success: true,
              newBalance: result.newBalance,
              message: "Credits added successfully via Cloud Function",
            });
          } catch (error) {
            console.error("Error processing webhook order via Cloud Function:", error);
            return NextResponse.json(
              {
                error: "Failed to process order",
                details: error instanceof Error ? error.message : "Unknown error",
              },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error("Error in webhook order_created handler:", error);
          return NextResponse.json(
            {
              error: "Failed to process webhook order",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
        break;

      case "order_refunded":
        console.log("Processing refund:", {
          userId: customData.user_id,
          packageId: customData.package_id,
        });
        // TODO: Implement refund handling with cloud function if needed
        return NextResponse.json({ success: true, message: "Refund processed" });

      case "subscription_payment_failed":
        console.log("Subscription payment failed:", {
          userId: customData.user_id,
          packageId: customData.package_id,
        });
        // Handle failed payment (e.g., notify user)
        return NextResponse.json({ success: true, message: "Payment failure noted" });

      case "subscription_payment_success":
        console.log("Subscription payment successful:", {
          userId: customData.user_id,
          packageId: customData.package_id,
        });
        // TODO: Handle successful subscription payment with cloud function if needed
        return NextResponse.json({ success: true, message: "Subscription payment noted" });

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
