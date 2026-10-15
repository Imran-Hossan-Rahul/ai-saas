"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useWorkspace } from "./WorkspaceProvider";
import { Send, MessageCircle, User } from "lucide-react";
import toast from "react-hot-toast";

export default function MessagingPanel({ projectId, currentUserId }) {
  const { activeWorkspace } = useWorkspace();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const fetcher = url => fetch(url).then(r => r.json());
  const { data, mutate } = useSWR(`/api/messages?projectId=${projectId}`, fetcher, {
    refreshInterval: 8000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending || !activeWorkspace?._id) return;

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      text: text.trim(),
      sender: { _id: currentUserId, name: "You" },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          workspaceId: activeWorkspace._id,
          text: optimisticMsg.text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev =>
          prev.map(m => m._id === optimisticMsg._id ? data.message : m)
        );
      } else {
        // Rollback optimistic update
        setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
        toast.error("Failed to send message");
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      toast.error("Network error");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isOwnMessage = (msg) => msg.sender?._id?.toString() === currentUserId?.toString();

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/70 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <MessageCircle className="text-indigo-400" size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Project Chat</h3>
          <p className="text-xs text-slate-500">Messages are visible to all project members</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="text-slate-700 mb-3" size={36} />
            <p className="text-slate-500 text-sm">No messages yet.</p>
            <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = isOwnMessage(msg);
            return (
              <div key={msg._id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isOwn
                    ? "bg-indigo-600/30 border-indigo-500/40 text-indigo-300"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}>
                  {msg.sender?.name?.charAt(0).toUpperCase() || <User size={14} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-baseline gap-2">
                    {!isOwn && <span className="text-xs font-semibold text-slate-400">{msg.sender?.name || "Unknown"}</span>}
                    <span className="text-[10px] text-slate-600">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm"
                  } ${msg.isOptimistic ? "opacity-60" : ""}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-3 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
