import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Lemon Squeezy API configuration
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

// Log environment variables status (without revealing the actual API key)
console.log("API key exists:", !!LEMON_SQUEEZY_API_KEY);
console.log("API key length:", LEMON_SQUEEZY_API_KEY?.length || 0);
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

    // Check if this is a guest user
    if (userId.startsWith("guest-")) {
      console.error("Guest user attempted to make a purchase:", userId);
      return NextResponse.json(
        {
          error:
            "Guest users cannot make purchases. Please sign up or log in to purchase credits.",
          isGuestUser: true,
        },
        { status: 403 }
      );
    }

    if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID) {
      console.error("Missing Lemon Squeezy configuration");
      return NextResponse.json(
        {
          error: "Payment service not properly configured",
          details: {
            api_key_exists: !!LEMON_SQUEEZY_API_KEY,
            store_id_exists: !!LEMON_SQUEEZY_STORE_ID,
          },
        },
        { status: 500 }
      );
    }
    try {
      // Make sure any tes credits value is converted to a string
      const credits = custom?.credits ? String(custom.credits) : "0";
      const originalPackageId = custom?.package_id || "basic";

      // First, validate the variant exists and is active
      console.log(`🔍 Validating variant ${packageId}...`);

      try {
        const variantResponse = await axios.get(
          `https://api.lemonsqueezy.com/v1/variants/${packageId}`,
          {
            headers: {
              Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
              Accept: "application/vnd.api+json",
            },
          }
        );

        const variantStatus = variantResponse.data?.data?.attributes?.status;
        if (variantStatus !== "published") {
          console.error(
            `Variant ${packageId} is not published. Status: ${variantStatus}`
          );
          return NextResponse.json(
            {
              error: "Product variant is not available for purchase",
              details: { variantStatus, variantId: packageId },
            },
            { status: 400 }
          );
        }

        console.log(`✅ Variant ${packageId} is valid and published`);
      } catch (variantError) {
        console.error("Variant validation failed:", variantError);
        return NextResponse.json(
          {
            error: "Invalid product variant",
            details: { variantId: packageId },
          },
          { status: 400 }
        );
      }

      const checkoutPayload = {
        data: {
          type: "checkouts",
          attributes: {
            custom_price: null, // Use the product's default price
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId,
                package_id: originalPackageId,
                credits: credits,
              },
            },
            checkout_options: {
              embed: false,
              media: false,
              logo: true,
              desc: true,
              discount: true,
              dark: false,
              subscription_preview: true,
              button_color: "#7C3AED",
            },
            product_options: {
              name: `Wish Generator Credits - ${originalPackageId.charAt(0).toUpperCase() + originalPackageId.slice(1)} Package`,
              description: `${credits} credits for the Wish Generator application`,
              redirect_url: `${
                process.env.NEXT_PUBLIC_URL || "https://wish-next.vercel.app"
              }/thank-you?session_id={checkout_session_id}&package_id=${originalPackageId}`,
              receipt_button_text: "Go to Dashboard",
              receipt_link_url: `${
                process.env.NEXT_PUBLIC_URL || "https://wish-next.vercel.app"
              }/`,
              receipt_thank_you_note:
                "Thank you for your purchase! Your credits have been added to your account.",
              enabled_variants: [packageId],
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
                id: packageId,
              },
            },
          },
        },
      };

      console.log(
        "Sending checkout request to Lemon Squeezy:",
        JSON.stringify(checkoutPayload)
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
        const errorResponse = (
          error as { response?: { data: unknown; status: number } }
        ).response;
        console.error("Response error data:", errorResponse?.data);

        // Return more detailed error information
        return NextResponse.json(
          {
            error: "Failed to create checkout session",
            status: errorResponse?.status,
            details: errorResponse?.data,
          },
          { status: 500 }
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
