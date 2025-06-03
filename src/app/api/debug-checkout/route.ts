import { NextResponse } from "next/server";
import axios from "axios";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

export async function GET() {
  try {
    // Create a debug checkout with minimal data
    const variantId =
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID || "813864";

    const storeId = LEMON_SQUEEZY_STORE_ID || "182277";

    const checkoutPayload = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: null,
          checkout_data: {
            email: "test@example.com", // Test email
            custom: {
              user_id: "test_user_id",
              package_id: "basic",
              credits: "10",
            },
          },
          product_options: {
            redirect_url: `${
              process.env.NEXT_PUBLIC_URL || "https://messagecreate.pro"
            }/thank-you?session_id={checkout_session_id}`,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    try {
      console.log("Debugs checkout payload:", JSON.stringify(checkoutPayload));

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

      return NextResponse.json({
        success: true,
        checkout_url: response.data?.data?.attributes?.url,
        response_data: response.data,
      });
    } catch (error: unknown) {
      const err = error as Error & {
        response?: {
          data?: unknown;
          status?: number;
        };
      };

      console.error(
        "Debug checkout error:",
        err?.response?.data || err.message
      );

      return NextResponse.json({
        success: false,
        error: err.message,
        status: err?.response?.status,
        details: err?.response?.data,
        request_payload: checkoutPayload,
        api_key_length: LEMON_SQUEEZY_API_KEY?.length || 0,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;

    return NextResponse.json(
      {
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
