import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

// Lemon Squeezy API configuration
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

export async function GET() {
  try {
    // Response object to collect diagnostic info
    interface DiagnosticsInterface {
      environment: {
        api_key_exists: boolean;
        api_key_length: number;
        store_id: string | undefined;
        store_id_valid: boolean;
        basic_variant_id: string | undefined;
        premium_variant_id: string | undefined;
        next_public_url: string | undefined;
      };
      lemon_squeezy_connection: {
        success: boolean;
        status?: number;
        store_name?: string;
        error?: string;
        details?: unknown;
      } | null;
      error: string | null;
    }

    const diagnostics: DiagnosticsInterface = {
      environment: {
        api_key_exists: !!LEMON_SQUEEZY_API_KEY,
        api_key_length: LEMON_SQUEEZY_API_KEY
          ? LEMON_SQUEEZY_API_KEY.length
          : 0,
        store_id: LEMON_SQUEEZY_STORE_ID,
        store_id_valid:
          !!LEMON_SQUEEZY_STORE_ID &&
          !isNaN(parseInt(LEMON_SQUEEZY_STORE_ID || "")),
        basic_variant_id: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID,
        premium_variant_id: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PREMIUM_ID,
        next_public_url: process.env.NEXT_PUBLIC_URL,
      },
      lemon_squeezy_connection: null,
      error: null,
    };

    // Only try to connect if we have the API key and store ID
    if (LEMON_SQUEEZY_API_KEY && LEMON_SQUEEZY_STORE_ID) {
      try {
        // Test API connection by getting store info
        const response = await axios.get(
          `https://api.lemonsqueezy.com/v1/stores/${LEMON_SQUEEZY_STORE_ID}`,
          {
            headers: {
              Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
              Accept: "application/vnd.api+json",
              "Content-Type": "application/vnd.api+json",
            },
          }
        );

        diagnostics.lemon_squeezy_connection = {
          success: true,
          status: response.status,
          store_name: response.data?.data?.attributes?.name || "Unknown",
        };
      } catch (apiError) {
        const error = apiError as AxiosError;
        diagnostics.lemon_squeezy_connection = {
          success: false,
          status: error.response?.status,
          error: error.message,
          details: error.response?.data,
        };
      }
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
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
