import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Invoice from "@/models/invoice.model";
import Expense from "@/models/expense.model";
import Task from "@/models/task.model";
import ClientProfile from "@/models/client.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel — O(1) round trips
    const projectQuery = { $or: [{ owner: userId }, { talent: userId }] };
    const projects = await Project.find(projectQuery).lean();
    const projectIds = projects.map(p => p._id);
    
    const [invoices, expenses, tasks, clientCount] = await Promise.all([
      Invoice.find({ projectId: { $in: projectIds } }).lean(),
      Expense.find({ owner: userId }).lean(),
      Task.find({ projectId: { $in: projectIds } }).lean(),
      ClientProfile.countDocuments({ owner: userId }),
    ]);

    // --- KPI Metrics ---
    const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    const activeProjects = projects.filter(p => p.status !== "done").length;
    const completedProjects = projects.filter(p => p.status === "done").length;

    const overdueDeadlines = projects.filter(
      p => p.deadline && new Date(p.deadline) < now && p.status !== "done"
    ).length;

    // --- Revenue by month (last 6 months) — O(n) scan ---
    const revenueByMonth = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      revenueByMonth[label] = 0;
    }

    projects.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (label in revenueByMonth) {
        revenueByMonth[label] += p.revenue || 0;
      }
    });

    const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // --- Project status breakdown ---
    const statusBreakdown = {
      todo: projects.filter(p => p.status === "todo").length,
      "in-progress": projects.filter(p => p.status === "in-progress").length,
      review: projects.filter(p => p.status === "review").length,
      done: completedProjects,
    };

    // --- Top 5 projects by revenue ---
    const topProjects = [...projects]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5)
      .map(p => ({
        _id: p._id.toString(),
        title: p.title,
        revenue: p.revenue || 0,
        status: p.status,
        deadline: p.deadline,
      }));

    // --- Upcoming deadlines (next 7 days) ---
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = projects
      .filter(p => p.deadline && new Date(p.deadline) > now && new Date(p.deadline) <= next7Days && p.status !== "done")
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
      .map(p => ({
        _id: p._id.toString(),
        title: p.title,
        deadline: p.deadline,
        status: p.status,
      }));

    return NextResponse.json({
      kpi: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        activeProjects,
        completedProjects,
        overdueDeadlines,
        clientCount,
        totalProjects: projects.length,
      },
      revenueChartData,
      statusBreakdown,
      topProjects,
      upcomingDeadlines,
    }, { status: 200 });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
