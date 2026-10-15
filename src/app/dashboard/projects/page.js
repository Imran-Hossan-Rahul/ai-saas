import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

async function getProjects(userId, role) {
  await connectDb();
  let query = {};
  if (role === "client") {
    query = { owner: userId };
  } else {
    query = { $or: [{ owner: userId }, { talent: userId }] };
  }
  return await Project.find(query).lean();
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }

  const projects = await getProjects(session.user.id, session.user.role);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <FolderKanban className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">All Workspaces</h1>
              <p className="text-slate-400 text-sm">Manage your client projects and deliverables.</p>
            </div>
          </div>
          
          {session.user.role !== "client" && (
            <Link href="/dashboard/projects/new" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-sm flex items-center transition-all active:scale-95">
              <Plus size={18} className="mr-2" /> New Workspace
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={"/dashboard/projects/" + project._id.toString()} key={project._id.toString()}>
              <div className="group bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer h-full flex flex-col relative overflow-hidden shadow-lg">
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">{project.title}</h3>
                  <div className="flex flex-col items-end gap-2">
                    <span className={"text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider " + (project.status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20')}>
                      {project.status}
                    </span>
                    {project.deadline && (
                      <span className={`text-xs font-medium flex items-center gap-1 ${new Date(project.deadline) < new Date() && project.status !== 'done' ? 'text-rose-400' : 'text-slate-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-400 text-sm flex-grow line-clamp-3 mb-6 relative z-10">
                  {project.description}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center text-sm relative z-10">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Priority</span>
                    <span className={"capitalize " + (project.priority === 'urgent' ? 'text-rose-400' : 'text-slate-300')}>{project.priority}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Revenue</span>
                    <span className="text-emerald-400 font-semibold">${project.revenue || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
              <FolderKanban className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6 max-w-sm mx-auto">Get started by creating a new workspace and inviting your first client.</p>
              {session.user.role !== "client" && (
                <Link href="/dashboard/projects/new" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors inline-flex">
                  Create Workspace
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
