import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Workspace from "@/models/workspace.model";
import User from "@/models/user.model";

// POST /api/workspaces/[id]/members — invite by email
export async function POST(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    
    const { email, role } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await connectDb();

    // Verify requester is workspace owner
    const workspace = await Workspace.findOne({ _id: id, owner: session.user.id });
    if (!workspace) return NextResponse.json({ error: "Workspace not found or unauthorized." }, { status: 404 });

    // Find user by email — O(1) via email index
    const invitee = await User.findOne({ email: email.toLowerCase().trim() });
    if (!invitee) {
      return NextResponse.json({ error: "No account found with that email address." }, { status: 404 });
    }

    if (invitee._id.toString() === session.user.id) {
      return NextResponse.json({ error: "You cannot invite yourself." }, { status: 400 });
    }

    // Idempotent — skip if already a member (O(n) on members array, typically small)
    const alreadyMember = workspace.members.some(m => m.user?.toString() === invitee._id.toString());
    if (alreadyMember) {
      return NextResponse.json({ error: "This user is already a member." }, { status: 409 });
    }

    workspace.members.push({ user: invitee._id, role: role || "member" });
    await workspace.save();

    // Also add workspace to invitee's workspaces list if not already present
    await User.findByIdAndUpdate(invitee._id, {
      $addToSet: { workspaces: workspace._id },
    });

    const populated = await Workspace.findById(workspace._id).populate("members.user", "name email role");
    return NextResponse.json({ workspace: populated }, { status: 200 });
  } catch (error) {
    console.error("POST Workspace Member Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/members — remove member by userId in body
export async function DELETE(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    await connectDb();

    const workspace = await Workspace.findOne({ _id: id, owner: session.user.id });
    if (!workspace) return NextResponse.json({ error: "Workspace not found or unauthorized." }, { status: 404 });

    workspace.members = workspace.members.filter(m => m.user?.toString() !== userId);
    await workspace.save();

    // Remove workspace from the removed user's list
    await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace._id } });

    return NextResponse.json({ message: "Member removed." }, { status: 200 });
  } catch (error) {
    console.error("DELETE Workspace Member Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
