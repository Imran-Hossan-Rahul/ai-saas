import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Workspace from "@/models/workspace.model";
import User from "@/models/user.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const workspaces = await Workspace.find({
      $or: [
        { owner: session.user.id },
        { "members.user": session.user.id },
      ],
    }).populate("owner", "name email");

    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error("GET Workspaces Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    await connectDb();

    // Create new workspace
    const newWorkspace = await Workspace.create({
      name,
      owner: session.user.id,
      members: [{ user: session.user.id, role: "admin" }],
    });

    // Add workspace to user's workspaces array and set as current if it's the first one
    const user = await User.findById(session.user.id);
    if (user) {
      user.workspaces.push(newWorkspace._id);
      if (!user.currentWorkspace) {
        user.currentWorkspace = newWorkspace._id;
      }
      await user.save();
    }

    return NextResponse.json({ workspace: newWorkspace, message: "Workspace created successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST Workspace Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
