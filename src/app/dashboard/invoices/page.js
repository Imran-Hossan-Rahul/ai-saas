import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Invoice from "@/models/invoice.model";
import Project from "@/models/project.model";
import Link from "next/link";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import { ReceiptText, CheckCircle2, AlertCircle, Plus, FileText, ArrowRight } from "lucide-react";

async function getInvoices(userId, role) {
  await connectDb();
  
  let query = {};
  if (role === "client") {
    query = { clientId: userId };
  } else {
    // For freelancers, we need invoices linked to their projects
    const projects = await Project.find({ $or: [{ owner: userId }, { talent: userId }] }).select("_id").lean();
    const projectIds = projects.map(p => p._id);
    query = { projectId: { $in: projectIds } };
  }

  const invoices = await Invoice.find(query)
    .populate("projectId", "title")
    .populate("clientId", "name email")
    .sort({ createdAt: -1 })
    .lean();
    
  return JSON.parse(JSON.stringify(invoices));
}

const STATUS_STYLES = {
  "pending": "bg-amber-900/40 text-amber-300 border-amber-800/50",
  "paid": "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
  "overdue": "bg-rose-900/40 text-rose-300 border-rose-800/50",
  "cancelled": "bg-slate-800 text-slate-400 border-slate-700",
};

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const invoices = await getInvoices(session.user.id, session.user.role);
  const isFreelancer = session.user.role !== "client";

  let projectsData = [];
  if (isFreelancer) {
    await connectDb();
    const projects = await Project.find({ $or: [{ owner: session.user.id }, { talent: session.user.id }] })
      .select("title _id")
      .lean();
    projectsData = JSON.parse(JSON.stringify(projects));
  }

  const totalOutstanding = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Invoices</h1>
            <p className="text-slate-400 text-sm">
              {isFreelancer ? "Manage billing and revenue." : "View and pay your pending invoices."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold text-white">${totalOutstanding.toLocaleString()}</p>
            </div>
            {isFreelancer && (
              <CreateInvoiceModal projects={projectsData || []} />
            )}
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Project</th>
                    {isFreelancer && <th className="px-6 py-4">Client</th>}
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-300">#{inv._id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-medium">
                        {inv.projectId?.title || "Unknown Project"}
                      </td>
                      {isFreelancer && (
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {inv.clientId?.name || "Unknown Client"}
                        </td>
                      )}
                      <td className="px-6 py-4 font-bold text-white">
                        ${inv.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={"text-xs font-semibold px-3 py-1 rounded border capitalize tracking-wide " + (STATUS_STYLES[inv.status] || STATUS_STYLES["pending"])}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={"/dashboard/invoices/" + inv._id} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                          <FileText size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-24 text-center">
              <ReceiptText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">No invoices found</h3>
              <p className="text-slate-500 text-sm">You're all caught up! No pending or past invoices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
