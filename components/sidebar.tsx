import React from "react";

interface SidebarProps {
  onFilterChange: (filter: { channel?: string; unreadOnly?: boolean }) => void;
  currentFilter: { channel?: string; unreadOnly?: boolean };
  stats: {
    total: number;
    unread: number;
    byChannel: Record<string, number>;
  };
}

const channels = [
  { id: "all", name: "All Channels", icon: "📬" },
  { id: "email", name: "Email", icon: "📧" },
  { id: "slack", name: "Slack", icon: "💼" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "sms", name: "SMS", icon: "📱" },
];

export default function Sidebar({ onFilterChange, currentFilter, stats }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Happin</h1>
        <p className="text-sm text-gray-400 mt-1">Unified Inbox</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Messages</span>
            <span className="text-lg font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Unread</span>
            <span className="text-lg font-semibold text-blue-400">{stats.unread}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Filters</h2>
          <label className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={currentFilter.unreadOnly || false}
              onChange={(e) =>
                onFilterChange({ ...currentFilter, unreadOnly: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm">Unread Only</span>
          </label>
        </div>

        {/* Channels */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Channels</h2>
          <div className="space-y-1">
            {channels.map((channel) => {
              const isActive = currentFilter.channel === channel.id || (!currentFilter.channel && channel.id === "all");
              const count = channel.id === "all" ? stats.total : stats.byChannel[channel.id] || 0;

              return (
                <button
                  key={channel.id}
                  onClick={() =>
                    onFilterChange({
                      ...currentFilter,
                      channel: channel.id === "all" ? undefined : channel.id,
                    })
                  }
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left
                    ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span>{channel.icon}</span>
                    <span className="text-sm font-medium">{channel.name}</span>
                  </div>
                  {count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isActive ? "bg-blue-700" : "bg-gray-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          Powered by AI • Unified Communication
        </p>
      </div>
    </div>
  );
}
