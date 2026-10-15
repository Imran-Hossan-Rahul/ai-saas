import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // If user is a client, fetch projects where they are the owner
    // If user is a freelancer/admin, fetch all or where they are the talent
    let query = {};
    if (session.user.role === "client") {
      query = { owner: session.user.id };
    } else {
      query = { $or: [{ owner: session.user.id }, { talent: session.user.id }] };
    }

    const projects = await Project.find(query).populate("owner", "name email").lean();
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, revenue, deadline, ownerId } = body;

    if (!title || !description || !ownerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDb();

    const newProject = await Project.create({
      title,
      description,
      priority,
      revenue: revenue || 0,
      deadline,
      owner: ownerId,
      talent: session.user.id, // The creator is the freelancer
      status: "todo",
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
