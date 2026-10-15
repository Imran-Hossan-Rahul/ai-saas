import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Expense from "@/models/expense.model";
import Project from "@/models/project.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");

    await connectDb();

    let query = { owner: session.user.id };
    if (projectId) query.project = projectId;
    if (workspaceId) query.workspace = workspaceId;

    const expenses = await Expense.find(query).sort({ date: -1 });
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error("GET Expenses Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    if (!body.projectId || !body.workspaceId || !body.amount || !body.category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    const project = await Project.findById(body.projectId).lean();
    if (!project || project.talent?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newExpense = await Expense.create({
      project: body.projectId,
      workspace: body.workspaceId,
      owner: session.user.id,
      amount: Number(body.amount),
      category: body.category,
      description: body.description || "",
      date: body.date ? new Date(body.date) : Date.now(),
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error("POST Expense Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
