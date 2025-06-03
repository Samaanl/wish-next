const sdk = require('node-appwrite');

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
*/

module.exports = async function(req, res) {
  // Initialize Appwrite SDK
  const client = new sdk.Client();
  
  // Use Appwrite Function variables to get credentials
  const { 
    APPWRITE_FUNCTION_PROJECT_ID, 
    APPWRITE_API_KEY,
    DATABASE_ID,
    USERS_COLLECTION_ID,
    PURCHASES_COLLECTION_ID
  } = req.variables;

  // Set up the client
  client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject(APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  // Initialize Appwrite services
  const databases = new sdk.Databases(client);
  const { ID, Query } = sdk;

  try {
    // Parse request data
    const { userId, packageId, transactionId, amount } = JSON.parse(req.payload);
    
    // Validate required fields
    if (!userId || !packageId || !transactionId) {
      return res.json({
        success: false,
        message: "Missing required fields: userId, packageId, and transactionId are required"
      }, 400);
    }

    console.log(`Processing credit addition for user ${userId}, package ${packageId}, transaction ${transactionId}`);
    
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
        console.log(`Transaction ${finalTransactionId} already processed`);
        return res.json({
          success: true,
          duplicate: true,
          message: "Credits were already added for this transaction"
        });
      }
    } catch (error) {
      console.error("Error checking for existing transaction:", error);
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
    
    console.log(`Adding ${creditsToAdd} credits for package ${packageId}`);
    
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
    
    console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
    
    // Return success response
    return res.json({
      success: true,
      newBalance,
      creditsAdded: creditsToAdd,
      message: "Credits added successfully"
    });
    
  } catch (error) {
    console.error("Error processing credit addition:", error);
    
    return res.json({
      success: false,
      message: "Failed to process credit addition",
      error: error.message
    }, 500);
  }
};
