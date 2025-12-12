# Happin Setup Guide

## Overview

Happin is a unified communication platform that combines messages from WhatsApp, Email, Slack, LinkedIn, and other channels into a single inbox, using AI to prioritize and summarize messages.

## Architecture

- **Frontend**: Next.js 14 with React and TypeScript
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **AI**: Custom priority and summarization (ready for OpenAI integration)
- **Styling**: Tailwind CSS

## Prerequisites

1. Node.js 18+ installed
2. Firebase project with Firestore enabled
3. Vercel account (for deployment)
4. Accounts/API keys for integrations:
   - Twilio (for WhatsApp/SMS)
   - Slack App (for Slack)
   - SendGrid or Mailgun (for Email)
   - LinkedIn API (for LinkedIn)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a Service Account:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

### 3. Environment Variables

Create a `.env.local` file:

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# Optional: For enhanced AI features
OPENAI_API_KEY=sk-...

# Optional: Webhook secrets
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

**Important**: The `FIREBASE_SERVICE_ACCOUNT` should be the entire JSON object as a string.

### 4. Deploy Firestore Rules and Indexes

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not already done)
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Channel Integrations

### WhatsApp (via Twilio)

1. Set up Twilio account and get a WhatsApp-enabled number
2. Configure webhook in Twilio Console:
   - Go to Messaging > Settings > WhatsApp Sandbox
   - Set webhook URL: `https://your-domain.vercel.app/api/webhooks/twilio`
   - Method: POST

### Slack

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Event Subscriptions:
   - Request URL: `https://your-domain.vercel.app/api/webhooks/slack`
   - Subscribe to events:
     - `message.channels`
     - `message.groups`
     - `message.im`
     - `message.mpim`
3. Install app to your workspace

### Email (SendGrid)

1. Set up SendGrid account
2. Configure Inbound Parse:
   - Go to Settings > Inbound Parse
   - Add hostname and set webhook URL: `https://your-domain.vercel.app/api/webhooks/email`
   - POST the raw, parsed, and attachment information

### Email (Mailgun)

1. Set up Mailgun account
2. Configure Routes:
   - Go to Receiving > Routes
   - Create route with webhook URL: `https://your-domain.vercel.app/api/webhooks/email`

### LinkedIn

1. Create LinkedIn App at [developer.linkedin.com](https://developer.linkedin.com)
2. Set up webhooks for messaging API
3. Configure webhook URL: `https://your-domain.vercel.app/api/webhooks/linkedin`

## Deployment to Vercel

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard
3. Add environment variables in Vercel:
   - `FIREBASE_SERVICE_ACCOUNT` (as string)
   - Any other API keys needed
4. Deploy!

## Testing Webhooks Locally

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL in your webhook configurations.

## Project Structure

```
Happin/
├── components/          # React components
│   ├── ConversationList.tsx
│   ├── MessageBubble.tsx
│   └── sidebar.tsx
├── lib/                # Core utilities
│   ├── firebase.ts     # Firebase initialization
│   ├── messageStore.ts # Message CRUD operations
│   └── ai.ts           # AI processing (priority, summary)
├── pages/
│   ├── api/
│   │   ├── messages.ts        # GET/PATCH messages
│   │   ├── ai/
│   │   │   └── summarize.ts   # AI summarization endpoint
│   │   └── webhooks/
│   │       ├── twilio.ts      # WhatsApp/SMS webhook
│   │       ├── slack.ts       # Slack webhook
│   │       ├── email.ts       # Email webhook
│   │       └── generic.ts     # Generic webhook
│   └── index.tsx       # Main inbox UI
├── firestore/
│   ├── firestore.rules
│   └── firestore.indexes.json
└── migrations/
    └── schema.md       # Data schema documentation
```

## Next Steps

1. **Enhanced AI**: Integrate OpenAI API for better summarization and priority detection
2. **Real-time Updates**: Add Firestore real-time listeners for instant updates
3. **Search**: Implement full-text search across messages
4. **Reply Functionality**: Add ability to reply from the platform
5. **Notifications**: Browser/email notifications for high-priority messages
6. **Analytics**: Dashboard for message statistics
7. **Multi-user**: Add authentication and user management
8. **Mobile App**: React Native app for mobile access

## Troubleshooting

### Messages not appearing
- Check Firestore rules allow reads
- Verify webhook URLs are correct
- Check server logs for errors

### AI processing not working
- Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Check Firestore write permissions
- Review server logs for AI processing errors

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run build`
- Verify Tailwind CSS is configured correctly

## Support

For issues or questions, check the logs in Vercel Dashboard or Firebase Console.

