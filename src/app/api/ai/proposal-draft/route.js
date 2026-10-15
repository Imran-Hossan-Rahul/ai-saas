import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import ClientProfile from "@/models/client.model";
import Document from "@/models/document.model";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, workspaceId, clientId, additionalScope } = await req.json();

    if (!projectId || !workspaceId || !clientId) {
      return NextResponse.json({ error: "projectId, workspaceId, and clientId are required" }, { status: 400 });
    }

    await connectDb();

    const [project, client] = await Promise.all([
      Project.findById(projectId).lean(),
      ClientProfile.findById(clientId).lean(),
    ]);

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const systemPrompt = `You are a world-class proposal writer for a digital agency. Write a comprehensive, professional project proposal that would win a client.

PROJECT DETAILS:
- Title: ${project.title}
- Description: ${project.description}
- Budget: $${project.revenue || 0}
- Priority: ${project.priority}
- Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "To be discussed"}

CLIENT:
- Name: ${client.name}
- Company: ${client.companyName || "N/A"}

ADDITIONAL SCOPE REQUIREMENTS: ${additionalScope || "None"}

Write a formal proposal document with these sections:
1. Executive Summary
2. Understanding of Requirements
3. Proposed Solution & Methodology
4. Scope of Work (bullet points)
5. Project Timeline
6. Investment (pricing breakdown)
7. Terms & Conditions (brief)
8. Next Steps

Format it as clean, professional plain text (not markdown). Use newlines to separate sections. Use ALL CAPS for section headers. Keep it impactful and concise (600-900 words).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { temperature: 0.6 },
    });

    const proposalContent = response.text.trim();

    // Auto-save the generated proposal to the documents collection
    const savedDoc = await Document.create({
      type: "proposal",
      title: `Proposal: ${project.title}`,
      content: proposalContent,
      amount: project.revenue || 0,
      client: clientId,
      project: projectId,
      workspace: workspaceId,
      owner: session.user.id,
      status: "draft",
    });

    return NextResponse.json({
      document: savedDoc,
      content: proposalContent,
    }, { status: 201 });
  } catch (error) {
    console.error("AI Proposal Draft Error:", error);
    return NextResponse.json({ error: "Failed to generate proposal." }, { status: 500 });
  }
}
