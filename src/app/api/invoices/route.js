import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Invoice from "@/models/invoice.model";
import Project from "@/models/project.model";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, amount, dueDate } = await req.json();

    if (!projectId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    // Verify project belongs to the freelancer
    const project = await Project.findById(projectId).lean();
    if (!project || (project.owner.toString() !== session.user.id && project.talent?.toString() !== session.user.id)) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const newInvoice = new Invoice({
      projectId: project._id,
      workspace: project.workspace,
      clientId: project.owner, // Client is the owner of the project
      amount: Number(amount),
      dueDate: new Date(dueDate),
      status: "pending",
    });

    await newInvoice.save();

    return NextResponse.json({ message: "Invoice created successfully", invoice: newInvoice }, { status: 201 });
  } catch (error) {
    console.error("Invoice Creation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
