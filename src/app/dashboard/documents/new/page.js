"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewDocumentPage() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIDrafting, setIsAIDrafting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "proposal",
    title: "",
    clientId: "",
    projectId: "",
    amount: "",
    content: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          fetch(`/api/clients?workspaceId=${activeWorkspace._id}`),
          fetch(`/api/projects?workspaceId=${activeWorkspace._id}`)
        ]);
        
        const clientsData = await clientsRes.json();
        const projectsData = await projectsRes.json();
        
        if (clientsRes.ok) setClients(clientsData.clients || []);
        if (projectsRes.ok) setProjects(projectsData.projects || []);
      } catch (error) {
        console.error("Failed to fetch form data");
      }
    };

    if (activeWorkspace?._id) {
      fetchData();
    }
  }, [activeWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId || !formData.content) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, workspaceId: activeWorkspace._id }),
      });
      
      if (res.ok) {
        toast.success("Document created successfully!");
        router.push("/dashboard/documents");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create document");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIDraft = async () => {
    if (!formData.projectId || !formData.clientId) {
      toast.error("Please select both a Client and a Project first.");
      return;
    }
    setIsAIDrafting(true);
    try {
      const res = await fetch("/api/ai/proposal-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.projectId,
          clientId: formData.clientId,
          workspaceId: activeWorkspace._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("AI Draft saved! Redirecting to Documents…");
        router.push("/dashboard/documents");
      } else {
        toast.error(data.error || "Failed to generate AI proposal");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsAIDrafting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/documents" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />

            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Document</h1>
              <p className="text-slate-400 text-sm">Draft a new proposal or contract.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleAIDraft}
              disabled={isAIDrafting}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition-all text-sm"
            >
              {isAIDrafting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-indigo-400" />}
              {isAIDrafting ? "Generating…" : "AI Draft"}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-sm flex items-center transition-all"
            >
              <Save size={18} className="mr-2" />
              {isSubmitting ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <input 
                type="text" 
                placeholder="Document Title (e.g. Website Redesign Proposal)"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-transparent border-b border-slate-800 pb-4 text-2xl font-bold text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 mb-6 transition-colors"
              />
              
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[500px]">
                {/* Formatting Toolbar (Mock for UI) */}
                <div className="bg-slate-900 border-b border-slate-800 p-2 flex gap-2">
                  {['B', 'I', 'U'].map(btn => (
                    <button key={btn} className="w-8 h-8 rounded border border-slate-700 bg-slate-800 text-slate-400 flex items-center justify-center font-serif font-bold text-sm hover:bg-slate-700">
                      {btn}
                    </button>
                  ))}
                </div>
                {/* Editor Area */}
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Start typing your document content here..."
                  className="flex-1 w-full bg-transparent p-6 text-slate-300 focus:outline-none resize-none leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Document Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Document Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="proposal">Proposal</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Client (Required)</label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name} {client.companyName ? `(${client.companyName})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Link to Project (Optional)</label>
                  <select 
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">None</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>{project.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Value / Amount ($)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <FileText className="text-indigo-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-300 mb-1">E-Sign Ready</h4>
                  <p className="text-xs text-indigo-200/70 leading-relaxed">
                    Once saved, you can generate a public link to send to your client. They can sign this document digitally from any device without needing to log in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
