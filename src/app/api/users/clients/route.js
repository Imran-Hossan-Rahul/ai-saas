import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Project from "@/models/project.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Only fetch clients that are assigned to projects where this user is the talent
    const projects = await Project.find({ talent: session.user.id }).select("owner").lean();
    const clientIds = projects.map(p => p.owner).filter(Boolean);

    const clients = await User.find({ 
      _id: { $in: clientIds },
      role: "client" 
    }).select("_id name email").lean();
    
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("GET Clients Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
