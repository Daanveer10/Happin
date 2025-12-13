# Testing Guide for Happin

## 🧪 Quick Test Checklist

### 1. Health Check
Test if the API is running:
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "ok": true,
  "service": "happin",
  "env": "production",
  "firestoreConfigured": true
}
```

### 2. Test Generic Webhook
Send a test message via the generic webhook:

```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Test User", "email": "test@example.com"},
    "body": "This is an urgent test message. I need help with my order #12345. Can you please check the status?",
    "subject": "Urgent: Order Status Check",
    "channel": "email"
  }'
```

### 3. Test AI Summarization API
Test the AI summarization endpoint:

```bash
curl -X POST https://your-domain.vercel.app/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi, I need help with my order #12345. It has been 3 days and I have not received it. This is urgent!",
    "channel": "email"
  }'
```

### 4. Test Messages API
Fetch messages:

```bash
curl https://your-domain.vercel.app/api/messages?limit=10
```

## 📱 Testing Webhooks

### Test Twilio Webhook (WhatsApp/SMS)
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM123&From=whatsapp:+1234567890&To=whatsapp:+0987654321&Body=Test message from WhatsApp"
```

### Test Slack Webhook
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/slack \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event_callback",
    "event": {
      "type": "message",
      "text": "This is a test message from Slack",
      "user": "U123456",
      "channel": "C123456",
      "ts": "1234567890.123456"
    },
    "team_id": "T123456"
  }'
```

### Test Email Webhook
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{
    "headers": {
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "subject": "Test Email",
      "message-id": "test-123"
    },
    "text": "This is a test email message",
    "html": "<p>This is a test email message</p>"
  }'
```

## 🎯 Testing AI Features

### Test Priority Detection
Send messages with different urgency levels:

**Urgent Message:**
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Customer"},
    "body": "URGENT: System is down! Need immediate help!",
    "channel": "email"
  }'
```

**Question Message:**
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Customer"},
    "body": "What is the status of my order?",
    "channel": "email"
  }'
```

**Spam Message:**
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Spammer"},
    "body": "Click here for free money! Limited time offer!",
    "channel": "email"
  }'
```

## ✅ Verification Steps

1. **Check Firestore**: Verify messages are being saved
2. **Check AI Processing**: Wait a few seconds, then check if messages have:
   - `priority` field
   - `summary` field
   - `aiProcessed: true`
   - `intent` field
   - `actionItems` array

3. **Check UI**: 
   - Open your deployed app URL
   - Messages should appear in the inbox
   - AI summary should be visible
   - Priority badges should show
   - Action items should be listed

## 🐛 Troubleshooting

### Messages not appearing?
- Check Firestore rules allow reads
- Verify webhook is receiving requests (check Vercel logs)
- Check browser console for errors

### AI not processing?
- Verify `GROQ_API_KEY` is set (or heuristics will be used)
- Check Vercel function logs for AI processing errors
- Wait a few seconds - AI processes asynchronously

### Build errors?
- Check Vercel deployment logs
- Verify all dependencies are in `package.json`
- Check TypeScript errors

## 📊 Expected Results

After sending a test message, you should see:

1. **In Firestore**: Message document with all fields
2. **In UI**: Message appears in inbox
3. **AI Features** (after ~2-5 seconds):
   - Priority badge (1-5)
   - AI Summary box
   - Key Points (if applicable)
   - Action Items (if applicable)
   - Intent badge
   - Tags
   - Sentiment indicator

