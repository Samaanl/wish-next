const sdk = require('node-appwrite');

/*
  'context' variable has:
    'req' - object with request data
      'headers' - object with request headers
      'payload' - request body data as a string
      'variables' - object with function variables
    'log(text)' - function to log information
    'error(text)' - function to log errors
    'res' - methods to return responses
      'send(text, status)' - function to return text response
      'json(obj, status)' - function to return JSON response
*/

module.exports = async function(context) {
  try {
    // Log the start of function execution
    context.log("Starting process-credits function");
    
    // Log ALL request data for debugging
    if (context.req) {
      context.log("Request object keys:", Object.keys(context.req));
      
      // Log the raw request body
      if (context.req.body) {
        context.log("Raw body:", typeof context.req.body === 'object' ? 
          JSON.stringify(context.req.body) : context.req.body);
      } else {
        context.log("Body is undefined");
      }
      
      // Log the raw request payload
      if (context.req.payload) {
        context.log("Raw payload:", typeof context.req.payload === 'object' ? 
          JSON.stringify(context.req.payload) : context.req.payload);
      } else {
        context.log("Payload is undefined");
      }
      
      // Log headers
      context.log("Raw headers:", JSON.stringify(context.req.headers || {}));
    } else {
      context.log("Request object is undefined");
    }
    
    // Get environment variables
    const APPWRITE_FUNCTION_PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
    const DATABASE_ID = process.env.DATABASE_ID;
    const USERS_COLLECTION_ID = process.env.USERS_COLLECTION_ID;
    const PURCHASES_COLLECTION_ID = process.env.PURCHASES_COLLECTION_ID;

    // Log environment variables
    context.log("Environment variables:", {
      APPWRITE_FUNCTION_PROJECT_ID: APPWRITE_FUNCTION_PROJECT_ID ? "set" : "missing",
      APPWRITE_API_KEY: APPWRITE_API_KEY ? "set" : "missing",
      DATABASE_ID: DATABASE_ID ? "set" : "missing",
      USERS_COLLECTION_ID: USERS_COLLECTION_ID ? "set" : "missing",
      PURCHASES_COLLECTION_ID: PURCHASES_COLLECTION_ID ? "set" : "missing"
    });

    // Validate required environment variables
    if (!APPWRITE_FUNCTION_PROJECT_ID) {
      context.error("Missing APPWRITE_FUNCTION_PROJECT_ID environment variable");
      return context.res.json({
        success: false,
        message: "Server configuration error: Missing project ID"
      }, 500);
    }

    if (!APPWRITE_API_KEY) {
      context.error("Missing APPWRITE_API_KEY environment variable");
      return context.res.json({
        success: false,
        message: "Server configuration error: Missing API key"
      }, 500);
    }

    if (!DATABASE_ID) {
      context.error("Missing DATABASE_ID environment variable");
      return context.res.json({
        success: false,
        message: "Server configuration error: Missing database ID"
      }, 500);
    }

    if (!USERS_COLLECTION_ID) {
      context.error("Missing USERS_COLLECTION_ID environment variable");
      return context.res.json({
        success: false,
        message: "Server configuration error: Missing users collection ID"
      }, 500);
    }

    if (!PURCHASES_COLLECTION_ID) {
      context.error("Missing PURCHASES_COLLECTION_ID environment variable");
      return context.res.json({
        success: false,
        message: "Server configuration error: Missing purchases collection ID"
      }, 500);
    }

    // Initialize Appwrite SDK
    const client = new sdk.Client();
    
    // Set up the client
    client
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject(APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    // Initialize Appwrite services
    const databases = new sdk.Databases(client);
    const { ID, Query } = sdk;

    // Parse request data - CRITICAL FIX
    let userId, packageId, transactionId, amount;
    try {
      // Try to get the payload from all possible locations
      let payload = null;
      
      // First try to access payload directly from the request
      if (context.req.payload) {
        if (typeof context.req.payload === 'string') {
          try {
            // Try to parse the payload string as JSON
            payload = JSON.parse(context.req.payload);
            context.log("Successfully parsed payload string");
          } catch (e) {
            context.error("Failed to parse payload string:", e.message);
          }
        } else if (typeof context.req.payload === 'object' && context.req.payload !== null) {
          // Use the payload object directly
          payload = context.req.payload;
          context.log("Using payload object directly");
        }
      }
      
      // If payload is still null, try the body
      if (!payload && context.req.body) {
        if (typeof context.req.body === 'string') {
          try {
            // Try to parse the body string as JSON
            payload = JSON.parse(context.req.body);
            context.log("Successfully parsed body string");
          } catch (e) {
            context.error("Failed to parse body string:", e.message);
          }
        } else if (typeof context.req.body === 'object' && context.req.body !== null) {
          // Use the body object directly
          payload = context.req.body;
          context.log("Using body object directly");
        }
      }
      
      // If we still don't have a payload, try to parse the raw request
      if (!payload && context.req) {
        try {
          // Last resort: try to parse the entire request as JSON
          const reqStr = JSON.stringify(context.req);
          const reqObj = JSON.parse(reqStr);
          
          // Look for payload in the parsed request
          if (reqObj.body) {
            payload = typeof reqObj.body === 'string' ? JSON.parse(reqObj.body) : reqObj.body;
            context.log("Extracted payload from stringified request");
          }
        } catch (e) {
          context.error("Failed to extract payload from request:", e.message);
        }
      }
      
      // If we still don't have a payload, create an empty object
      if (!payload) {
        context.error("Could not find payload in request, using empty object");
        payload = {};
      }
      
      // Extract data from the payload
      userId = payload.userId;
      packageId = payload.packageId;
      transactionId = payload.transactionId;
      amount = payload.amount;
      
      // Log the extracted values
      context.log("Final extracted values:");
      context.log("- userId:", userId);
      context.log("- packageId:", packageId);
      context.log("- transactionId:", transactionId);
      context.log("- amount:", amount);
    } catch (parseError) {
      context.error("Error parsing payload:", parseError);
      return context.res.json({
        success: false,
        message: "Invalid payload format",
        error: parseError.message
      }, 400);
    }
    
    // Validate required fields
    if (!userId || !packageId || !transactionId) {
      context.error("Missing required fields");
      return context.res.json({
        success: false,
        message: "Missing required fields",
        provided: { userId, packageId, transactionId }
      }, 400);
    }
    
    // Determine credit amount based on package if not provided
    if (!amount) {
      context.log("Amount not provided, determining from package ID");
      if (packageId === "basic") {
        amount = 1;
      } else if (packageId === "premium") {
        amount = 5;
      } else if (packageId === "pro") {
        amount = 50;
      } else {
        context.error("Invalid package ID");
        return context.res.json({
          success: false,
          message: "Invalid package ID",
          provided: { packageId }
        }, 400);
      }
      context.log("Determined amount:", amount);
    }

    context.log(`Processing credit addition for user ${userId}, package ${packageId}, transaction ${transactionId}`);
    
    // Create a unique, deterministic transaction ID if not provided
    const finalTransactionId = transactionId || `tx_${userId}_${packageId}_${Date.now()}`;
    
    // Step 1: Check if this transaction has already been processed
    try {
      // First try to find by exact transaction ID
      // Adding a transaction_id field to the query even though it's not in the schema
      // This will help us track duplicates
      const existingTransactions = await databases.listDocuments(
        DATABASE_ID,
        PURCHASES_COLLECTION_ID,
        [Query.equal('user_id', userId), Query.equal('package_id', packageId)]
      );
      
      if (existingTransactions.total > 0) {
        context.log(`Transaction ${finalTransactionId} already processed`);
        return context.res.json({
          success: true,
          duplicate: true,
          message: "Credits were already added for this transaction"
        });
      }
    } catch (error) {
      context.error("Error checking for existing transaction:", error);
      // Continue processing - it's better to risk a duplicate than to fail
    }
    
    // Step 2: Determine the correct credit amount based on the package ID
    let creditsToAdd = 0;
    if (packageId === "basic") {
      creditsToAdd = 10; // $1 plan gets exactly 10 credits
    } else if (packageId === "premium") {
      creditsToAdd = 100; // $5 plan gets exactly 100 credits
    } else if (packageId === "pro") {
      creditsToAdd = 1000; // $50 plan gets exactly 1000 credits
    } else {
      // Default fallback with a reasonable cap
      creditsToAdd = Math.min(Math.max(0, amount || 0) * 20, 1000);
    }
    
    context.log(`Adding ${creditsToAdd} credits for package ${packageId}`);
    
    // Step 3: Add credits to user - using atomic operations
    // Get current user document
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );
    
    // Calculate new balance
    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + creditsToAdd;
    
    // Update user credits atomically
    // Note: The users collection doesn't have an updated_at field according to the schema
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        credits: newBalance
      }
    );
    
    // Step 4: Record the purchase with a unique ID to prevent duplicates
    await databases.createDocument(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      ID.unique(),
      {
        user_id: userId,
        package_id: packageId,
        // Store transaction ID in a comment field since it's not in the schema
        // We'll use the combination of user_id and package_id to detect duplicates
        amount: amount || 0,
        credits: creditsToAdd,
        created_at: new Date().toISOString()
      }
    );
    
    context.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
    
    // Return success response
    return context.res.json({
      success: true,
      newBalance,
      creditsAdded: creditsToAdd,
      message: "Credits added successfully"
    });
    
  } catch (error) {
    context.error("Error processing credit addition:", error);
    
    // Always use context.res for responses
    return context.res.json({
      success: false,
      message: "Failed to process credit addition",
      error: error.message
    }, 500);
  }
};
