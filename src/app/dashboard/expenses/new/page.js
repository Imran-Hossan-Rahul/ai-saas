"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Receipt } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewExpensePage() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId");
  
  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    projectId: initialProjectId || "",
    amount: "",
    category: "Software/Tools",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    "Software/Tools",
    "Contractor/Freelancer",
    "Advertising/Marketing",
    "Travel",
    "Office Supplies",
    "Other"
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/projects?workspaceId=${activeWorkspace._id}`);
        const data = await res.json();
        if (res.ok) setProjects(data.projects || []);
      } catch (error) {
        console.error("Failed to fetch projects");
      }
    };

    if (activeWorkspace?._id) {
      fetchProjects();
    }
  }, [activeWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId || !formData.amount || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, workspaceId: activeWorkspace._id }),
      });
      
      if (res.ok) {
        toast.success("Expense logged successfully!");
        router.push(`/dashboard/projects/${formData.projectId}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to log expense");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans flex items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Log Expense</h1>
            <p className="text-slate-400 text-sm">Track project costs to calculate profitability.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Project (Required)</label>
            <select 
              value={formData.projectId}
              onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors text-left ${formData.category === cat ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Description (Optional)</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g. Figma annual subscription"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {isSubmitting ? "Saving..." : "Log Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
