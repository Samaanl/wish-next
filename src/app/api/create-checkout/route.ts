import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Lemon Squeezy API configuration
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

// Log environment variables status (without revealing the actual API key)
console.log("API key exists:", !!LEMON_SQUEEZY_API_KEY);
console.log("Store ID:", LEMON_SQUEEZY_STORE_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Raw request body:", JSON.stringify(body));

    const { packageId, userId, userEmail, custom } = body;
    console.log("Parsed data:", {
      packageId:
        typeof packageId === "string" ? packageId : "undefined/invalid",
      userId: typeof userId === "string" ? userId : "undefined/invalid",
      userEmail:
        typeof userEmail === "string" ? userEmail : "undefined/invalid",
      custom: custom ? "present" : "missing",
    });

    if (!packageId || !userId || !userEmail) {
      console.error("Missing required fields:", {
        packageId: !!packageId,
        userId: !!userId,
        userEmail: !!userEmail,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID) {
      console.error("Missing Lemon Squeezy configuration");
      return NextResponse.json(
        { error: "Payment service not properly configured" },
        { status: 500 }
      );
    }

    try {
      const response = await axios.post(
        "https://api.lemonsqueezy.com/v1/checkouts",
        {
          data: {
            type: "checkouts",
            attributes: {
              store_id: parseInt(LEMON_SQUEEZY_STORE_ID),
              variant_id: parseInt(packageId), // Convert to number
              custom_price: null, // Use the product's default price
              checkout_data: {
                email: userEmail,
                custom: {
                  user_id: userId,
                  package_id: custom?.package_id || packageId,
                  credits: custom?.credits || 0,
                },
              },
              product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_URL}/thank-you?session_id={checkout_session_id}`,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        }
      );

      // Return the checkout URL
      if (response.data?.data?.attributes?.url) {
        return NextResponse.json({ url: response.data.data.attributes.url });
      } else {
        console.error("Invalid response from Lemon Squeezy:", response.data);
        return NextResponse.json(
          { error: "Invalid response from payment provider" },
          { status: 500 }
        );
      }
    } catch (error: unknown) {
      console.error(
        "Error creating checkout:",
        error instanceof Error ? error.message : String(error)
      );
      if (error && typeof error === "object" && "response" in error) {
        console.error(
          "Response error:",
          (error as { response?: { data: unknown } }).response?.data
        );
      }
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
