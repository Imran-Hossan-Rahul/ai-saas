import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Workspace from "@/models/workspace.model";

export async function PATCH(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    
    const { name } = await req.json();

    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 });
    }

    await connectDb();

    // Only the owner can rename
    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, owner: session.user.id },
      { name: name.trim() },
      { new: true }
    );

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    console.error("PATCH Workspace Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
