"use client";

import { useState } from "react";
import { Mail, Sparkles, X, Copy, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const PURPOSES = [
  "Project kickoff introduction",
  "Requesting client feedback",
  "Sending a project update",
  "Requesting overdue payment",
  "Following up on proposal",
  "Delivering final project",
  "Asking for a review/testimonial",
  "Apologizing for a delay",
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "assertive", label: "Assertive" },
  { value: "apologetic", label: "Apologetic" },
];

export default function AIEmailWriter({ projectId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [tone, setTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const finalPurpose = purpose === "custom" ? customPurpose : purpose;
    if (!finalPurpose.trim()) {
      toast.error("Please select or describe the email purpose.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, purpose: finalPurpose, tone, additionalContext }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.email);
      } else {
        toast.error(data.error || "Failed to generate email");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setPurpose("");
    setAdditionalContext("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
      >
        <Mail size={16} />
        AI Email
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>

          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="text-indigo-400" size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">AI Email Writer</h2>
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!result ? (
                <>
                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Email Purpose</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {PURPOSES.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPurpose(p)}
                          className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                            purpose === p
                              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPurpose("custom")}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors col-span-2 ${
                          purpose === "custom"
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        ✏️ Custom purpose...
                      </button>
                    </div>
                    {purpose === "custom" && (
                      <input
                        type="text"
                        placeholder="Describe what the email is about..."
                        value={customPurpose}
                        onChange={e => setCustomPurpose(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tone</label>
                    <div className="flex gap-2 flex-wrap">
                      {TONES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTone(t.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            tone === t.value
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Context */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Additional Context (Optional)</label>
                    <textarea
                      rows={3}
                      value={additionalContext}
                      onChange={e => setAdditionalContext(e.target.value)}
                      placeholder="e.g. Invoice is 3 days overdue, amount is $1,200..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !purpose}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate Email</>}
                  </button>
                </>
              ) : (
                /* Result */
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-semibold">
                      {result.subject}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Body</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed min-h-[200px]">
                      {result.body}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopy}
                      className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        copied
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      }`}
                    >
                      {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Copy size={18} /> Copy Email</>}
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="px-5 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-medium transition-colors text-sm"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
