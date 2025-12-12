# Happin
The Unified AI Communication Hub for Modern Teams

**Combine all your business messages from WhatsApp, Email, Slack, LinkedIn, and more into one intelligent inbox.**

## ✨ Features

- 📬 **Unified Inbox**: All messages from different channels in one place
- 🤖 **AI-Powered**: Automatic priority detection and message summarization
- 🔔 **Smart Filtering**: Filter by channel, unread status, and priority
- 📊 **Real-time Updates**: See new messages as they arrive
- 🎯 **Priority System**: Messages automatically ranked 1-5 based on urgency
- 🏷️ **Auto-tagging**: AI categorizes messages (question, task, urgent, spam, etc.)
- 💬 **Multi-channel Support**: WhatsApp, Slack, Email, LinkedIn, SMS, and more

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Basic Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project
   - Enable Firestore
   - Get service account JSON
   - Add to `.env.local` as `FIREBASE_SERVICE_ACCOUNT`

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Deploy to Vercel**
   - Push to GitHub
   - Import in Vercel
   - Add environment variables
   - Deploy!

## 📋 What's Built

### ✅ Core Infrastructure
- ✅ Firebase/Firestore integration
- ✅ Unified message data schema
- ✅ Message storage and retrieval API
- ✅ AI priority detection and summarization
- ✅ Webhook handlers for multiple channels

### ✅ Webhook Integrations
- ✅ **Twilio** (WhatsApp & SMS)
- ✅ **Slack** (Event Subscriptions)
- ✅ **Email** (SendGrid & Mailgun compatible)
- ✅ **Generic** (for custom integrations)

### ✅ User Interface
- ✅ Modern inbox with sidebar navigation
- ✅ Conversation list with priority indicators
- ✅ Message detail view with AI summary
- ✅ Channel filtering and unread filtering
- ✅ Priority management

### 🔄 Next Steps (Optional Enhancements)
- 🔄 Real-time updates with Firestore listeners
- 🔄 Enhanced AI with OpenAI integration
- 🔄 Search functionality
- 🔄 Reply from platform
- 🔄 Mobile app
- 🔄 Multi-user support with authentication

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [migrations/schema.md](./migrations/schema.md) - Data schema documentation

## 🏗️ Architecture

```
Frontend (Next.js + React + TypeScript)
    ↓
API Routes (Next.js)
    ↓
Firestore Database
    ↑
Webhook Handlers (Twilio, Slack, Email, etc.)
```

## 🔗 Webhook URLs

After deployment, configure these webhook URLs:

- **Twilio**: `https://your-domain.vercel.app/api/webhooks/twilio`
- **Slack**: `https://your-domain.vercel.app/api/webhooks/slack`
- **Email**: `https://your-domain.vercel.app/api/webhooks/email`
- **Generic**: `https://your-domain.vercel.app/api/webhooks/generic`

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Deployment**: Vercel
- **AI**: Custom algorithms (ready for OpenAI integration)

## Deployment on Vercel

This project is configured for deployment on Vercel. Follow these steps to deploy:

### Prerequisites
- A Vercel account ([sign up here](https://vercel.com/signup))
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. **Connect your repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables:**
   In your Vercel project settings, add the following environment variables:
   
   - `FIREBASE_SERVICE_ACCOUNT` - Your Firebase service account JSON (as a string)
   
   Additional environment variables may be needed depending on your webhook integrations:
   - `TWILIO_*` - If using Twilio webhooks
   - `SLACK_*` - If using Slack webhooks
   - Any other API keys or secrets your application requires

3. **Deploy:**
   - Vercel will automatically build and deploy your project
   - The build command `npm run build` will be executed automatically
   - Your project will be available at `https://your-project.vercel.app`

### Manual Deployment

Alternatively, you can deploy using the Vercel CLI:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### Environment Variables Setup

To set environment variables via CLI:
```bash
vercel env add FIREBASE_SERVICE_ACCOUNT
```

Or set them in the Vercel Dashboard under Project Settings → Environment Variables.

### Firestore Configuration

Make sure to deploy your Firestore rules and indexes:
- Firestore rules are in `firestore/firestore.rules`
- Firestore indexes are in `firestore/firestore.indexes.json`

You can deploy these using Firebase CLI:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Build Configuration

The project uses:
- **Framework:** Next.js 14
- **Node Version:** Compatible with Node.js 18.x or later
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (auto-detected by Vercel)

### Troubleshooting

- If build fails, check that all dependencies are listed in `package.json`
- Ensure environment variables are set correctly in Vercel dashboard
- Check build logs in Vercel dashboard for specific errors
