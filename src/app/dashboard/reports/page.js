import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Invoice from "@/models/invoice.model";
import Expense from "@/models/expense.model";
import ClientProfile from "@/models/client.model";
import Link from "next/link";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  FolderKanban, Users, CheckCircle2, Clock, ArrowLeft
} from "lucide-react";

async function getReportData(userId) {
  await connectDb();
  const projectQuery = { $or: [{ owner: userId }, { talent: userId }] };

  const [projects, expenses, clients] = await Promise.all([
    Project.find(projectQuery).populate("owner", "name").sort({ createdAt: -1 }).lean(),
    Expense.find({ owner: userId }).lean(),
    ClientProfile.find({ owner: userId }).lean(),
  ]);

  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Per-project profitability (join expenses to projects using HashMap — O(n))
  const expenseByProject = new Map();
  expenses.forEach(e => {
    const key = e.project?.toString();
    if (!key) return;
    expenseByProject.set(key, (expenseByProject.get(key) || 0) + e.amount);
  });

  const projectReports = projects.map(p => {
    const pid = p._id.toString();
    const projectExpenses = expenseByProject.get(pid) || 0;
    const profit = (p.revenue || 0) - projectExpenses;
    return {
      _id: pid,
      title: p.title,
      status: p.status,
      revenue: p.revenue || 0,
      expenses: projectExpenses,
      profit,
      margin: p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0,
      deadline: p.deadline,
      createdAt: p.createdAt,
    };
  });

  // Expense breakdown by category
  const expenseByCategory = new Map();
  expenses.forEach(e => {
    expenseByCategory.set(e.category, (expenseByCategory.get(e.category) || 0) + e.amount);
  });
  const expenseCategories = [...expenseByCategory.entries()]
    .sort((a, b) => b[1] - a[1]);

  return {
    totalRevenue, totalExpenses, netProfit, profitMargin,
    projectReports, expenseCategories,
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === "done").length,
    clientCount: clients.length,
  };
}

const STATUS_STYLE = {
  "todo": "text-slate-400",
  "in-progress": "text-indigo-400",
  "review": "text-amber-400",
  "done": "text-emerald-400",
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role === "client") redirect("/dashboard");

  const report = await getReportData(session.user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { margin: 0; padding: 2rem; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 print-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 no-print">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Report</h1>
              <p className="text-slate-400 text-sm mt-1">
                Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="no-print px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2"
          >
            <BarChart3 size={16} /> Export / Print
          </button>
        </div>

        {/* Summary KPIs */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Financial Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Gross Revenue", value: `$${report.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
              { label: "Total Expenses", value: `$${report.totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-rose-400" },
              { label: "Net Profit", value: `$${report.netProfit.toLocaleString()}`, icon: TrendingUp, color: report.netProfit >= 0 ? "text-emerald-400" : "text-rose-400" },
              { label: "Profit Margin", value: `${report.profitMargin}%`, icon: BarChart3, color: "text-indigo-400" },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                    <Icon size={16} className={card.color} />
                  </div>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: "Total Projects", value: report.totalProjects, icon: FolderKanban },
              { label: "Completed", value: report.completedProjects, icon: CheckCircle2 },
              { label: "Clients", value: report.clientCount, icon: Users },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    <p className="text-slate-500 text-xs">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Expense Category Breakdown */}
        {report.expenseCategories.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Expense Breakdown</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              {report.expenseCategories.map(([category, amount]) => {
                const pct = report.totalExpenses > 0 ? Math.round((amount / report.totalExpenses) * 100) : 0;
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-slate-300 font-medium">{category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{pct}%</span>
                        <span className="text-sm font-bold text-rose-400">${amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Per-Project Report Table */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Project-by-Project Report</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4">Expenses</th>
                    <th className="px-6 py-4">Net Profit</th>
                    <th className="px-6 py-4">Margin</th>
                    <th className="px-6 py-4">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {report.projectReports.map(p => (
                    <tr key={p._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/projects/${p._id}`} className="text-white font-medium hover:text-indigo-400 transition-colors truncate max-w-[200px] block">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold capitalize ${STATUS_STYLE[p.status] || "text-slate-400"}`}>
                          {p.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">${p.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-rose-400">${p.expenses.toLocaleString()}</td>
                      <td className={`px-6 py-4 font-bold ${p.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {p.profit >= 0 ? "+" : ""}${p.profit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.margin >= 50 ? "bg-emerald-500" : p.margin >= 20 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.max(0, Math.min(100, p.margin))}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{p.margin}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {p.deadline
                          ? new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : <span className="text-slate-700">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {report.projectReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-500">No projects found.</td>
                    </tr>
                  )}
                </tbody>
                {/* Totals Row */}
                {report.projectReports.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-950/70 border-t border-slate-700 text-sm font-bold">
                      <td className="px-6 py-4 text-slate-400 uppercase text-xs tracking-widest" colSpan={2}>TOTAL</td>
                      <td className="px-6 py-4 text-emerald-400">${report.totalRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-rose-400">${report.totalExpenses.toLocaleString()}</td>
                      <td className={`px-6 py-4 ${report.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {report.netProfit >= 0 ? "+" : ""}${report.netProfit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{report.profitMargin}%</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
