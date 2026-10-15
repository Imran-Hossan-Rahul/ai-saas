"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, MessageSquare, FileText, Mail, BarChart3, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODES = [
  { id: "chat",     label: "Assistant",  icon: MessageSquare, placeholder: "Ask anything about this project…",       apiPath: "/api/ai/proposal" },
  { id: "proposal", label: "Proposal",   icon: FileText,      placeholder: "Describe scope, deliverables, budget…",  apiPath: "/api/ai/proposal" },
  { id: "email",    label: "Email Draft", icon: Mail,         placeholder: "e.g. Request client feedback on Phase 1…", apiPath: "/api/ai/proposal" },
  { id: "summary",  label: "Summary",    icon: BarChart3,     placeholder: "Summarize current project status…",       apiPath: "/api/ai/proposal" },
];

const MODE_SYSTEM_HINTS = {
  chat:     "The user wants general assistance or project intelligence. Be concise and helpful.",
  proposal: "The user wants to draft a professional client proposal. Structure it with: Executive Summary, Scope of Work, Investment, and Next Steps.",
  email:    "The user wants a ready-to-send professional client email. Provide SUBJECT: on the first line, then the full body below it.",
  summary:  "The user wants a concise executive summary of the current project state for a client update. Format it as a clean status report.",
};

export default function AIAssistant({ projectId, projectName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your AI assistant for **${projectName}**. I can help you:\n\n- **Chat** — Answer questions about the project\n- **Proposal** — Draft a professional proposal\n- **Email** — Write client emails\n- **Summary** — Generate a status update\n\nSwitch modes using the button above. How can I help?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const modeHint = MODE_SYSTEM_HINTS[activeMode.id] || "";
    const enrichedPrompt = `[MODE: ${activeMode.label.toUpperCase()}] ${modeHint}\n\nUser: ${prompt}`;

    const userMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch(activeMode.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enrichedPrompt, projectId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.proposal || data.email?.body || data.content || "Done." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${data.error}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to connect to AI server. Check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const ActiveIcon = activeMode.icon;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl shadow-indigo-900/40 transition-all duration-300 border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2.5 z-40 ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}`}
      >
        <Sparkles size={22} />
        <span className="text-sm font-semibold pr-1">AI</span>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-8 right-8 w-[420px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right z-40 flex flex-col ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
        style={{ height: "560px" }}
      >
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-indigo-400" />
            <span className="font-bold text-white text-sm tracking-wide">AI Assistant</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{projectName}</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/50 shrink-0 relative">
          <button
            onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
            className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ActiveIcon size={16} className="text-indigo-400" />
              Mode: {activeMode.label}
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isModeMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isModeMenuOpen && (
            <div className="absolute top-full left-4 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden mt-1">
              {MODES.map(mode => {
                const ModeIcon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { setActiveMode(mode); setIsModeMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeMode.id === mode.id ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300 hover:bg-slate-700"}`}
                  >
                    <ModeIcon size={16} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm"
              }`}>
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                    }}
                  >{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700/50 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={15} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={activeMode.placeholder}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
