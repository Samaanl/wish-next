# Credit Deduction Fix - SDK Approach

## Problem Identified

The 401 authorization error was caused by **incorrect API key usage** in the SDK initialization.

## Root Cause

The function was using `req.headers["x-appwrite-key"]` instead of `process.env.APPWRITE_API_KEY`.

**Before (Wrong):**

```javascript
.setKey(req.headers["x-appwrite-key"] ?? "");
```

**After (Correct):**

```javascript
.setKey(process.env.APPWRITE_API_KEY);
```

## Solution Applied

Updated `appwrite-function-wish-generator.js` to use the **Appwrite SDK properly**:

### Key Changes Made:

1. **Proper SDK Initialization**:

   ```javascript
   import { Client, Databases } from "node-appwrite";

   const client = new Client()
     .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
     .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
     .setKey(process.env.APPWRITE_API_KEY); // ⭐ Use API key from env vars

   const databases = new Databases(client);
   ```

2. **Direct Database Operations**:

   - `databases.getDocument()` for reading user credits
   - `databases.updateDocument()` for updating user credits
   - No custom API helpers needed

3. **Clean Credit Management**:

   ```javascript
   // Check credits
   const user = await databases.getDocument(
     DATABASE_ID,
     USERS_COLLECTION_ID,
     userId
   );

   // Update credits
   await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
     credits: newBalance,
   });
   ```

## Why This Should Work Now:

1. ✅ **Correct API Key**: Uses `process.env.APPWRITE_API_KEY` from environment
2. ✅ **SDK Dependencies**: Uses node-appwrite that's already in your package.json
3. ✅ **Proper Permissions**: Function has server-side permissions with API key
4. ✅ **Simple Operations**: Direct SDK calls, no custom fetch wrappers

## Environment Variables Required:

- `APPWRITE_FUNCTION_PROJECT_ID`
- `APPWRITE_API_KEY` ⭐ **Make sure this is set in function environment**
- `DATABASE_ID`
- `USERS_COLLECTION_ID`

## Next Steps:

1. Deploy the updated function to Appwrite Console
2. **Verify `APPWRITE_API_KEY` is set** in the function's environment variables
3. Test wish generation with a signed-in user account
4. Check that credits are properly deducted

## Expected Behavior:

- ✅ No more 401 authorization errors
- ✅ Credits checked before wish generation
- ✅ Credits deducted after successful generation
- ✅ Guest users still work (frontend handles their credits)
