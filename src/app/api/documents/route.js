import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Document from "@/models/document.model";
import ClientProfile from "@/models/client.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    await connectDb();

    let query = { owner: session.user.id };
    if (workspaceId) {
      query.workspace = workspaceId;
    }

    const documents = await Document.find(query)
      .populate("client", "name companyName email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error("GET Documents Error:", error);
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
    
    if (!body.workspaceId || !body.title || !body.clientId || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    const newDoc = await Document.create({
      type: body.type,
      title: body.title,
      content: body.content || "",
      amount: body.amount || 0,
      client: body.clientId,
      project: body.projectId || undefined,
      workspace: body.workspaceId,
      owner: session.user.id,
      status: "draft",
    });

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST Document Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
