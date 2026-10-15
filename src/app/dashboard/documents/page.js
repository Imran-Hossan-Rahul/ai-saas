"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { FileSignature, Plus, Search, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/documents?workspaceId=${activeWorkspace._id}`);
        const data = await res.json();
        if (res.ok) {
          setDocuments(data.documents);
        }
      } catch (error) {
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeWorkspace?._id) {
      fetchDocuments();
    }
  }, [activeWorkspace]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'viewed': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'sent': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'declined': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700'; // draft
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <FileSignature className="text-indigo-400" size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Proposals & Contracts</h1>
              <p className="text-slate-400 text-sm">Create and track documents for e-signatures.</p>
            </div>
          </div>
          
          <Link 
            href="/dashboard/documents/new"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-sm flex items-center transition-all"
          >
            <Plus size={18} className="mr-2" /> New Document
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-48 bg-slate-900/50 rounded-3xl border border-slate-800"></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
            <FileSignature className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first proposal or contract to send to clients for signature.</p>
            <Link href="/dashboard/documents/new" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
              Create Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => (
              <div key={doc._id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded uppercase tracking-wider">
                    {doc.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {doc.title}
                </h3>
                
                <div className="space-y-2 mt-auto pt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Client:</span>
                    <span className="text-slate-300 font-medium truncate ml-2 max-w-[150px]">
                      {doc.client?.name || "Unknown"}
                    </span>
                  </div>
                  {doc.amount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Value:</span>
                      <span className="text-emerald-400 font-semibold">${doc.amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-2 mt-2">
                    <span className="text-slate-500 text-xs">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/document/${doc._id}`} target="_blank" className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors" title="Public Link">
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
