# Happin
The Unified AI Communication Hub for Modern Teams

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
