import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Task from "@/models/task.model";
import Project from "@/models/project.model";

export async function POST(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    await connectDb();

    const task = await Task.findById(id).populate("projectId");
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = task.projectId;
    const userId = session.user.id;

    // Verify user has access to this project (owner or talent)
    if (project.owner.toString() !== userId && project.talent?.toString() !== userId && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Add comment
    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    task.comments.push(newComment);
    await task.save();

    // Populate user info for the returned comment
    await task.populate("comments.user", "name email");
    
    // Return the newly created comment (it will be the last one in the array)
    const savedComment = task.comments[task.comments.length - 1];

    return NextResponse.json({ message: "Comment added", comment: savedComment }, { status: 201 });
  } catch (error) {
    console.error("Add Comment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
