import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Message from "@/models/message.model";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";

async function getProjectsWithMessages(userId, role) {
  await connectDb();

  let query = {};
  if (role === "client") {
    query = { owner: userId };
  } else {
    query = { $or: [{ owner: userId }, { talent: userId }] };
  }

  const projects = await Project.find(query).sort({ updatedAt: -1 }).lean();

  // For each project, get the last message and unread count — efficient with index
  const enriched = await Promise.all(
    projects.map(async (project) => {
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ project: project._id })
          .sort({ createdAt: -1 })
          .populate("sender", "name")
          .lean(),
        Message.countDocuments({
          project: project._id,
          readBy: { $ne: userId },
        }),
      ]);
      return {
        ...project,
        _id: project._id.toString(),
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              senderName: lastMessage.sender?.name || "Unknown",
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  return enriched;
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const projects = await getProjectsWithMessages(session.user.id, session.user.role);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <MessageSquare className="text-indigo-400" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-slate-400 text-sm">Project-based conversations with your team and clients.</p>
          </div>
        </div>

        {/* Project Conversation List */}
        {projects.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              Create a project first, then start chatting with your client or team directly from the project page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/dashboard/projects/${project._id}`}
                className="group flex items-center justify-between bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl px-6 py-5 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    project.unreadCount > 0
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}>
                    <MessageSquare size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-semibold truncate ${project.unreadCount > 0 ? "text-white" : "text-slate-300"}`}>
                        {project.title}
                      </h3>
                      {project.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {project.unreadCount} new
                        </span>
                      )}
                    </div>
                    {project.lastMessage ? (
                      <p className="text-sm text-slate-500 truncate">
                        <span className="font-medium text-slate-400">{project.lastMessage.senderName}:</span>{" "}
                        {project.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600 italic">No messages yet — start the conversation!</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {project.lastMessage && (
                    <span className="text-xs text-slate-600">
                      {new Date(project.lastMessage.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <ArrowRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
