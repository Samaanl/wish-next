import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/utils/appwrite";
import { addCredits } from "@/utils/creditService";
import { Query } from "appwrite";
import axios from "axios";

const PURCHASES_COLLECTION_ID = "purchases";
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

interface LemonSqueezyOrder {
  id: string;
  attributes: {
    status: string;
    total: number;
    created_at: string;
    user_email: string;
    custom_data?: {
      user_id?: string;
      package_id?: string;
      credits?: string | number;
    };
  };
}

// Check if payment was processed in our database
async function checkPaymentProcessed(
  userId: string,
  lemonSqueezyOrderId: string
): Promise<boolean> {
  try {
    const purchases = await databases.listDocuments(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      [
        Query.equal("user_id", userId),
        Query.contains("$id", lemonSqueezyOrderId),
        Query.limit(1),
      ]
    );

    return purchases.documents.length > 0;
  } catch (error) {
    console.error("Error checking payment processed:", error);
    return false;
  }
}

// Record purchase in our database
async function recordPaymentInDatabase(
  userId: string,
  packageId: string,
  credits: number,
  amount: number,
  lemonSqueezyOrderId: string
) {
  try {
    await databases.createDocument(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      `payment_${lemonSqueezyOrderId}`, // Prefix to avoid ID conflicts
      {
        user_id: userId,
        package_id: packageId,
        credits: credits,
        amount: Math.round(amount),
        timestamp: new Date().toISOString(),
        lemon_squeezy_order_id: lemonSqueezyOrderId,
        processed_via: "payment_verification",
      }
    );
    console.log(`Payment recorded in database: ${lemonSqueezyOrderId}`);
  } catch (error) {
    console.error("Error recording payment in database:", error);
    // Don't throw - this is not critical for credit addition
  }
}

// Verify payment status with Lemon Squeezy API
async function verifyPaymentWithLemonSqueezy(
  sessionId: string
): Promise<LemonSqueezyOrder | null> {
  if (!LEMON_SQUEEZY_API_KEY) {
    throw new Error("Lemon Squeezy API key not configured");
  }

  try {
    // First try to get the checkout session to find the order
    const checkoutResponse = await axios.get(
      `https://api.lemonsqueezy.com/v1/checkouts/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const orderId = checkoutResponse.data?.data?.attributes?.order_id;
    if (!orderId) {
      console.log("No order ID found for checkout session:", sessionId);
      return null;
    }

    // Get the order details
    const orderResponse = await axios.get(
      `https://api.lemonsqueezy.com/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    return orderResponse.data?.data || null;
  } catch (error) {
    console.error("Error verifying payment with Lemon Squeezy:", error);
    return null;
  }
}

/**
 * This endpoint verifies payment status directly with Lemon Squeezy
 * and processes credits if the payment was successful but not yet processed.
 * This serves as a fallback for when webhooks fail or users navigate away.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, packageId } = body;

    console.log("🔍 Payment verification request:", {
      sessionId,
      userId,
      packageId,
    });

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify payment with Lemon Squeezy
    const order = await verifyPaymentWithLemonSqueezy(sessionId);

    if (!order) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment not found or not completed",
        },
        { status: 404 }
      );
    }

    // Check if payment is completed
    if (order.attributes.status !== "paid") {
      return NextResponse.json(
        {
          verified: false,
          status: order.attributes.status,
          error: "Payment not completed",
        },
        { status: 400 }
      );
    }

    // Extract user info from order
    const customData = order.attributes.custom_data;
    const orderUserId = userId || customData?.user_id;
    const orderPackageId = packageId || customData?.package_id || "basic";
    const orderCredits =
      typeof customData?.credits === "string"
        ? parseInt(customData.credits, 10)
        : customData?.credits || 10;
    const orderAmount = order.attributes.total;

    if (!orderUserId) {
      return NextResponse.json(
        { error: "User ID not found in payment data" },
        { status: 400 }
      );
    }

    // Check if this payment was already processed
    const alreadyProcessed = await checkPaymentProcessed(orderUserId, order.id);
    if (alreadyProcessed) {
      console.log("Payment already processed:", order.id);
      return NextResponse.json({
        verified: true,
        alreadyProcessed: true,
        message: "Payment was already processed",
      });
    }

    // Add credits to user account
    try {
      const newBalance = await addCredits(orderUserId, orderCredits);

      // Record the purchase in our database
      await recordPaymentInDatabase(
        orderUserId,
        orderPackageId,
        orderCredits,
        orderAmount,
        order.id
      );

      console.log(
        `✅ Payment verified and processed: ${order.id}, User: ${orderUserId}, Credits: ${orderCredits}`
      );

      return NextResponse.json({
        verified: true,
        processed: true,
        orderId: order.id,
        credits: orderCredits,
        newBalance,
        message: "Payment verified and credits added successfully",
      });
    } catch (error) {
      console.error("Error processing verified payment:", error);
      return NextResponse.json(
        {
          verified: true,
          processed: false,
          error: "Payment verified but failed to add credits",
          orderId: order.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in payment verification:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// GET endpoint to check recent unprocessed payments for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const hoursBack = parseInt(searchParams.get("hoursBack") || "24", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!LEMON_SQUEEZY_API_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    // Calculate timestamp for filtering recent orders
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    const cutoffISO = cutoffTime.toISOString();

    try {
      // Get recent orders from Lemon Squeezy
      const response = await axios.get(
        `https://api.lemonsqueezy.com/v1/orders?filter[created_at]=${cutoffISO}&include=order-items`,
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const orders = response.data?.data || [];

      // Filter orders for this user and check which ones haven't been processed
      const userOrders = orders.filter((order: LemonSqueezyOrder) => {
        const customData = order.attributes.custom_data;
        return (
          customData?.user_id === userId && order.attributes.status === "paid"
        );
      });

      const unprocessedOrders = [];

      for (const order of userOrders) {
        const processed = await checkPaymentProcessed(userId, order.id);
        if (!processed) {
          unprocessedOrders.push({
            id: order.id,
            sessionId: order.id, // Can be used as session ID
            packageId: order.attributes.custom_data?.package_id || "basic",
            credits:
              typeof order.attributes.custom_data?.credits === "string"
                ? parseInt(order.attributes.custom_data.credits, 10)
                : order.attributes.custom_data?.credits || 10,
            amount: order.attributes.total,
            createdAt: order.attributes.created_at,
          });
        }
      }

      return NextResponse.json({
        unprocessedPayments: unprocessedOrders,
        totalFound: unprocessedOrders.length,
      });
    } catch (error) {
      console.error("Error fetching recent payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch recent payments" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET payment verification:", error);
    return NextResponse.json(
      { error: "Failed to check payments" },
      { status: 500 }
    );
  }
}
