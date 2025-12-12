import React, { useEffect, useState } from "react";
import type { Message } from "@/lib/messageStore";

interface ConversationListProps {
  messages: Message[];
  selectedMessageId?: string;
  onSelectMessage: (messageId: string) => void;
  onMarkRead: (messageId: string) => void;
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

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-800 border-red-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  3: "bg-yellow-100 text-yellow-800 border-yellow-300",
  4: "bg-blue-100 text-blue-800 border-blue-300",
  5: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function ConversationList({
  messages,
  selectedMessageId,
  onSelectMessage,
  onMarkRead,
}: ConversationListProps) {
  const formatTime = (date: string | Date | any) => {
    // Handle Firestore Timestamp
    let d: Date;
    if (date && typeof date === "object" && "toDate" in date) {
      d = date.toDate();
    } else if (typeof date === "string") {
      d = new Date(date);
    } else {
      d = date as Date;
    }
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (hours < 168) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getPreview = (message: Message) => {
    if (message.summary) return message.summary;
    if (message.subject) return message.subject;
    return message.body.substring(0, 100) + (message.body.length > 100 ? "..." : "");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
        <p className="text-sm text-gray-500 mt-1">{messages.length} messages</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Messages from your channels will appear here</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSelected = message.id === selectedMessageId;
            const isUnread = !message.read;

            return (
              <div
                key={message.id}
                onClick={() => {
                  onSelectMessage(message.id!);
                  if (isUnread) {
                    onMarkRead(message.id!);
                  }
                }}
                className={`
                  p-4 border-b border-gray-100 cursor-pointer transition-colors
                  ${isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"}
                  ${isUnread ? "bg-blue-50/50" : ""}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl" title={message.channel}>
                      {channelIcons[message.channel] || channelIcons.generic}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {message.from.name}
                    </span>
                    {message.priority && message.priority <= 2 && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          priorityColors[message.priority] || priorityColors[3]
                        }`}
                      >
                        P{message.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(message.receivedAt)}
                  </span>
                </div>

                {message.subject && (
                  <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                    {message.subject}
                  </p>
                )}

                <p className="text-sm text-gray-600 line-clamp-2">{getPreview(message)}</p>

                {message.tags && message.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {message.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isUnread && (
                  <div className="mt-2">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
