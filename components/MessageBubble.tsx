import React from "react";
import type { Message } from "@/lib/messageStore";

interface MessageBubbleProps {
  message: Message;
  onMarkRead?: () => void;
  onUpdatePriority?: (priority: number) => void;
}

const channelColors: Record<string, string> = {
  whatsapp: "#25D366",
  slack: "#4A154B",
  email: "#4285F4",
  linkedin: "#0077B5",
  sms: "#34B7F1",
  generic: "#6B7280",
};

const channelIcons: Record<string, string> = {
  whatsapp: "💬",
  slack: "💼",
  email: "📧",
  linkedin: "💼",
  sms: "📱",
  generic: "📨",
};

const sentimentColors: Record<string, string> = {
  positive: "text-green-600",
  negative: "text-red-600",
  neutral: "text-gray-600",
};

export default function MessageBubble({ message, onMarkRead, onUpdatePriority }: MessageBubbleProps) {
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{channelIcons[message.channel] || channelIcons.generic}</span>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {message.from.name}
                {message.from.email && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {message.from.email}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                via {message.channel.charAt(0).toUpperCase() + message.channel.slice(1)}
                {message.channelData.slackChannel && ` • ${message.channelData.slackChannel}`}
              </p>
            </div>
          </div>

          {message.priority && (
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                Priority {message.priority}
              </span>
              {message.priorityReason && (
                <p className="text-xs text-gray-500 mt-1">{message.priorityReason}</p>
              )}
            </div>
          )}
        </div>

        {message.subject && (
          <h2 className="text-lg font-medium text-gray-900 mb-2">{message.subject}</h2>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatDate(message.receivedAt)}</span>
          {message.sentiment && (
            <span className={sentimentColors[message.sentiment]}>
              {message.sentiment.charAt(0).toUpperCase() + message.sentiment.slice(1)} sentiment
            </span>
          )}
          {message.category && (
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
              {message.category}
            </span>
          )}
        </div>
      </div>

      {/* Message Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {message.summary && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
            <p className="text-blue-800">{message.summary}</p>
          </div>
        )}

        <div className="prose max-w-none">
          {message.htmlBody ? (
            <div dangerouslySetInnerHTML={{ __html: message.htmlBody }} />
          ) : (
            <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>
          )}
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
            <div className="grid grid-cols-2 gap-4">
              {message.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{att.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{att.type}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {message.tags && message.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {message.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          {!message.read && onMarkRead && (
            <button
              onClick={onMarkRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Read
            </button>
          )}
          {onUpdatePriority && (
            <select
              value={message.priority || 3}
              onChange={(e) => onUpdatePriority(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={1}>Priority 1 - Urgent</option>
              <option value={2}>Priority 2 - High</option>
              <option value={3}>Priority 3 - Medium</option>
              <option value={4}>Priority 4 - Low</option>
              <option value={5}>Priority 5 - Very Low</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
