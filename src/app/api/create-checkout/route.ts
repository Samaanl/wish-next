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
      // Make sure any credits value is converted to a string
      const credits = custom?.credits ? String(custom.credits) : "0";
      const originalPackageId = custom?.package_id || "basic";
      const checkoutPayload = {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId,
                package_id: originalPackageId,
                credits: credits,
              },
            },
            product_options: {
              redirect_url: `${
                process.env.NEXT_PUBLIC_URL || "https://messagecreate.pro"
              }/thank-you?session_id={checkout_session_id}&package_id=${originalPackageId}`,
            },
            expires_at: null,
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
