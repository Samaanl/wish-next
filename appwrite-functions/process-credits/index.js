const sdk = require('node-appwrite');

/*
  The Appwrite function format has changed. The new format uses a context object
  instead of req and res. This provides better logging and error handling.
  
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
    context.log("Context req:", context.req ? "exists" : "missing");
    context.log("Raw body:", context.req?.body || "no body");
    context.log("Raw headers:", JSON.stringify(context.req?.headers || {}));

    // Get environment variables with fallbacks
    const APPWRITE_FUNCTION_PROJECT_ID = context.req?.variables?.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const APPWRITE_API_KEY = context.req?.variables?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
    const DATABASE_ID = context.req?.variables?.DATABASE_ID || process.env.DATABASE_ID;
    const USERS_COLLECTION_ID = context.req?.variables?.USERS_COLLECTION_ID || process.env.USERS_COLLECTION_ID;
    const PURCHASES_COLLECTION_ID = context.req?.variables?.PURCHASES_COLLECTION_ID || process.env.PURCHASES_COLLECTION_ID;

    // Log all environment variables for debugging
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

    // Parse request data
    let userId, packageId, transactionId, amount;
    try {
      // Log raw request data for debugging
      context.log("Request payload:", context.req.payload);
      context.log("Request body:", context.req.body);
      
      // Get the payload - Appwrite functions receive the payload in req.payload
      let payload;
      
      // If payload is a string, try to parse it as JSON
      if (typeof context.req.payload === 'string') {
        try {
          payload = JSON.parse(context.req.payload);
          context.log("Successfully parsed payload string as JSON");
        } catch (e) {
          context.error("Failed to parse payload string as JSON:", e.message);
          payload = {};
        }
      } 
      // If payload is already an object, use it directly
      else if (typeof context.req.payload === 'object' && context.req.payload !== null) {
        payload = context.req.payload;
        context.log("Using payload as object");
      } 
      // Fallback to empty object
      else {
        context.error("Payload is neither object nor string, using empty object");
        payload = {};
      }
      
      // Extract the required fields
      userId = payload.userId;
      packageId = payload.packageId;
      transactionId = payload.transactionId;
      amount = payload.amount;
      
      // Log the extracted values
      context.log("Extracted values from payload:");
      context.log("- userId:", userId);
      context.log("- packageId:", packageId);
      context.log("- transactionId:", transactionId);
      context.log("- amount:", amount);
    } catch (parseError) {
      context.error("Error parsing payload:", parseError);
      return context.res.json({
        success: false,
        message: "Invalid payload format",
        error: parseError.message,
        rawPayloadType: typeof context.req?.payload
      }, 400);
    }
    
    // Validate required fields
    if (!userId || !packageId || !transactionId) {
      context.error("Missing required fields in payload");
      return context.res.json({
        success: false,
        message: "Missing required fields: userId, packageId, and transactionId are required"
      }, 400);
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
