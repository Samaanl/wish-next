<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Wish Generator

This is a Next.js application that generates custom wishes for various occasions using Gemini AI API through Appwrite Functions.

## Project Structure

- `src/app`: Main Next.js app directory with page components
- `src/components`: Reusable React components
- `src/utils`: Utility functions for API calls and services
- `public`: Static assets
- `appwrite-function-wish-generator.js`: Appwrite Function to call Gemini API

## Key Technologies

- Next.js with App Router
- React with TypeScript
- Tailwind CSS
- Appwrite Backend as a Service
- Google Gemini API

## Important Files

- `src/utils/appwrite.ts`: Appwrite client configuration
- `src/utils/wishService.ts`: Service to handle wish generation
- `src/components/WishForm.tsx`: Form component for user inputs
- `src/components/WishDisplay.tsx`: Component to display and edit generated wishes
- `appwrite-function-wish-generator.js`: Appwrite Function code for Gemini API integration

## Development Guidelines

- Follow TypeScript type safety practices
- Use Tailwind CSS for styling
- Keep API keys and credentials in environment variables
- Optimize components for performance
- Ensure responsive design works on all device sizes
