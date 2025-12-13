# Firebase Authentication Setup

## 🔐 Using Firebase Auth for OTP

Happin now uses **Firebase Authentication** for phone number OTP and Firestore for email OTP.

## 📋 How It Works

### Phone Authentication (Firebase Auth)
- Uses Firebase Auth's built-in phone authentication
- SMS OTP sent automatically by Firebase
- No Twilio needed!
- Handles reCAPTCHA automatically

### Email Authentication (Custom + Firestore)
- OTP stored in Firestore
- Can use SendGrid for email delivery (optional)
- Falls back to logging OTP if SendGrid not configured

## 🔧 Required Environment Variables

### Firebase Client Config (for phone auth)
Add these to Vercel environment variables (with `NEXT_PUBLIC_` prefix):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### How to Get Firebase Client Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **"Your apps"** section
5. Click the **Web** icon (`</>`)
6. Register your app (or use existing)
7. Copy the config values

### Optional: Email OTP (SendGrid)
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## 🚀 Setup Steps

### 1. Enable Phone Authentication in Firebase

1. Go to Firebase Console → Authentication
2. Click **"Get started"** if not already enabled
3. Go to **"Sign-in method"** tab
4. Enable **"Phone"** provider
5. Configure reCAPTCHA (Firebase handles this automatically)

### 2. Add Environment Variables to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables
3. (Optional) Add `SENDGRID_API_KEY` for email OTP
4. Redeploy

### 3. Test

**Phone Auth:**
- Go to `/signup` or `/login`
- Choose "Phone"
- Enter phone number (international format: +1234567890)
- Firebase will send SMS automatically
- Enter OTP to verify

**Email Auth:**
- Choose "Email"
- Enter email
- OTP will be sent via SendGrid (or logged if not configured)
- Enter OTP to verify

## 📱 Phone Number Format

- Must include country code
- Format: `+1234567890`
- Examples:
  - US: `+1234567890`
  - UK: `+441234567890`
  - India: `+911234567890`

## ✅ Benefits of Firebase Auth

- ✅ **No Twilio needed** for phone OTP
- ✅ **Automatic SMS delivery** by Firebase
- ✅ **Built-in reCAPTCHA** protection
- ✅ **Secure** - Firebase handles all security
- ✅ **Free tier** available for Firebase Auth

## 🔍 Troubleshooting

### Phone auth not working?
- Check Firebase Console → Authentication → Sign-in method → Phone is enabled
- Verify `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check browser console for errors
- Make sure phone number is in international format

### Email OTP not sending?
- Check if `SENDGRID_API_KEY` is set
- If not set, OTP will be in API response and logged to console
- Check Vercel function logs for OTP code

### reCAPTCHA errors?
- Firebase handles reCAPTCHA automatically
- Make sure Firebase Auth is properly initialized
- Check browser console for reCAPTCHA errors

## 📝 Notes

- Phone authentication requires Firebase Auth to be enabled
- Email OTP still uses custom system (Firebase doesn't have email OTP)
- Phone OTP is completely handled by Firebase (no backend needed for sending)
- Email OTP can use SendGrid or fall back to logging

