# Vercel Environment Variables Setup

## 🔧 Fixing "Firestore not initialized" Error

This error means the `FIREBASE_SERVICE_ACCOUNT` environment variable is not set in Vercel.

## Step-by-Step Setup

### 1. Get Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file (e.g., `firebase-service-account.json`)

### 2. Convert JSON to String for Vercel

The entire JSON needs to be set as a **single string** in Vercel. You have two options:

#### Option A: Using Terminal (Recommended)

```bash
# On Mac/Linux
cat firebase-service-account.json | jq -c | tr -d '\n' | pbcopy

# Or simpler (removes all whitespace)
cat firebase-service-account.json | jq -c . | pbcopy
```

This copies the JSON as a single-line string to your clipboard.

#### Option B: Manual Conversion

1. Open the JSON file
2. Remove all line breaks and extra spaces
3. Make it a single line
4. Wrap it in single quotes: `'{"type":"service_account",...}'`

### 3. Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the single-line JSON string (from step 2)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### 4. Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic redeploy

### 5. Verify

Test the health endpoint:
```bash
curl https://your-domain.vercel.app/api/health
```

Should return:
```json
{
  "ok": true,
  "service": "happin",
  "env": "production",
  "firestoreConfigured": true,
  "firestoreInitialized": true,
  "message": "Firestore is ready"
}
```

## 🔍 Troubleshooting

### Still getting "Firestore not initialized"?

1. **Check the JSON format**:
   - Must be valid JSON
   - Must be a single line (no line breaks)
   - Should start with `{"type":"service_account",...}`

2. **Check Vercel logs**:
   - Go to your deployment → **Functions** tab
   - Check for errors like "Failed to parse FIREBASE_SERVICE_ACCOUNT"

3. **Verify environment variable**:
   - Make sure it's set for the correct environment (Production/Preview/Development)
   - Check for typos: `FIREBASE_SERVICE_ACCOUNT` (not `FIREBASE_SERVICE_ACCOUNT_KEY`)

4. **Test locally**:
   ```bash
   # In your .env.local file
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

### Common Issues

**Issue**: "Failed to parse FIREBASE_SERVICE_ACCOUNT"
- **Solution**: JSON might have line breaks. Use `jq -c` to compress it.

**Issue**: "Credential error"
- **Solution**: Make sure the service account JSON is complete and valid.

**Issue**: Variable not found
- **Solution**: Make sure you redeployed after adding the variable.

## 📝 Quick Copy-Paste Format

Your `FIREBASE_SERVICE_ACCOUNT` should look like this (but with your actual values):

```
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important**: The entire JSON must be on ONE line with no line breaks!

## ✅ Verification Checklist

- [ ] Firebase service account JSON downloaded
- [ ] JSON converted to single-line string
- [ ] Added to Vercel as `FIREBASE_SERVICE_ACCOUNT`
- [ ] Set for all environments (Production, Preview, Development)
- [ ] Redeployed the application
- [ ] Health endpoint returns `firestoreInitialized: true`

