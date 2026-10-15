import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import Notification from "@/models/notification.model";
import Project from "@/models/project.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    await connectDb();

    const project = await Project.findById(projectId).lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const isMember = project.owner?.toString() === session.user.id || project.talent?.toString() === session.user.id;
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await Message.find({ project: projectId })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    // Mark all messages in this project as read for the current user
    await Message.updateMany(
      { project: projectId, readBy: { $ne: session.user.id } },
      { $addToSet: { readBy: session.user.id } }
    );

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, workspaceId, text } = body;

    if (!projectId || !workspaceId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    const proj = await Project.findById(projectId).lean();
    if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const isMember = proj.owner?.toString() === session.user.id || proj.talent?.toString() === session.user.id;
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await Message.create({
      project: projectId,
      workspace: workspaceId,
      sender: session.user.id,
      text: text.trim(),
      readBy: [session.user.id],
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "name email role")
      .lean();

    // Create notifications for all project members except sender
    const project = await Project.findById(projectId).lean();
    if (project) {
      const recipients = [project.owner, project.talent]
        .filter(Boolean)
        .map(id => id.toString())
        .filter(id => id !== session.user.id.toString());

      const notifs = recipients.map(recipientId => ({
        recipient: recipientId,
        type: "message",
        title: "New message",
        body: `${session.user.name}: ${text.slice(0, 80)}`,
        href: `/dashboard/projects/${projectId}`,
        workspace: workspaceId,
        isRead: false,
      }));

      if (notifs.length > 0) {
        await Notification.insertMany(notifs);
      }
    }

    return NextResponse.json({ message: populated }, { status: 201 });
  } catch (error) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
