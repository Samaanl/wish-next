import { Client, Users } from "node-appwrite";
import fetch from "node-fetch";

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] ?? "");
  const users = new Users(client);

  try {
    const response = await users.list();
    // Log messages and errors to the Appwrite Console
    // These logs won't be seen by your end users
    log(`Total users: ${response.total}`);
  } catch (err) {
    error("Could not list users: " + err.message);
  }
  // The req object contains the request data
  if (req.path === "/ping") {
    // Use res object to respond with text(), json(), or binary()
    // Don't forget to return a response!
    return res.text("Pong by sammmmmmman has called the function fffffffffffu");
  }
  // Handle Gemini API requests
  if (req.path === "/gemini") {
    try {
      // Get the prompt from the request
      const body = req.body;
      let prompt = "Hello, how can I help you?"; // Default prompt

      if (body && typeof body === "object" && body.prompt) {
        prompt = body.prompt;
      }

      log("Calling Gemini API with prompt: " + prompt);

      // Call Gemini API
      const GEMINI_API_KEY = "AIzaSyATa2bRiE5ZC9D4asiCBO82o3Dfoik0tmE";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      // Parse the response
      const data = await response.json();
      log("Gemini API response: " + JSON.stringify(data));

      // Return the response
      return res.json({
        success: true,
        data: data,
      });
    } catch (err) {
      error("Error calling Gemini API: " + err.message);
      return res.json(
        {
          success: false,
          error: err.message,
        },
        500
      );
    }
  }
  // Handle Wish Generator Endpoint
  if (req.path === "/wish-generator") {
    try {
      // Parse the request body
      const body = req.body;
      log("Wish generator request body: " + JSON.stringify(body)); // Extract parameters from the request
      const {
        occasion,
        tone,
        recipientName,
        relationship,
        memorableEvent,
        hobby,
        age,
        messageLength,
        messageFormat,
        userId, // Add userId to extract credit deduction info
        creditsToDeduct = 1, // Default to 1 credit per wish
      } = body; // Validate required fields
      if (!occasion || !tone || !recipientName || !relationship || !userId) {
        return res.json(
          {
            success: false,
            wish: null,
            message:
              "Missing required fields: occasion, tone, recipientName, relationship, and userId are required",
          },
          400
        );
      }

      // **STEP 1: Check if user has enough credits before generating wish**
      const DATABASE_ID = process.env.DATABASE_ID;
      const USERS_COLLECTION_ID = process.env.USERS_COLLECTION_ID;

      if (!DATABASE_ID || !USERS_COLLECTION_ID) {
        error("Missing database configuration");
        return res.json(
          {
            success: false,
            wish: null,
            message:
              "Server configuration error: Missing database configuration",
          },
          500
        );
      }

      // Helper function for making authenticated API calls to Appwrite
      const appwriteApi = async (path, method = "GET", body = null) => {
        const url = `https://cloud.appwrite.io/v1${path}`;
        const headers = {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_FUNCTION_PROJECT_ID,
          "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
        };

        const options = {
          method,
          headers,
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API call failed: ${response.status} ${errorText}`);
        }

        return await response.json();
      };

      // Check if user is a guest user (handle differently)
      if (userId.startsWith("guest-")) {
        // For guest users, we can't check credits on the server side
        // The frontend should handle this validation for guest users
        log("Guest user detected, skipping server-side credit check");
      } else {
        // **Check user's current credits**
        try {
          log(`Checking credits for user: ${userId}`);
          const user = await appwriteApi(
            `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${userId}`
          );

          const currentCredits = user.credits || 0;
          log(`User has ${currentCredits} credits, needs ${creditsToDeduct}`);

          if (currentCredits < creditsToDeduct) {
            return res.json(
              {
                success: false,
                wish: null,
                message: "INSUFFICIENT_CREDITS",
                creditsRemaining: currentCredits,
              },
              402 // Payment Required
            );
          }
        } catch (creditCheckError) {
          error("Error checking user credits: " + creditCheckError.message);
          return res.json(
            {
              success: false,
              wish: null,
              message:
                "Error checking user credits: " + creditCheckError.message,
            },
            500
          );
        }
      } // Build a prompt for the Gemini API
      let prompt = `You are a professional wish writer. Generate a ${tone} wish for ${recipientName} for their ${occasion}.`;
      prompt += ` They are my ${relationship}.`;

      if (memorableEvent) {
        prompt += ` We share this memorable event or inside joke: ${memorableEvent}.`;
      }

      if (hobby) {
        prompt += ` Their hobby/interest is: ${hobby}.`;
      }

      if (
        age &&
        (occasion.toLowerCase().includes("birthday") ||
          occasion.toLowerCase().includes("anniversary"))
      ) {
        prompt += ` They are turning ${age} years old or we have been together for ${age} years.`;
      }
      prompt +=
        " Create a single, beautifully written, heartfelt wish that feels personal and sincere.";

      // Add length specification
      if (messageLength) {
        if (messageLength.includes("Short")) {
          prompt += " Keep the message short and concise, about 1-2 sentences.";
        } else if (messageLength.includes("Medium")) {
          prompt += " Make the message medium length, about 3-4 sentences.";
        } else if (messageLength.includes("Long")) {
          prompt +=
            " Create a longer, more detailed message with 5-6 sentences.";
        }
      } else {
        prompt += " The message should be about 4-6 sentences long.";
      }

      // Add format specification
      if (messageFormat) {
        if (
          messageFormat === "Text Message" ||
          messageFormat === "WhatsApp Message"
        ) {
          prompt +=
            " Format it as a casual text message with emojis where appropriate.";
        } else if (messageFormat === "Email") {
          prompt += " Format it as a professional yet warm email message.";
        } else if (
          messageFormat === "Social Media Post" ||
          messageFormat === "Instagram Caption" ||
          messageFormat === "Facebook Post"
        ) {
          prompt +=
            " Format it as an engaging social media post with relevant hashtags and emojis.";
        } else if (messageFormat === "Card/Letter") {
          prompt +=
            " Format it as a formal, elegant message suitable for a greeting card or letter.";
        } else if (messageFormat === "Speech/Verbal") {
          prompt +=
            " Format it as a speech that flows naturally when spoken aloud.";
        } else if (messageFormat === "LinkedIn Message") {
          prompt +=
            " Format it as a professional LinkedIn message, maintaining a business-appropriate tone.";
        }
      }
      prompt +=
        " Ensure appropriate line breaks and structure for readability. IMPORTANT: Provide only ONE single wish message without any introductory text, options, explanations, or commentary. Do not include phrases like 'Here are some options', 'Option 1', or any other meta-commentary. Simply provide the direct wish message and nothing else.";

      log("Calling Gemini API with wish prompt: " + prompt);

      // Call the Gemini API
      const GEMINI_API_KEY = "AIzaSyATa2bRiE5ZC9D4asiCBO82o3Dfoik0tmE";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      // Parse the response
      const data = await response.json();
      log("Gemini API wish response: " + JSON.stringify(data)); // Extract the generated wish from the response
      const generatedWish =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a wish at this time. Please try again.";

      // **STEP 2: Deduct credits ONLY after successful wish generation**
      let creditsRemaining = null;

      if (!userId.startsWith("guest-")) {
        try {
          log(`Deducting ${creditsToDeduct} credits from user: ${userId}`);

          // Get current user credits again (to ensure consistency)
          const user = await appwriteApi(
            `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${userId}`
          );
          const currentCredits = user.credits || 0;
          const newCreditBalance = Math.max(
            0,
            currentCredits - creditsToDeduct
          );

          // Update user credits
          await appwriteApi(
            `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${userId}`,
            "PATCH",
            { credits: newCreditBalance }
          );

          creditsRemaining = newCreditBalance;
          log(
            `Credits deducted successfully. New balance: ${newCreditBalance}`
          );
        } catch (creditDeductError) {
          error("Error deducting credits: " + creditDeductError.message);
          // We already generated the wish, so let's return it but warn about credit deduction failure
          log("Warning: Wish generated but credit deduction failed");
        }
      }

      // Return the formatted response
      return res.json({
        success: true,
        wish: generatedWish,
        creditsRemaining: creditsRemaining,
        message: "Wish generated successfully",
      });
    } catch (err) {
      error("Error generating wish: " + err.message);
      return res.json(
        {
          success: false,
          wish: null,
          message: "Error generating wish: " + (err.message || "Unknown error"),
        },
        500
      );
    }
  }

  return res.json({
    motto: "Build like a team of hundreds_",
    learn: "https://appwrite.io/docs",
    connect: "https://appwrite.io/discord",
    getInspired: "https://builtwith.appwrite.io",
  });
};
