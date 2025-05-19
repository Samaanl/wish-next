# Wish Generator

A Next.js application that generates beautifully written custom wishes for various occasions using the Gemini AI API through Appwrite Functions. This application includes authentication and a credit system powered by Lemon Squeezy.

## Features

- Select from multiple occasions (Birthday, Anniversary, New Job, etc.)
- Choose the tone of your message (Funny, Emotional, Formal, etc.)
- Personalize your wish with recipient details
- Edit generated wishes before copying
- User authentication with Appwrite
- Credit system for generating wishes (3 free credits for new users)
- Payment processing through Lemon Squeezy
- Clean, responsive UI built with Next.js and Tailwind CSS
- API calls handled through Appwrite Functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An Appwrite account
- A Google Gemini API key
- A Lemon Squeezy account (for payment processing)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd wish-generator
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   - Copy `.env.local.example` to `.env.local`
   - Update with your Appwrite and Lemon Squeezy credentials

```
# Appwrite Config
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your-appwrite-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-appwrite-database-id
NEXT_PUBLIC_APPWRITE_FUNCTION_ID=your-appwrite-function-id

# Lemon Squeezy Config
LEMON_SQUEEZY_API_KEY=your-lemon-squeezy-api-key
LEMON_SQUEEZY_STORE_ID=your-lemon-squeezy-store-id
LEMON_SQUEEZY_WEBHOOK_SECRET=your-lemon-squeezy-webhook-secret
NEXT_PUBLIC_LS_BASIC_PACKAGE_ID=your-basic-variant-id
NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID=your-premium-variant-id

# App Config
NEXT_PUBLIC_URL=http://localhost:3000 # Change to your deployment URL in production
```

### Appwrite Setup

1. Create a new Appwrite project from the Appwrite Console
2. Create a database and collections:
   - `users` collection with fields:
     - `email` (string)
     - `name` (string)
     - `credits` (integer)
     - `created_at` (string)
   - `purchases` collection with fields:
     - `user_id` (string)
     - `package_id` (string)
     - `amount` (integer)
     - `credits` (integer)
     - `created_at` (string)
   - `wishes` collection (optional) to save generated wishes
3. Create a new function for the Wish Generator:
   - Name: Wish Generator
   - Runtime: Node.js
   - Command: node index.js
   - Endpoint: POST /wish-generator
4. Copy the code from `appwrite-function-wish-generator.js` to your function
5. Add the `GEMINI_API_KEY` environment variable to your Appwrite function
6. Deploy your function and make note of the function ID
7. **Important**: In your Appwrite project settings, add your Vercel domain (e.g., `wish-next.vercel.app`) to the platforms list for CORS access

### Lemon Squeezy Setup

1. Create an account on Lemon Squeezy
2. Create products for credit packages:
   - Basic Package: $1 for 10 credits
   - Premium Package: $5 for 20 credits
3. Get your API key and store ID
4. Set up a webhook endpoint pointing to your `/api/webhooks/lemon-squeezy` route

### Development

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

1. Push your code to GitHub
2. Create a new project on Vercel and import your repository
3. Configure the environment variables in Vercel:
   - NEXT_PUBLIC_APPWRITE_ENDPOINT
   - NEXT_PUBLIC_APPWRITE_PROJECT
   - NEXT_PUBLIC_APPWRITE_DATABASE_ID
   - NEXT_PUBLIC_APPWRITE_FUNCTION_ID
   - LEMON_SQUEEZY_API_KEY
   - LEMON_SQUEEZY_STORE_ID
   - LEMON_SQUEEZY_WEBHOOK_SECRET
   - NEXT_PUBLIC_LS_BASIC_PACKAGE_ID
   - NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID
   - NEXT_PUBLIC_URL (your production URL)

## Troubleshooting

### Payment Processing Issues

If you encounter a 400 error when clicking "Buy Now":

1. **Check Lemon Squeezy Configuration**:

   - Verify that your API key and Store ID are correct
   - Make sure your variant IDs for the packages are correct numbers, not placeholder strings
   - Ensure your store is active and can accept orders

2. **API Format Issues**:

   - The Lemon Squeezy API requires specific formatting:
     - `store_id` and `variant_id` must be integers, not strings
     - Headers must include correct content types
     - Custom data must be nested correctly

3. **Webhook Setup**:

   - Ensure your webhook URL is accessible from the internet
   - The webhook secret must match between your app and Lemon Squeezy dashboard
   - For testing, you can temporarily disable signature verification

4. **Debugging Tips**:
   - Check browser console for detailed error messages
   - Inspect network requests to see what's being sent to Lemon Squeezy
   - Add console logging in your API routes to track the flow of data

### Appwrite Connection Issues

1. **CORS Settings**:

   - Make sure your domain is added in Appwrite project settings
   - For local development, add `http://localhost:3000`

2. **Authentication Errors**:
   - Verify your project ID and API endpoints
   - Check that collections have the correct attributes and permissions

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

- NEXT_PUBLIC_LS_BASIC_PACKAGE_ID
- NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID
- NEXT_PUBLIC_URL (your Vercel deployment URL)

4. Deploy the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.
