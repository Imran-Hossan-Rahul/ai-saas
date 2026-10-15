"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Users, Plus, Search, Building2, Phone, Mail, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const { activeWorkspace } = useWorkspace();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", email: "", companyName: "", phone: "", address: "", notes: "", status: "active"
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/clients?workspaceId=${activeWorkspace._id}`);
        const data = await res.json();
        if (res.ok) {
          setClients(data.clients);
        }
      } catch (error) {
        toast.error("Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeWorkspace?._id) {
      fetchClients();
    }
  }, [activeWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, workspaceId: activeWorkspace._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setClients([data.client, ...clients]);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", companyName: "", phone: "", address: "", notes: "", status: "active" });
        toast.success("Client added successfully");
      } else {
        toast.error(data.error || "Failed to add client");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Users className="text-indigo-400" size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Clients</h1>
              <p className="text-slate-400 text-sm">Manage your client directory and CRM data.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-sm flex items-center transition-all"
          >
            <Plus size={18} className="mr-2" /> New Client
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-48 bg-slate-900/50 rounded-3xl border border-slate-800"></div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No clients found</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Build your CRM by adding your first client contact.</p>
            <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
              Add Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              <div key={client._id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{client.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {client.status}
                      </span>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="space-y-3 mt-6">
                  {client.companyName && (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Building2 size={16} className="text-slate-500" />
                      <span className="truncate">{client.companyName}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Mail size={16} className="text-slate-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Phone size={16} className="text-slate-500" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Client Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                  <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Private Notes</label>
                <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
