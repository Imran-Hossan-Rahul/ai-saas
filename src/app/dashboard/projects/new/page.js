"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low",
    revenue: "",
    deadline: "",
    ownerId: "", // This will be the client
  });

  useEffect(() => {
    // Fetch available clients
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/users/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (err) {
        console.error("Failed to fetch clients");
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading("Creating workspace...");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          revenue: Number(formData.revenue),
        }),
      });

      if (res.ok) {
        const project = await res.json();
        toast.success("Workspace created successfully!", { id: loadingToast });
        router.push("/dashboard/projects/" + project._id);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create project", { id: loadingToast });
        setLoading(false);
      }
    } catch (err) {
      toast.error("An unexpected error occurred.", { id: loadingToast });
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors group mb-8">
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-indigo-400" size={24} />
          <h1 className="text-3xl font-bold text-white">New Workspace</h1>
        </div>
        <p className="text-slate-400 mb-8">Create a new project and invite your client to collaborate.</p>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="e.g. Acme Corp Rebranding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
                  placeholder="Describe the scope of work..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign Client</label>
                <select
                  required
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name} ({client.email})</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-xs text-amber-400 mt-2">No clients found. Have your client register first.</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Revenue ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Deadline</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={"py-3 px-2 text-center rounded-xl border text-sm font-medium capitalize transition-all " + (formData.priority === p ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-slate-950/50 border-slate-700 text-slate-400 hover:bg-slate-800")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.ownerId}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 flex items-center disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
