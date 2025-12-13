import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "@/components/sidebar";
import ConversationList from "@/components/ConversationList";
import MessageBubble from "@/components/MessageBubble";
import type { Message } from "@/lib/messageStore";

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>();
  const [filter, setFilter] = useState<{ channel?: string; unreadOnly?: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.channel) params.append("channel", filter.channel);
      if (filter.unreadOnly) params.append("unreadOnly", "true");
      params.append("limit", "100");

      const res = await fetch(`/api/messages?${params.toString()}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          router.push("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [filter, authLoading, user]);

  const handleMarkRead = async (messageId: string) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action: "markRead" }),
      });
      fetchMessages(); // Refresh
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleUpdatePriority = async (messageId: string, priority: number) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action: "updatePriority", priority }),
      });
      fetchMessages(); // Refresh
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  // Calculate stats
  const stats = {
    total: messages.length,
    unread: messages.filter((m) => !m.read).length,
    byChannel: messages.reduce((acc, msg) => {
      acc[msg.channel] = (acc[msg.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onFilterChange={setFilter} currentFilter={filter} stats={stats} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 flex-shrink-0">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : (
            <ConversationList
              messages={messages}
              selectedMessageId={selectedMessageId}
              onSelectMessage={setSelectedMessageId}
              onMarkRead={handleMarkRead}
            />
          )}
        </div>

        <div className="flex-1 bg-white">
          {selectedMessage ? (
            <MessageBubble
              message={selectedMessage}
              onMarkRead={() => selectedMessage.id && handleMarkRead(selectedMessage.id)}
              onUpdatePriority={(priority) =>
                selectedMessage.id && handleUpdatePriority(selectedMessage.id, priority)
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-xl mb-2">Select a message to view</p>
                <p className="text-sm">Choose a message from the list to see its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

