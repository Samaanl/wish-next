import { NextResponse } from "next/server";
import axios from "axios";

// Lemon Squeezy API configuration
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
const VARIANT_ID = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID || "";

export async function GET() {
  try {
    // Check if environment variables are properly set
    const environmentInfo = {
      api_key_exists: !!LEMON_SQUEEZY_API_KEY,
      api_key_length: LEMON_SQUEEZY_API_KEY ? LEMON_SQUEEZY_API_KEY.length : 0,
      store_id: LEMON_SQUEEZY_STORE_ID,
      store_id_valid:
        !!LEMON_SQUEEZY_STORE_ID &&
        !isNaN(parseInt(LEMON_SQUEEZY_STORE_ID || "")),
      variant_id: VARIANT_ID,
      variant_id_valid: !!VARIANT_ID && !isNaN(parseInt(VARIANT_ID)),
      mode: process.env.NODE_ENV,
    };

    // Return early if essential configuration is missing
    if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID || !VARIANT_ID) {
      return NextResponse.json({
        environment: environmentInfo,
        success: false,
        error: "Missing required configuration",
      });
    }

    // Test a direct checkout creation with Lemon Squeezy
    try {
      // Build a simple test checkout payload
      const checkoutPayload = {
        data: {
          type: "checkouts",
          attributes: {
            store_id: parseInt(LEMON_SQUEEZY_STORE_ID),
            variant_id: parseInt(VARIANT_ID),
            custom_price: null,
            checkout_data: {
              email: "test@example.com",
              custom: {
                user_id: "test-user",
                package_id: "basic",
                credits: "10",
              },
            },
            product_options: {
              redirect_url: `${
                process.env.NEXT_PUBLIC_URL || "https://localhost:3000"
              }/thank-you?session_id={checkout_session_id}`,
              receipt_thank_you_note: "Thank you for your purchase!",
            },
            test_mode: true,
          },
        },
      };

      console.log(
        "Testing checkout with payload:",
        JSON.stringify(checkoutPayload, null, 2)
      );

      const response = await axios.post(
        "https://api.lemonsqueezy.com/v1/checkouts",
        checkoutPayload,
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        }
      );

      console.log("Successfully created checkout");

      return NextResponse.json({
        environment: environmentInfo,
        success: true,
        checkout_url: response.data?.data?.attributes?.url,
        response: {
          status: response.status,
          checkout_id: response.data?.data?.id,
          url_exists: !!response.data?.data?.attributes?.url,
        },
      });
    } catch (error: any) {
      console.error("Error creating test checkout:", error.message);

      // Extract detailed error info
      let errorDetails = {
        message: error.message,
        response: null as any,
      };

      if (error.response) {
        errorDetails.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        };
      }

      return NextResponse.json(
        {
          environment: environmentInfo,
          success: false,
          error: "Failed to create test checkout",
          details: errorDetails,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
