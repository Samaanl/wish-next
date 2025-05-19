import { Client, Functions } from "appwrite";

// Initialize the Appwrite client
const client = new Client();

// Make sure to set these values in your Appwrite dashboard
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Your Appwrite endpoint
  .setProject("682a20150028bfd73ea8"); // Your project ID

// Initialize Functions service
const functions = new Functions(client);

export { client, functions };
