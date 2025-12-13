#!/bin/bash

# Quick test script for Happin
# Usage: ./quick-test.sh <your-vercel-url>

if [ -z "$1" ]; then
  echo "❌ Please provide your Vercel URL"
  echo "Usage: ./quick-test.sh https://your-app.vercel.app"
  exit 1
fi

BASE_URL=$1
echo "🧪 Testing Happin at: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
echo ""

# Check if Firestore is configured
if echo "$HEALTH" | grep -q '"firestoreInitialized":true'; then
  echo "✅ Firestore is initialized!"
else
  echo "❌ Firestore not initialized - check VERCEL_SETUP.md"
  exit 1
fi
echo ""

# Test 2: Send Test Message
echo "2️⃣ Sending test message via generic webhook..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/generic" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Test Customer", "email": "test@example.com"},
    "body": "URGENT: I need help with my order #12345. It has been 3 days and I have not received it. This is critical! Can you please check the status immediately?",
    "subject": "Urgent: Order Status Check Required",
    "channel": "email"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

MESSAGE_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
if [ -n "$MESSAGE_ID" ] && [ "$MESSAGE_ID" != "null" ]; then
  echo "✅ Message saved! ID: $MESSAGE_ID"
else
  echo "❌ Failed to save message"
  exit 1
fi
echo ""

# Test 3: Wait for AI processing
echo "3️⃣ Waiting 5 seconds for AI processing..."
sleep 5
echo ""

# Test 4: Fetch messages
echo "4️⃣ Fetching messages..."
MESSAGES=$(curl -s "$BASE_URL/api/messages?limit=5")
MESSAGE_COUNT=$(echo "$MESSAGES" | jq '.messages | length' 2>/dev/null || echo "0")
echo "Found $MESSAGE_COUNT message(s)"
echo ""

# Test 5: Check AI processing
echo "5️⃣ Checking AI processing..."
if [ "$MESSAGE_COUNT" -gt 0 ]; then
  LATEST=$(echo "$MESSAGES" | jq '.messages[0]' 2>/dev/null)
  if [ -n "$LATEST" ]; then
    AI_PROCESSED=$(echo "$LATEST" | jq -r '.aiProcessed' 2>/dev/null)
    PRIORITY=$(echo "$LATEST" | jq -r '.priority' 2>/dev/null)
    SUMMARY=$(echo "$LATEST" | jq -r '.summary' 2>/dev/null)
    
    if [ "$AI_PROCESSED" = "true" ]; then
      echo "✅ AI processing complete!"
      echo "   Priority: $PRIORITY"
      if [ -n "$SUMMARY" ] && [ "$SUMMARY" != "null" ]; then
        echo "   Summary: ${SUMMARY:0:100}..."
      fi
    else
      echo "⏳ AI still processing (this is normal, wait a bit longer)"
    fi
  fi
fi
echo ""

# Test 6: Test AI Summarization API
echo "6️⃣ Testing AI Summarization API..."
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi, I need help with my order #12345. It has been 3 days and I have not received it. Can you please check the status? This is urgent!",
    "channel": "email"
  }')

echo "$AI_RESPONSE" | jq '.' 2>/dev/null || echo "$AI_RESPONSE"
echo ""

echo "✅ Testing complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open your app in browser: $BASE_URL"
echo "2. Check the inbox for your test message"
echo "3. Wait 5-10 seconds and refresh to see AI processing"
echo "4. Click on the message to see AI summary, priority, and action items"

