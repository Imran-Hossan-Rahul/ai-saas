import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Document from "@/models/document.model";

export async function POST(req, { params }) {
  const p = await params;
  const id = p.id || p.projectId;
  try {
    
    const body = await req.json();

    if (!body.signerName || !body.signatureDataUrl) {
      return NextResponse.json({ error: "Missing signature data" }, { status: 400 });
    }

    await connectDb();

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status === "signed") {
      return NextResponse.json({ error: "Document is already signed" }, { status: 400 });
    }

    // Get IP address from headers (basic approximation for legal logging)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "Unknown";

    const newSignature = {
      signerName: body.signerName,
      signatureDataUrl: body.signatureDataUrl,
      ipAddress: ipAddress,
      signedAt: new Date(),
    };

    document.signatures.push(newSignature);
    document.status = "signed";
    
    await document.save();

    return NextResponse.json({ message: "Document signed successfully", document }, { status: 200 });
  } catch (error) {
    console.error("POST Sign Document Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
