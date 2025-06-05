# Appwrite Function Configuration for Credit Management

## Environment Variables Required

Add these environment variables to your **wish-generator** Appwrite Function:

### Required Variables:

```
DATABASE_ID=your_database_id
USERS_COLLECTION_ID=users
APPWRITE_API_KEY=your_appwrite_api_key
```

### How to Set Them:

1. **Go to Appwrite Console** → Your Project → Functions → wish-generator
2. **Click on "Settings" tab**
3. **Scroll down to "Environment Variables"**
4. **Add each variable:**

   - **DATABASE_ID**: Your database ID (same as the one in your frontend .env)
   - **USERS_COLLECTION_ID**: Usually "users" (same as your frontend collection ID)
   - **APPWRITE_API_KEY**: Create a new API key with Database permissions

### Creating the API Key:

1. Go to **Appwrite Console** → Your Project → **Overview** → **Integrations**
2. Click **API Keys** → **Create API Key**
3. **Name**: "wish-generator-function"
4. **Scopes**:
   - ✅ **databases.read**
   - ✅ **databases.write**
   - ✅ **documents.read**
   - ✅ **documents.write**
5. **Copy the generated key** and add it as `APPWRITE_API_KEY`

## What This Achieves:

### ✅ **Server-Side Credit Management**

- Credit checking happens on the server before generation
- Credit deduction happens atomically after successful generation
- Prevents frontend manipulation of credits

### ✅ **Atomic Operations**

- Wish generation and credit deduction happen together
- If generation fails, no credits are deducted
- If credit deduction fails, you still get the wish (with warning)

### ✅ **Security Benefits**

- All user data operations happen on secure server
- No way for users to bypass credit requirements
- Guest users still work (handled on frontend)

### ✅ **Error Handling**

- Proper error codes (402 for insufficient credits)
- Graceful fallbacks for various failure scenarios
- Detailed logging for debugging

## Function Flow:

1. **Receive request** with wish inputs + userId
2. **Check credits** (server-side for authenticated users)
3. **Generate wish** using Gemini API
4. **Deduct credits** (only after successful generation)
5. **Return result** with updated credit balance

## Testing:

After setting up the environment variables:

1. **Deploy the function** (if not auto-deployed)
2. **Test with authenticated user** - should work seamlessly
3. **Test with insufficient credits** - should return proper error
4. **Test with guest user** - should still work (frontend handles credits)

## Backwards Compatibility:

✅ **No breaking changes** - existing frontend code continues to work
✅ **Guest users** - still handled on frontend as before
✅ **Credit display** - continues to work with updated balances
✅ **Error handling** - same error types, just different source

The system is now more secure and robust! 🚀
