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

// Check if payment was already processed in our database
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

// Record payment in our database
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
      `payment_${lemonSqueezyOrderId}`,
      {
        user_id: userId,
        package_id: packageId,
        credits: credits,
        amount: Math.round(amount),
        timestamp: new Date().toISOString(),
        lemon_squeezy_order_id: lemonSqueezyOrderId,
        processed_via: "payment_recovery",
      }
    );
    console.log(`Payment recorded in database: ${lemonSqueezyOrderId}`);
  } catch (error) {
    console.error("Error recording payment in database:", error);
    // Don't throw - this is not critical for credit addition
  }
}

// Get recent orders for a user from Lemon Squeezy
async function getRecentOrdersForUser(
  userEmail: string,
  userId: string
): Promise<LemonSqueezyOrder[]> {
  if (!LEMON_SQUEEZY_API_KEY) {
    throw new Error("Lemon Squeezy API key not configured");
  }

  try {
    // Get orders from the last 24 hours (more recent focus)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateFilter = yesterday.toISOString().split("T")[0];

    console.log(
      `🔍 Searching Lemon Squeezy orders for email: ${userEmail}, userId: ${userId}`
    );

    // First try to get orders by email
    const emailResponse = await axios.get(
      `https://api.lemonsqueezy.com/v1/orders?filter[user_email]=${encodeURIComponent(
        userEmail
      )}&filter[created_at]=${dateFilter}..`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const emailOrders = emailResponse.data?.data || [];
    console.log(`Found ${emailOrders.length} orders by email`);

    // Also try to get all recent orders and filter by custom data
    const allOrdersResponse = await axios.get(
      `https://api.lemonsqueezy.com/v1/orders?filter[created_at]=${dateFilter}..&sort=-created_at`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const allOrders = allOrdersResponse.data?.data || [];
    console.log(`Found ${allOrders.length} total recent orders`);

    // Filter orders by user ID in custom data
    const userOrders = allOrders.filter((order: LemonSqueezyOrder) => {
      const customData = order.attributes.custom_data;
      return (
        customData?.user_id === userId ||
        order.attributes.user_email === userEmail
      );
    });

    console.log(`Found ${userOrders.length} orders matching user criteria`);

    // Combine and deduplicate
    const allUserOrders = [...emailOrders, ...userOrders];
    const uniqueOrders = allUserOrders.filter(
      (order, index, self) => index === self.findIndex((o) => o.id === order.id)
    );

    console.log(`Returning ${uniqueOrders.length} unique orders for user`);
    return uniqueOrders;
  } catch (error) {
    console.error("Error fetching orders from Lemon Squeezy:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Checking payment status for user: ${userId} (${email})`);
    console.log(`🔑 Lemon Squeezy API Key exists: ${!!LEMON_SQUEEZY_API_KEY}`);

    // Get recent orders for this user from Lemon Squeezy
    const orders = await getRecentOrdersForUser(email, userId);

    console.log(`📊 Found ${orders.length} total orders for user`);
    
    if (orders.length === 0) {
      console.log("❌ No recent orders found");
      return NextResponse.json({
        paymentFound: false,
        message: "No recent orders found",
      });
    }

    // Log all orders for debugging
    orders.forEach((order, index) => {
      console.log(`📋 Order ${index + 1}:`, {
        id: order.id,
        status: order.attributes.status,
        email: order.attributes.user_email,
        total: order.attributes.total,
        customData: order.attributes.custom_data,
        createdAt: order.attributes.created_at
      });
    });

    // Process each paid order
    for (const order of orders) {
      console.log(`🔍 Processing order ${order.id} with status: ${order.attributes.status}`);
      
      // Only process paid orders
      if (order.attributes.status !== "paid") {
        console.log(`⏭️ Skipping order ${order.id} - status is ${order.attributes.status}, not 'paid'`);
        continue;
      }

      const customData = order.attributes.custom_data;
      if (!customData?.user_id || customData.user_id !== userId) {
        continue; // Skip orders not for this user
      }

      const orderId = order.id;
      const alreadyProcessed = await checkPaymentProcessed(userId, orderId);

      if (alreadyProcessed) {
        console.log(`Order ${orderId} already processed`);
        return NextResponse.json({
          paymentFound: true,
          alreadyProcessed: true,
          message: "Payment already processed",
        });
      }

      // Process this payment
      const packageId = customData.package_id || "basic";
      const credits = parseInt(String(customData.credits)) || 10;
      const amount = order.attributes.total / 100; // Convert from cents

      console.log(
        `Processing order ${orderId}: ${credits} credits for user ${userId}`
      );

      try {
        // Add credits to user account
        await addCredits(userId, credits);

        // Record the purchase in our database
        await recordPaymentInDatabase(
          userId,
          packageId,
          credits,
          amount,
          orderId
        );

        console.log(
          `✅ Successfully processed payment: ${credits} credits added`
        );

        return NextResponse.json({
          paymentFound: true,
          creditsAdded: true,
          credits: credits,
          amount: amount,
          orderId: orderId,
          message: "Payment processed successfully",
        });
      } catch (error) {
        console.error("Error processing payment:", error);
        return NextResponse.json(
          { error: "Failed to process payment" },
          { status: 500 }
        );
      }
    }

    // No unprocessed payments found
    return NextResponse.json({
      paymentFound: false,
      message: "No unprocessed payments found",
    });
  } catch (error) {
    console.error("Error in payment status check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
