#!/bin/bash

# Helper script to format Firebase service account JSON for Vercel
# Usage: ./format-firebase-key.sh path/to/firebase-service-account.json

if [ -z "$1" ]; then
  echo "Usage: ./format-firebase-key.sh <path-to-firebase-service-account.json>"
  echo ""
  echo "Example:"
  echo "  ./format-firebase-key.sh ~/Downloads/firebase-service-account.json"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "❌ Error: File not found: $1"
  exit 1
fi

echo "📋 Formatting Firebase service account JSON for Vercel..."
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "⚠️  jq not found. Installing via Homebrew or using Python fallback..."
  
  # Try Python as fallback
  if command -v python3 &> /dev/null; then
    python3 -c "import json, sys; print(json.dumps(json.load(open('$1')), separators=(',', ':')))" | pbcopy
    echo "✅ JSON formatted and copied to clipboard!"
    echo ""
    echo "📝 Paste this into Vercel as FIREBASE_SERVICE_ACCOUNT:"
    echo ""
    python3 -c "import json, sys; print(json.dumps(json.load(open('$1')), separators=(',', ':')))"
  else
    echo "❌ Error: Need jq or python3 to format JSON"
    echo "Install jq: brew install jq"
    exit 1
  fi
else
  # Use jq to format and copy to clipboard
  jq -c . "$1" | pbcopy
  echo "✅ JSON formatted and copied to clipboard!"
  echo ""
  echo "📝 Paste this into Vercel as FIREBASE_SERVICE_ACCOUNT:"
  echo ""
  jq -c . "$1"
fi

echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "2. Add new variable:"
echo "   Name: FIREBASE_SERVICE_ACCOUNT"
echo "   Value: (paste from clipboard - already copied!)"
echo "   Environment: All (Production, Preview, Development)"
echo "3. Save and redeploy"

