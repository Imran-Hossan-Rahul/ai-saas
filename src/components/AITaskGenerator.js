"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AITaskGenerator({ projectId, onTasksGenerated }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Tasks generated successfully!");
        setIsOpen(false);
        setPrompt("");
        if (onTasksGenerated) {
          onTasksGenerated();
        } else {
          router.refresh();
        }
      } else {
        toast.error(data.error || "Failed to generate tasks");
      }
    } catch (error) {
      toast.error("An error occurred while connecting to AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md transition-all active:scale-95 text-sm flex items-center gap-2"
      >
        <Sparkles size={16} /> AI Auto-Generate Tasks
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-400" />
                Generate Tasks with AI
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Describe what needs to be done:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build a landing page for the marketing campaign by next Friday, including design, copywriting, and deployment."
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isLoading ? "Generating..." : "Generate Tasks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
