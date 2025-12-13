# Authentication Setup Guide

## 🔐 Authentication System

Happin uses OTP (One-Time Password) authentication via email or phone number.

## Features

- ✅ **Sign Up**: Create account with name, company, role
- ✅ **Login**: OTP-based authentication
- ✅ **Email OTP**: SendGrid integration
- ✅ **SMS OTP**: Twilio integration
- ✅ **Session Management**: 30-day sessions
- ✅ **Protected Routes**: Inbox requires authentication

## 📋 User Flow

### Sign Up Flow:
1. User enters: Name, Company (optional), Role (optional)
2. User chooses: Email or Phone
3. User enters email/phone
4. System sends OTP
5. User enters OTP
6. Account created, user logged in

### Login Flow:
1. User chooses: Email or Phone
2. User enters email/phone
3. System sends OTP
4. User enters OTP
5. User logged in

## 🔧 Environment Variables

### Required:
- `FIREBASE_SERVICE_ACCOUNT` - Already set for Firestore

### Optional (for OTP delivery):

**For Email OTP (SendGrid):**
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**For SMS OTP (Twilio):**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Development Mode:
- If OTP services are not configured, OTPs are logged to console
- Check Vercel function logs to see OTP codes during development

## 📁 Files Created

### Pages:
- `/pages/login.tsx` - Login page
- `/pages/signup.tsx` - Signup page

### API Endpoints:
- `/api/auth/otp/send` - Send OTP
- `/api/auth/otp/verify` - Verify OTP and login/signup
- `/api/auth/me` - Get current user

### Libraries:
- `/lib/auth.ts` - Authentication utilities
- `/lib/otpService.ts` - OTP sending service

## 🗄️ Firestore Collections

### `users`
```typescript
{
  id: string,
  email?: string,
  phone?: string,
  name: string,
  company?: string,
  role?: string,
  avatar?: string,
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  verified: boolean
}
```

### `otps`
```typescript
{
  otp: string,
  type: "email" | "phone",
  expiresAt: Timestamp,
  createdAt: Timestamp,
  verified: boolean
}
```

### `sessions`
```typescript
{
  userId: string,
  createdAt: Timestamp,
  expiresAt: Timestamp
}
```

## 🔒 Protected Routes

The inbox page (`/`) is protected:
- Redirects to `/login` if not authenticated
- Checks session token on load
- Validates session with `/api/auth/me`

## 🧪 Testing

### Test Signup:
1. Go to `/signup`
2. Enter name, company, role
3. Choose email or phone
4. Enter identifier
5. Check console/logs for OTP (in dev mode)
6. Enter OTP
7. Should redirect to inbox

### Test Login:
1. Go to `/login`
2. Choose email or phone
3. Enter identifier
4. Check console/logs for OTP (in dev mode)
5. Enter OTP
6. Should redirect to inbox

## 🚀 Production Setup

1. **Set up SendGrid** (for email OTP):
   - Create account at sendgrid.com
   - Get API key
   - Add to Vercel env vars

2. **Set up Twilio** (for SMS OTP):
   - Create account at twilio.com
   - Get Account SID, Auth Token, Phone Number
   - Add to Vercel env vars

3. **Deploy**:
   - Environment variables are automatically used
   - OTPs will be sent via configured services

## 📝 Notes

- OTPs expire after 5 minutes
- Sessions last 30 days
- OTPs can only be used once
- Phone numbers should be in international format: +1234567890

