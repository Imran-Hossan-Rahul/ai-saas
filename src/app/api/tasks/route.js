import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Task from "@/models/task.model";
import Project from "@/models/project.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    await connectDb();

    // Verification check (only talent or owner can access project tasks)
    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (
      project.owner.toString() !== session.user.id &&
      project.talent?.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tasks = await Task.find({ projectId }).sort({ order: 1 }).lean();
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    // Only freelancer can create tasks
    if (!session || (session.user.role !== "admin" && session.user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, projectId, status, priority, order } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    const project = await Project.findById(projectId);
    if (!project || (project.talent?.toString() !== session.user.id && session.user.role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newTask = await Task.create({
      title,
      description,
      projectId,
      status: status || "todo",
      priority: priority || "standard",
      order: order || 0,
      assignedTo: session.user.id,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST Task Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Bulk update for Kanban Drag and Drop
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tasks } = body; // Expected array of { _id, status, order }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "Invalid tasks array" }, { status: 400 });
    }

    await connectDb();

    // IDOR protection: Verify tasks belong to a project this user has access to
    const taskIds = tasks.map((t) => t._id);
    const existingTasks = await Task.find({ _id: { $in: taskIds } }).select("projectId").lean();
    if (existingTasks.length === 0) return NextResponse.json({ error: "Tasks not found" }, { status: 404 });
    
    const projectId = existingTasks[0].projectId;
    const project = await Project.findById(projectId).lean();
    if (!project || (project.talent?.toString() !== session.user.id && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use bulkWrite for O(1) network operation for N updates
    const bulkOps = tasks.map((task) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { status: task.status, order: task.order } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    return NextResponse.json({ message: "Tasks updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("PATCH Bulk Tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
