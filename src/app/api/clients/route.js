import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
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

    const clients = await ClientProfile.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error("GET Clients Error:", error);
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
    
    if (!body.workspaceId || !body.name) {
      return NextResponse.json({ error: "Name and Workspace ID are required" }, { status: 400 });
    }

    await connectDb();

    const newClient = await ClientProfile.create({
      name: body.name,
      email: body.email,
      companyName: body.companyName,
      phone: body.phone,
      address: body.address,
      notes: body.notes,
      workspace: body.workspaceId,
      owner: session.user.id,
      status: body.status || "active",
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error("POST Client Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
