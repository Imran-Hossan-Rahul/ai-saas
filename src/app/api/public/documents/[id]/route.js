import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Document from "@/models/document.model";

export async function GET(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    
    await connectDb();

    // No session check because this is a public route for clients to view the document
    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Update status to viewed if it was draft or sent
    if (document.status === "draft" || document.status === "sent") {
      document.status = "viewed";
      await document.save();
    }

    return NextResponse.json({ document }, { status: 200 });
  } catch (error) {
    console.error("GET Public Document Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
