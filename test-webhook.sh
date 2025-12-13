#!/bin/bash

# Happin Webhook Testing Script
# Usage: ./test-webhook.sh <your-vercel-url>

if [ -z "$1" ]; then
  echo "Usage: ./test-webhook.sh <your-vercel-url>"
  echo "Example: ./test-webhook.sh https://happin.vercel.app"
  exit 1
fi

BASE_URL=$1

echo "🧪 Testing Happin Webhooks..."
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint..."
curl -s "$BASE_URL/api/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Generic Webhook - Urgent Message
echo "2️⃣ Testing Generic Webhook (Urgent Message)..."
curl -s -X POST "$BASE_URL/api/webhooks/generic" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Test Customer", "email": "test@example.com"},
    "body": "URGENT: I need help with my order #12345. It has been 3 days and I have not received it. This is critical!",
    "subject": "Urgent: Order Status Check",
    "channel": "email"
  }' | jq '.' || echo "❌ Generic webhook failed"
echo ""

# Test 3: Generic Webhook - Question
echo "3️⃣ Testing Generic Webhook (Question)..."
curl -s -X POST "$BASE_URL/api/webhooks/generic" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "John Doe", "email": "john@example.com"},
    "body": "What is the status of my order? When will it arrive?",
    "subject": "Order Inquiry",
    "channel": "email"
  }' | jq '.' || echo "❌ Generic webhook failed"
echo ""

# Test 4: AI Summarization
echo "4️⃣ Testing AI Summarization..."
curl -s -X POST "$BASE_URL/api/ai/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi, I need help with my order #12345. It has been 3 days and I have not received it. Can you please check the status? This is urgent!",
    "channel": "email"
  }' | jq '.' || echo "❌ AI summarization failed"
echo ""

# Test 5: Fetch Messages
echo "5️⃣ Fetching Messages..."
curl -s "$BASE_URL/api/messages?limit=5" | jq '.messages | length' && echo "messages found" || echo "❌ Failed to fetch messages"
echo ""

echo "✅ Testing complete!"
echo ""
echo "Next steps:"
echo "1. Check your Vercel logs for any errors"
echo "2. Open your app URL in browser to see messages"
echo "3. Wait 5-10 seconds for AI processing to complete"
echo "4. Refresh the page to see AI-processed messages"

