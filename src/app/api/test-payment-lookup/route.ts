import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    if (!LEMON_SQUEEZY_API_KEY) {
      return NextResponse.json({ error: "Lemon Squeezy API key not configured" }, { status: 500 });
    }

    console.log(`🔍 Testing Lemon Squeezy API for email: ${email}`);

    // Get orders from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateFilter = yesterday.toISOString().split("T")[0];

    console.log(`📅 Searching orders from: ${dateFilter}`);

    const response = await axios.get(
      `https://api.lemonsqueezy.com/v1/orders?filter[user_email]=${encodeURIComponent(email)}&filter[created_at]=${dateFilter}..`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    console.log(`📊 Lemon Squeezy API Response:`, {
      status: response.status,
      dataLength: response.data?.data?.length || 0,
      orders: response.data?.data?.map((order: any) => ({
        id: order.id,
        status: order.attributes.status,
        email: order.attributes.user_email,
        total: order.attributes.total,
        customData: order.attributes.custom_data,
        createdAt: order.attributes.created_at
      }))
    });

    return NextResponse.json({
      success: true,
      ordersFound: response.data?.data?.length || 0,
      orders: response.data?.data || [],
      searchEmail: email,
      searchDate: dateFilter
    });

  } catch (error: any) {
    console.error("❌ Error testing Lemon Squeezy API:", error);
    return NextResponse.json({
      error: "Failed to fetch from Lemon Squeezy",
      details: error.response?.data || error.message,
      status: error.response?.status
    }, { status: 500 });
  }
}
