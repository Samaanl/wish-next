import { Client, Functions, Account, Databases, ID, Query } from "appwrite";

// Initialize the Appwrite client
const client = new Client();

// Set the project endpoint and ID
client
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      "https://fra.cloud.appwrite.io/v1"
  )
  .setProject(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "682a20150028bfd73ea8"
  );

// Initialize Appwrite services
const functions = new Functions(client);
const account = new Account(client);
const databases = new Databases(client);

// Appwrite Database constants
export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "682b226d003255d5a21a";
export const USERS_COLLECTION_ID = "682b227f003d0c77525f";
export const WISHES_COLLECTION_ID = "682b24150002a58ee120";
export const PURCHASES_COLLECTION_ID = "682b237300157933c8e8"; // Add your actual collection ID here

// Helper to check if we should try to use Appwrite authentication
export const shouldUseAppwrite = () => {
  // Check if we're in the browser
  if (typeof window === "undefined") return false;

  // Always create guest user first
  const guestUser = localStorage.getItem("wishmaker_guest_user");

  if (!guestUser) {
    // First visit, don't try Appwrite yet
    return false;
  }

  try {
    // Check if the user is a registered user who's signed in
    const session = localStorage.getItem("appwrite_session");
    return !!session; // Only use Appwrite if we have a session
  } catch {
    // If there's any error checking, be safe and use guest mode
    return false;
  }
};

export { client, functions, account, databases, ID, Query };
