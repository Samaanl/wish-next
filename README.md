# Wish Generator

A Next.js application that generates beautifully written custom wishes for various occasions using the Gemini AI API through Appwrite Functions.

## Features

- Select from multiple occasions (Birthday, Anniversary, New Job, etc.)
- Choose the tone of your message (Funny, Emotional, Formal, etc.)
- Personalize your wish with recipient details
- Edit generated wishes before copying
- Clean, responsive UI built with Next.js and Tailwind CSS
- API calls handled through Appwrite Functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An Appwrite account
- A Google Gemini API key

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
   - Create a `.env.local` file in the root of the project
   - Add your Appwrite project ID and other environment variables

### Appwrite Function Setup

1. Create a new Appwrite project from the Appwrite Console
2. Create a new function in Appwrite with the following settings:

   - Name: Wish Generator
   - Runtime: Node.js
   - Command: node index.js
   - Endpoint: POST /wish-generator

3. Copy the code from `appwrite-function-wish-generator.js` to your function
4. Add the `GEMINI_API_KEY` environment variable to your Appwrite function
5. Deploy your function and make note of the function ID

### Configure Client

1. Update the `src/utils/appwrite.ts` file with your Appwrite project ID
2. Update the `src/utils/wishService.ts` file with your Appwrite function ID

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Follow Vercel's deployment instructions to deploy your application.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
