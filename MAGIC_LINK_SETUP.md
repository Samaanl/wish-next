# Magic Link Authentication Setup Guide

## Overview

This implementation adds magic link authentication to the Wish Generator app alongside the existing Google OAuth. Users can now sign in using either method.

## Features Implemented

### 1. Magic Link Authentication Flow

- **Email Input**: Users can enter their email address
- **Magic Link Generation**: Creates a secure magic link using Appwrite's built-in functionality
- **Email Verification**: Users click the magic link to authenticate
- **Session Management**: Automatic session creation and user management

### 2. Updated Components

#### AuthModal.tsx

- Added method selector (Google vs Magic Link)
- Magic link email input form
- Success state showing email sent confirmation
- Form validation and error handling

#### Magic Link Verification Page (`/auth/magic-link`)

- Handles magic link callback from emails
- Extracts `userId` and `secret` from URL parameters
- Verifies authentication and creates user session
- Redirects back to original page after successful auth

### 3. Authentication Services

#### authService.ts

- `signInWithMagicLink(email)`: Creates magic link token
- `verifyMagicLink(userId, secret)`: Verifies magic link and creates session
- Proper session management and localStorage integration

#### AuthContext.tsx

- Added magic link methods to context
- Integrated with existing authentication flow
- Maintains session state across app

## Setup Instructions

### 1. Appwrite Configuration

The implementation uses Appwrite's built-in magic link functionality:

- `account.createMagicURLToken()` - Creates the magic link
- `account.updateMagicURLSession()` - Verifies the magic link

### 2. Email Configuration

Currently using Appwrite's default email service. For custom emails:

#### Option A: Use Appwrite's Built-in Email (Current)

- No additional setup required
- Uses Appwrite's default email templates
- Emails sent automatically when magic link is created

#### Option B: Custom Email with Resend (Optional)

A custom Appwrite function (`appwrite-function-magic-link.js`) has been created for enhanced email delivery:

1. **Create Function in Appwrite Dashboard**:

   - Go to Functions in Appwrite Console
   - Create new function named "magic-link-sender"
   - Upload the `appwrite-function-magic-link.js` file

2. **Environment Variables**:

   ```
   RESEND_API_KEY=your_resend_api_key
   ```

3. **Update Domain**:
   In `appwrite-function-magic-link.js`, update:
   ```javascript
   from: "Wish Generator <noreply@yourdomain.com>";
   ```

### 3. URL Configuration

Make sure your Appwrite project allows the callback URL:

- Development: `http://localhost:3001/auth/magic-link`
- Production: `https://yourdomain.com/auth/magic-link`

## User Experience

### Magic Link Flow

1. User clicks "Magic Link" tab in auth modal
2. Enters email address and clicks "Send Magic Link"
3. Receives email with secure link
4. Clicks link to be redirected to `/auth/magic-link`
5. Automatic verification and redirect to original page

### Email Template (Appwrite Default)

Appwrite sends a basic email with the magic link. The custom function provides:

- Professional HTML email template
- Better branding and styling
- Security information
- Mobile-responsive design

## Security Features

1. **Token Expiration**: Magic links expire after 1 hour
2. **One-time Use**: Each magic link can only be used once
3. **Secure Generation**: Uses Appwrite's cryptographically secure token generation
4. **Session Management**: Proper session creation and cleanup
5. **Guest Mode Transition**: Seamlessly transitions from guest to authenticated user

## Testing

1. Start the development server: `npm run dev`
2. Open `http://localhost:3001`
3. Click sign in and select "Magic Link" tab
4. Enter an email address
5. Check the email for the magic link
6. Click the link to complete authentication

## Integration Notes

- Works alongside existing Google OAuth
- Maintains existing guest user functionality
- Compatible with existing credit system
- Preserves user session across page reloads
- Handles authentication redirects properly

## Troubleshooting

### Common Issues

1. **Magic link not received**:

   - Check spam folder
   - Verify email address is correct
   - Ensure Appwrite email service is configured

2. **Verification fails**:

   - Check if link has expired (1 hour limit)
   - Ensure URL parameters are intact
   - Check browser console for errors

3. **Redirect issues**:
   - Verify callback URL in Appwrite settings
   - Check localStorage for saved redirect path
   - Ensure proper session management

### Debug Mode

Enable detailed logging by checking browser console for:

- Magic link creation logs
- Verification attempt logs
- Session management logs
- Error messages with details
