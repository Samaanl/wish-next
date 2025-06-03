import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId =
      searchParams.get("variantId") ||
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID;

    if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID || !variantId) {
      return NextResponse.json(
        {
          error: "Missing configuration",
          details: {
            api_key_exists: !!LEMON_SQUEEZY_API_KEY,
            store_id_exists: !!LEMON_SQUEEZY_STORE_ID,
            variant_id_exists: !!variantId,
          },
        },
        { status: 500 }
      );
    }

    // Get variant details to check PayPal compatibility
    const variantResponse = await axios.get(
      `https://api.lemonsqueezy.com/v1/variants/${variantId}`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    // Get product details
    const productId =
      variantResponse.data?.data?.relationships?.product?.data?.id;
    let productDetails = null;

    if (productId) {
      const productResponse = await axios.get(
        `https://api.lemonsqueezy.com/v1/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );
      productDetails = productResponse.data?.data;
    }

    // Create a test checkout specifically for PayPal debugging
    const testCheckoutPayload = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: null,
          checkout_data: {
            email: "test@example.com",
            custom: {
              user_id: "test_paypal_debug",
              package_id: "basic",
              credits: "10",
            },
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
            desc: true,
            discount: true,
            dark: false,
            subscription_preview: true,
            button_color: "#7C3AED",
          },
          product_options: {
            name: "Test PayPal Checkout - Wish Generator Credits",
            description: "PayPal compatibility test for Wish Generator",
            redirect_url: `${
              process.env.NEXT_PUBLIC_URL || "https://wish-next.vercel.app"
            }/thank-you?session_id={checkout_session_id}&package_id=basic&test=paypal`,
            receipt_button_text: "Return to App",
            receipt_link_url: `${
              process.env.NEXT_PUBLIC_URL || "https://wish-next.vercel.app"
            }/`,
            receipt_thank_you_note: "PayPal test completed successfully!",
            enabled_variants: [variantId],
          },
          expires_at: null,
          preview: false,
          test_mode: process.env.NODE_ENV === "development",
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: LEMON_SQUEEZY_STORE_ID,
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

    const checkoutResponse = await axios.post(
      "https://api.lemonsqueezy.com/v1/checkouts",
      testCheckoutPayload,
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
      variantDetails: variantResponse.data?.data,
      productDetails,
      checkoutUrl: checkoutResponse.data?.data?.attributes?.url,
      paypalCompatibilityCheck: {
        variantHasPrice: !!variantResponse.data?.data?.attributes?.price,
        productHasName: !!productDetails?.attributes?.name,
        productHasDescription: !!productDetails?.attributes?.description,
        variantStatus: variantResponse.data?.data?.attributes?.status,
        productStatus: productDetails?.attributes?.status,
      },
      testCheckoutPayload,
    });
  } catch (error: any) {
    console.error("PayPal debug error:", error);
    return NextResponse.json(
      {
        error: "Failed to debug PayPal configuration",
        details: error.response?.data || error.message,
        status: error.response?.status,
      },
      { status: 500 }
    );
  }
}
