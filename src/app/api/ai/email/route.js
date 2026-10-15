import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMAIL_TONE_INSTRUCTIONS = {
  professional: "formal, courteous, and business-like",
  friendly: "warm, approachable, and conversational while remaining professional",
  assertive: "confident, direct, and action-oriented",
  apologetic: "empathetic, sincere, and solution-focused",
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, purpose, tone, additionalContext } = await req.json();

    if (!projectId || !purpose) {
      return NextResponse.json({ error: "projectId and purpose are required" }, { status: 400 });
    }

    await connectDb();

    const project = await Project.findById(projectId).populate("owner", "name email").lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const toneInstruction = EMAIL_TONE_INSTRUCTIONS[tone] || EMAIL_TONE_INSTRUCTIONS.professional;
    const senderName = session.user.name;
    const clientName = project.owner?.name || "Client";

    const systemPrompt = `You are an elite professional ghostwriter specializing in business emails for digital agencies.

Write a client email with the following parameters:

FROM: ${senderName} (Agency)
TO: ${clientName} (Client)
PROJECT: ${project.title} — ${project.description}
PURPOSE: ${purpose}
TONE: ${toneInstruction}
ADDITIONAL CONTEXT: ${additionalContext || "None provided."}

OUTPUT FORMAT (JSON only, no markdown):
{
  "subject": "string",
  "body": "string"
}

Rules:
1. Subject line must be clear, concise, and professional.
2. Body should have: Greeting → Opening paragraph → Main content → Clear CTA → Professional sign-off with sender name.
3. Do NOT use placeholders like [your name] — use the actual names provided.
4. Keep the body under 250 words unless the purpose demands more detail.
5. Return ONLY the JSON. No markdown, no explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { temperature: 0.65, responseMimeType: "application/json" },
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const emailData = JSON.parse(rawText);

    return NextResponse.json({ email: emailData }, { status: 200 });
  } catch (error) {
    console.error("AI Email Writer Error:", error);
    return NextResponse.json({ error: "Failed to generate email." }, { status: 500 });
  }
}
