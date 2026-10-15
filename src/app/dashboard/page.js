import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Invoice from "@/models/invoice.model";
import Expense from "@/models/expense.model";
import ClientProfile from "@/models/client.model";
import Document from "@/models/document.model";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, FolderKanban, Users,
  Clock, CheckCircle2, Plus, ArrowRight, AlertCircle,
  ReceiptText, FileSignature, BarChart3
} from "lucide-react";

async function getDashboardData(userId, role) {
  await connectDb();
  const now = new Date();

  if (role === "client") {
    const projects = await Project.find({ owner: userId }).lean();
    const invoices = await Invoice.find({ clientId: userId, status: { $ne: "paid" } }).lean();
    return { role: "client", projects, invoices };
  }

  const projectQuery = { $or: [{ owner: userId }, { talent: userId }] };

  const [projects, invoices, expenses, clients, documents] = await Promise.all([
    Project.find(projectQuery).sort({ createdAt: -1 }).lean(),
    Invoice.find().lean(),
    Expense.find({ owner: userId }).lean(),
    ClientProfile.find({ owner: userId }).lean(),
    Document.find({ owner: userId }).sort({ createdAt: -1 }).limit(5).populate("client", "name").lean(),
  ]);

  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const activeProjects = projects.filter(p => p.status !== "done");
  const completedCount = projects.filter(p => p.status === "done").length;

  const overdueProjects = projects.filter(
    p => p.deadline && new Date(p.deadline) < now && p.status !== "done"
  );

  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const urgentDeadlines = projects
    .filter(p => p.deadline && new Date(p.deadline) > now && new Date(p.deadline) <= next7Days && p.status !== "done")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Revenue by month — last 6 months
  const revenueMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    revenueMap.set(label, 0);
  }
  projects.forEach(p => {
    if (!p.createdAt) return;
    const label = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short" });
    if (revenueMap.has(label)) revenueMap.set(label, revenueMap.get(label) + (p.revenue || 0));
  });
  const revenueChart = [...revenueMap.entries()];
  const maxRevenue = Math.max(...revenueChart.map(([, v]) => v), 1);

  // Status breakdown
  const statusCounts = { todo: 0, "in-progress": 0, review: 0, done: 0 };
  projects.forEach(p => { if (p.status in statusCounts) statusCounts[p.status]++; });

  // Top 5 projects by revenue
  const topProjects = [...projects]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5);

  return {
    role: "freelancer",
    totalRevenue, totalExpenses, netProfit, profitMargin,
    activeProjects, completedCount, overdueProjects, urgentDeadlines,
    revenueChart, maxRevenue, statusCounts, topProjects,
    clientCount: clients.length, projects, documents,
  };
}

const STATUS_COLOR = {
  todo: "bg-slate-500",
  "in-progress": "bg-indigo-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
};

