#!/bin/bash

# Quick test after Firebase is ready
# Usage: ./test-now.sh <your-vercel-url>

if [ -z "$1" ]; then
  echo "❌ Please provide your Vercel URL"
  echo "Usage: ./test-now.sh https://your-app.vercel.app"
  exit 1
fi

BASE_URL=$1
echo "🧪 Testing Happin - Firebase Ready!"
echo "URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"

if echo "$HEALTH" | grep -q '"firestoreInitialized":true'; then
  echo "✅ Firestore is initialized!"
else
  echo "❌ Firestore not initialized"
  exit 1
fi
echo ""

# Test 2: Send Test Message
echo "2️⃣ Sending urgent test message..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/generic" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "Test Customer", "email": "customer@example.com"},
    "body": "URGENT: I need help with my order #12345. It has been 3 days and I have not received it. This is critical! Can you please check the status immediately?",
    "subject": "Urgent: Order Status Check Required",
    "channel": "email"
  }')

MESSAGE_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
if [ -n "$MESSAGE_ID" ] && [ "$MESSAGE_ID" != "null" ]; then
  echo "✅ Message saved! ID: $MESSAGE_ID"
  echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Failed to save message"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 3: Send Question Message
echo "3️⃣ Sending question message..."
RESPONSE2=$(curl -s -X POST "$BASE_URL/api/webhooks/generic" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "John Doe", "email": "john@example.com"},
    "body": "What is the status of my order? When will it arrive? I need to know for planning purposes.",
    "subject": "Order Inquiry",
    "channel": "email"
  }')

MESSAGE_ID2=$(echo "$RESPONSE2" | jq -r '.id' 2>/dev/null)
if [ -n "$MESSAGE_ID2" ] && [ "$MESSAGE_ID2" != "null" ]; then
  echo "✅ Message saved! ID: $MESSAGE_ID2"
else
  echo "⚠️  Second message may have failed"
fi
echo ""

# Test 4: Wait for AI Processing
echo "4️⃣ Waiting 8 seconds for AI processing..."
sleep 8
echo ""

# Test 5: Fetch Messages
echo "5️⃣ Fetching messages..."
MESSAGES=$(curl -s "$BASE_URL/api/messages?limit=5")
MESSAGE_COUNT=$(echo "$MESSAGES" | jq '.messages | length' 2>/dev/null || echo "0")
echo "Found $MESSAGE_COUNT message(s)"
echo ""

# Test 6: Check AI Processing
if [ "$MESSAGE_COUNT" -gt 0 ]; then
  echo "6️⃣ Checking AI processing on latest message..."
  LATEST=$(echo "$MESSAGES" | jq '.messages[0]' 2>/dev/null)
  
  if [ -n "$LATEST" ]; then
    AI_PROCESSED=$(echo "$LATEST" | jq -r '.aiProcessed' 2>/dev/null)
    PRIORITY=$(echo "$LATEST" | jq -r '.priority' 2>/dev/null)
    SUMMARY=$(echo "$LATEST" | jq -r '.summary' 2>/dev/null)
    INTENT=$(echo "$LATEST" | jq -r '.intent' 2>/dev/null)
    ACTION_REQUIRED=$(echo "$LATEST" | jq -r '.actionRequired' 2>/dev/null)
    
    echo "Latest Message Details:"
    echo "  AI Processed: $AI_PROCESSED"
    echo "  Priority: $PRIORITY"
    echo "  Intent: $INTENT"
    echo "  Action Required: $ACTION_REQUIRED"
    
    if [ -n "$SUMMARY" ] && [ "$SUMMARY" != "null" ]; then
      echo "  Summary: ${SUMMARY:0:100}..."
    fi
    
    if [ "$AI_PROCESSED" = "true" ]; then
      echo "✅ AI processing complete!"
    else
      echo "⏳ AI still processing (wait a bit longer and refresh)"
    fi
  fi
fi
echo ""

# Test 7: Test AI Summarization API
echo "7️⃣ Testing AI Summarization API..."
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
echo "📋 Next Steps:"
echo "1. Open your app in browser: $BASE_URL"
echo "2. You should see your test messages in the inbox"
echo "3. Click on a message to see:"
echo "   - AI Summary (blue box)"
echo "   - Priority badge"
echo "   - Key Points"
echo "   - Action Items"
echo "   - Intent badge"
echo "   - Tags and sentiment"
echo ""
echo "4. If AI processing shows 'false', wait 10-15 seconds and refresh"

