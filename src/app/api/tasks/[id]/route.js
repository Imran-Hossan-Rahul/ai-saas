import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Task from "@/models/task.model";
import Project from "@/models/project.model";

export async function PATCH(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDb();

    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const project = await Project.findById(task.projectId);
    if (!project || (project.talent?.toString() !== session.user.id && session.user.role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    Object.assign(task, body);
    await task.save();

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const project = await Project.findById(task.projectId);
    if (!project || (project.talent?.toString() !== session.user.id && session.user.role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await task.deleteOne();

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