const STATUS_LABEL = { todo: "To Do", "in-progress": "In Progress", review: "Review", done: "Done" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const data = await getDashboardData(session.user.id, session.user.role);
  const firstName = session.user.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (data.role === "client") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-4xl font-bold text-white">{firstName}</h1>
            <p className="text-slate-400 text-sm mt-2">Your client portal overview.</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Active Projects</p>
              <p className="text-5xl font-bold text-white">{data.projects.length}</p>
            </div>
            <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-6">
              <p className="text-rose-400/80 text-xs uppercase tracking-widest mb-3">Pending Invoices</p>
              <p className="text-5xl font-bold text-white">{data.invoices.length}</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Projects</h2>
            <div className="space-y-3">
              {data.projects.map(p => (
                <Link key={p._id.toString()} href={`/dashboard/projects/${p._id}`}
                  className="flex justify-between items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all group">
                  <span className="font-medium text-white group-hover:text-indigo-400 transition-colors">{p.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 capitalize">{p.status.replace("-", " ")}</span>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalRevenue, totalExpenses, netProfit, profitMargin,
    activeProjects, completedCount, overdueProjects, urgentDeadlines,
    revenueChart, maxRevenue, statusCounts, topProjects,
    clientCount, projects, documents,
  } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-medium">{greeting}</p>
            <h1 className="text-4xl font-bold text-white tracking-tight">{firstName}</h1>
            <p className="text-slate-400 text-sm mt-1.5">Agency analytics overview — real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/reports" className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2">
              <BarChart3 size={16} /> Reports
            </Link>
            <Link href="/dashboard/projects/new" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
              <Plus size={16} /> New Project
            </Link>
          </div>
        </div>

        {/* KPI Cards — 6 metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, sub: "all projects", accent: "text-emerald-400", borderAccent: "border-emerald-500/20" },
            { label: "Net Profit", value: `$${netProfit.toLocaleString()}`, icon: TrendingUp, sub: `${profitMargin}% margin`, accent: netProfit >= 0 ? "text-emerald-400" : "text-rose-400", borderAccent: netProfit >= 0 ? "border-emerald-500/20" : "border-rose-500/20" },
            { label: "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, sub: "all time", accent: "text-rose-400", borderAccent: "border-rose-500/20" },
            { label: "Active Projects", value: activeProjects.length, icon: FolderKanban, sub: `${completedCount} completed`, accent: "text-indigo-400", borderAccent: "border-indigo-500/20" },
            { label: "Clients", value: clientCount, icon: Users, sub: "in workspace", accent: "text-slate-300", borderAccent: "border-slate-700" },
            { label: "Overdue", value: overdueProjects.length, icon: AlertCircle, sub: "projects past deadline", accent: overdueProjects.length > 0 ? "text-rose-400" : "text-slate-500", borderAccent: overdueProjects.length > 0 ? "border-rose-500/30" : "border-slate-800" },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`bg-slate-900 border ${card.borderAccent} rounded-2xl p-5 flex flex-col gap-3 hover:bg-slate-900/80 transition-colors`}>
                <div className="flex justify-between items-center">
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">{card.label}</p>
                  <Icon size={16} className={card.accent} />
                </div>
                <p className={`text-3xl font-bold ${card.accent} leading-none`}>{card.value}</p>
                <p className="text-slate-600 text-[10px]">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Revenue Chart + Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Bar Chart (CSS-only, no dependencies) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-semibold text-white">Revenue — Last 6 Months</h2>
              <span className="text-xs text-slate-500 font-medium">per project creation date</span>
            </div>
            <div className="flex items-end gap-3 h-44">
              {revenueChart.map(([month, revenue]) => {
                const heightPct = maxRevenue > 0 ? Math.round((revenue / maxRevenue) * 100) : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] text-slate-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">${revenue.toLocaleString()}</span>
                    <div className="w-full flex items-end" style={{ height: "140px" }}>
                      <div
                        className="w-full rounded-t-lg bg-indigo-600/70 group-hover:bg-indigo-500 transition-all duration-300"
                        style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: "4px" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Status Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-6">Project Status</h2>
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]) => {
                const total = projects.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-slate-400">{STATUS_LABEL[status]}</span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${STATUS_COLOR[status]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overdue Alert */}
            {overdueProjects.length > 0 && (
              <div className="mt-6 p-4 bg-rose-900/20 border border-rose-900/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Overdue</span>
                </div>
                {overdueProjects.slice(0, 3).map(p => (
                  <Link key={p._id.toString()} href={`/dashboard/projects/${p._id}`} className="block text-xs text-rose-300/80 hover:text-rose-300 py-0.5 truncate">
                    → {p.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Projects + Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Projects by Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Top Projects by Revenue</h2>
              <Link href="/dashboard/projects" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {topProjects.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No projects yet.</div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {topProjects.map((p, idx) => {
                  const revenueShare = totalRevenue > 0 ? Math.round(((p.revenue || 0) / totalRevenue) * 100) : 0;
                  return (
                    <Link key={p._id.toString()} href={`/dashboard/projects/${p._id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                      <span className="text-lg font-bold text-slate-700 w-6 shrink-0">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">{p.title}</p>
                        <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${revenueShare}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 shrink-0">${(p.revenue || 0).toLocaleString()}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Deadlines Next 7 Days</h2>
              <Clock size={16} className="text-slate-500" />
            </div>
            {urgentDeadlines.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500/40 mb-3" size={32} />
                <p className="text-slate-500 text-sm">No urgent deadlines. You're on track!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {urgentDeadlines.map(p => {
                  const daysLeft = Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link key={p._id.toString()} href={`/dashboard/projects/${p._id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${daysLeft <= 2 ? "bg-rose-500" : "bg-amber-500"}`} />
                        <p className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{p.title}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ml-3 ${daysLeft <= 2 ? "text-rose-400" : "text-amber-400"}`}>
                        {daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        {documents.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Recent Proposals & Contracts</h2>
              <Link href="/dashboard/documents" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {documents.map(doc => (
                <Link key={doc._id.toString()} href="/dashboard/documents" className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <FileSignature size={16} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                      <p className="text-xs text-slate-500">{doc.client?.name || "Unknown client"} · {doc.type}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shrink-0 ml-4 ${
                    doc.status === "signed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    doc.status === "sent" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {doc.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
