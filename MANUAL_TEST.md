# Manual Testing Guide

## 🧪 Step-by-Step Testing

### Step 1: Health Check ✅
Open in browser or use curl:
```
https://your-app.vercel.app/api/health
```

**Expected**: Should show `firestoreInitialized: true`

### Step 2: Send Test Message 📨

**Option A: Using curl**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Test Customer", "email": "test@example.com"},
    "body": "URGENT: I need help with my order #12345. It has been 3 days and I have not received it. This is critical! Can you please check the status immediately?",
    "subject": "Urgent: Order Status Check",
    "channel": "email"
  }'
```

**Option B: Using Postman/Insomnia**
- Method: POST
- URL: `https://your-app.vercel.app/api/webhooks/generic`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "from": {"name": "Test Customer", "email": "test@example.com"},
  "body": "URGENT: I need help with my order #12345. It has been 3 days and I have not received it. This is critical!",
  "subject": "Urgent: Order Status Check",
  "channel": "email"
}
```

**Expected Response**: `{"ok": true, "id": "message-id-here"}`

### Step 3: Check UI 🖥️

1. Open your app URL in browser: `https://your-app.vercel.app`
2. You should see:
   - Sidebar on the left
   - Message list in the middle
   - Your test message should appear

### Step 4: Wait for AI Processing ⏳

1. Wait 5-10 seconds
2. Refresh the page
3. Click on your test message
4. You should see:
   - ✅ **AI Summary** (blue box at top)
   - ✅ **Priority Badge** (1-5, should be 1 for "URGENT")
   - ✅ **Key Points** (if applicable)
   - ✅ **Action Items** (if applicable)
   - ✅ **Intent Badge** (question/request/complaint)
   - ✅ **Tags** (urgent, customer, etc.)
   - ✅ **Sentiment** (positive/neutral/negative)

### Step 5: Test Different Message Types 📝

**Test Question:**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "John Doe", "email": "john@example.com"},
    "body": "What is the status of my order? When will it arrive?",
    "subject": "Order Inquiry",
    "channel": "email"
  }'
```

**Test Spam:**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Spammer", "email": "spam@example.com"},
    "body": "Click here for free money! Limited time offer! Act now!",
    "subject": "Free Money",
    "channel": "email"
  }'
```

**Test Positive:**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Happy Customer", "email": "happy@example.com"},
    "body": "Thank you so much! The product is excellent and arrived on time. Great service!",
    "subject": "Thank You",
    "channel": "email"
  }'
```

### Step 6: Test AI Summarization API 🤖

```bash
curl -X POST https://your-app.vercel.app/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi, I need help with my order #12345. It has been 3 days and I have not received it. Can you please check the status? This is urgent!",
    "channel": "email"
  }'
```

**Expected**: Returns priority, summary, key points, action items, intent, etc.

### Step 7: Test Messages API 📬

```bash
curl https://your-app.vercel.app/api/messages?limit=10
```

**Expected**: Returns array of messages with all AI-processed fields

## ✅ What to Verify

- [ ] Health endpoint returns `firestoreInitialized: true`
- [ ] Messages can be sent via webhook
- [ ] Messages appear in UI inbox
- [ ] AI processing completes (wait 5-10 seconds)
- [ ] AI Summary appears in message view
- [ ] Priority badge shows correct level
- [ ] Key Points are extracted (if applicable)
- [ ] Action Items are listed (if applicable)
- [ ] Intent badge shows correct type
- [ ] Tags are applied
- [ ] Sentiment is detected

## 🐛 Troubleshooting

**Messages not appearing?**
- Check Vercel function logs
- Verify webhook returned success
- Check browser console for errors

**AI not processing?**
- Wait longer (10-15 seconds)
- Check Vercel logs for AI errors
- Verify GROQ_API_KEY is set (optional - heuristics work without it)

**UI not loading?**
- Check browser console
- Verify all dependencies installed
- Check Vercel build logs

