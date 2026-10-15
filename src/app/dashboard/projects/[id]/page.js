import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Task from "@/models/task.model";
import KanbanBoard from "@/components/KanbanBoard";
import AIAssistant from "@/components/AIAssistant";
import AITaskGenerator from "@/components/AITaskGenerator";
import ExpenseList from "@/components/ExpenseList";
import MessagingPanel from "@/components/MessagingPanel";
import AIEmailWriter from "@/components/AIEmailWriter";
import Link from "next/link";
import { ArrowLeft, DollarSign, User as UserIcon, Calendar, BarChart3, Plus } from "lucide-react";

async function getProjectData(projectId, userId, role) {
  await connectDb();
  const project = await Project.findById(projectId).populate("owner", "name").lean();
  if (!project) return null;

  const ownerId = project.owner?._id?.toString() || project.owner?.toString();
  const talentId = project.talent?.toString();

  if (ownerId !== userId && talentId !== userId && role !== "admin") {
    return null;
  }

  const tasks = await Task.find({ projectId }).sort({ order: 1 }).lean();
  const serializedTasks = tasks.map(t => ({
    ...t,
    _id: t._id.toString(),
    projectId: t.projectId.toString(),
  }));

  return { project: { ...project, _id: project._id.toString() }, tasks: serializedTasks };
}

const STATUS_STYLES = {
  "todo": "bg-slate-800 text-slate-300 border-slate-700",
  "in-progress": "bg-indigo-900/40 text-indigo-300 border-indigo-800/50",
  "review": "bg-amber-900/40 text-amber-300 border-amber-800/50",
  "done": "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
};

const PRIORITY_STYLES = {
  "low": "text-slate-400",
  "medium": "text-amber-400",
  "high": "text-rose-400",
};

export default async function ProjectPortalPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const data = await getProjectData(params.id, session.user.id, session.user.role);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200 p-8">
        <div className="text-center max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800">
          <div className="w-16 h-16 bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-800/50">
            <BarChart3 className="text-rose-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-white">Access Denied</h1>
          <p className="text-slate-400 mb-6">You don't have permission to view this project, or it doesn't exist.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { project, tasks } = data;
  const isFreelancer = session.user.role !== "client";
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/projects" className="hover:text-slate-300 transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-slate-300 truncate max-w-[200px]">{project.title}</span>
        </div>

        {/* Project Hero (Minimalist) */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={"text-xs font-semibold px-3 py-1 rounded border uppercase tracking-wider " + (STATUS_STYLES[project.status] || STATUS_STYLES["todo"])}>
                  {project.status.replace('-', ' ')}
                </span>
                <span className={"text-xs font-medium capitalize " + (PRIORITY_STYLES[project.priority] || "text-slate-400")}>
                  ● {project.priority} priority
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
                {project.title}
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">{project.description}</p>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 flex-wrap shrink-0">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 min-w-[130px]">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-3 font-semibold tracking-wide uppercase">
                  <UserIcon size={14} />
                  <span>Client</span>
                </div>
                <p className="text-white font-medium">{project.owner?.name || "—"}</p>
              </div>

              {isFreelancer && (
                <div className="bg-emerald-950/20 rounded-xl p-5 border border-emerald-900/30 min-w-[130px]">
                  <div className="flex items-center gap-2 text-emerald-500/80 text-xs mb-3 font-semibold tracking-wide uppercase">
                    <DollarSign size={14} />
                    <span>Revenue</span>
                  </div>
                  <p className="text-emerald-400 font-semibold text-lg">${(project.revenue || 0).toLocaleString()}</p>
                </div>
              )}

              {project.deadline && (
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 min-w-[130px]">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-3 font-semibold tracking-wide uppercase">
                    <Calendar size={14} />
                    <span>Deadline</span>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {tasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Project Progress</span>
                <span className="text-slate-300 text-xs font-medium">{completedTasks} of {tasks.length} tasks ({progressPct}%)</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: progressPct + "%" }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board Section */}
        <div>
          <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 tracking-tight">
              Task Board
              <span className="text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">{tasks.length}</span>
            </h2>
            {isFreelancer && (
              <div className="flex items-center gap-3 flex-wrap">
                <AITaskGenerator projectId={project._id.toString()} />
                <AIEmailWriter projectId={project._id.toString()} />
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                  <Plus size={16} /> Add Task
                </button>
              </div>
            )}
          </div>

          <KanbanBoard initialTasks={tasks} projectId={project._id.toString()} role={session.user.role} />
        </div>
        
        {/* Expenses Section (Freelancer Only) */}
        {isFreelancer && (
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Expenses & Profitability</h2>
                <p className="text-sm text-slate-400 mt-1">Track costs associated with this project to calculate net profit.</p>
              </div>
              <Link href={`/dashboard/expenses/new?projectId=${project._id.toString()}`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                <Plus size={16} /> Log Expense
              </Link>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <ExpenseList projectId={project._id.toString()} projectRevenue={project.revenue || 0} />
            </div>
          </div>
        )}
        {/* Project Chat Section */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">Project Chat</h2>
            <p className="text-sm text-slate-400 mt-1">Real-time messaging between you and your client or team members.</p>
          </div>
          <div style={{ height: "560px" }}>
            <MessagingPanel projectId={project._id.toString()} currentUserId={session.user.id} />
          </div>
        </div>
      </div>

      {isFreelancer && <AIAssistant projectId={project._id.toString()} projectName={project.title} />}
    </div>
  );
}
