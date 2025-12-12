# Happin Data Schema

## Messages Collection (`messages`)

Unified message storage across all channels.

```typescript
{
  id: string,                    // Firestore document ID
  channel: string,               // "whatsapp" | "slack" | "email" | "linkedin" | "sms" | "generic"
  channelId: string,             // Unique ID from the source channel (e.g., Slack message_ts, email message-id)
  threadId?: string,             // For grouping related messages (e.g., email thread, Slack thread)
  
  // Sender information
  from: {
    name: string,                // Display name
    email?: string,              // Email if available
    phone?: string,              // Phone if available
    userId?: string,             // Channel-specific user ID
    avatar?: string              // Profile picture URL
  },
  
  // Recipient information
  to?: {
    name: string,
    email?: string,
    phone?: string,
    userId?: string
  }[],
  
  // Message content
  subject?: string,              // Email subject, Slack thread title
  body: string,                 // Main message content
  htmlBody?: string,             // HTML version if available
  attachments?: {
    name: string,
    url: string,
    type: string,
    size?: number
  }[],
  
  // Metadata
  receivedAt: Timestamp,        // When message was received
  sentAt?: Timestamp,           // Original send time from channel
  read: boolean,                // Read status
  archived: boolean,            // Archived status
  
  // AI Processing
  priority?: number,             // 1-5 (1 = urgent, 5 = low)
  priorityReason?: string,      // Why this priority was assigned
  summary?: string,             // AI-generated summary
  category?: string,            // "question" | "task" | "info" | "urgent" | "spam"
  tags?: string[],              // AI-generated or manual tags
  sentiment?: "positive" | "neutral" | "negative",
  
  // Channel-specific data
  channelData: {
    // WhatsApp/Twilio
    twilioSid?: string,
    whatsappFrom?: string,
    
    // Slack
    slackChannel?: string,
    slackTeam?: string,
    slackThreadTs?: string,
    
    // Email
    emailMessageId?: string,
    emailHeaders?: Record<string, string>,
    
    // LinkedIn
    linkedinConversationId?: string,
    
    // Generic
    [key: string]: any
  },
  
  // Processing status
  aiProcessed: boolean,         // Whether AI has processed this message
  aiProcessedAt?: Timestamp,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Conversations Collection (`conversations`)

Grouped conversations/threads for better UX.

```typescript
{
  id: string,
  participants: {
    name: string,
    email?: string,
    phone?: string,
    channel: string
  }[],
  channels: string[],            // ["email", "slack"] - multi-channel conversations
  lastMessageAt: Timestamp,
  lastMessage: string,          // Preview of last message
  unreadCount: number,
  priority: number,             // Highest priority in conversation
  summary?: string,             // AI summary of entire conversation
  tags?: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "receivedAt", "order": "DESCENDING" },
        { "fieldPath": "priority", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "channel", "order": "ASCENDING" },
        { "fieldPath": "receivedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "receivedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
