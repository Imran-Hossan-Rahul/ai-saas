import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Task from "@/models/task.model";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, projectId } = await req.json();

    if (!prompt || !projectId) {
      return NextResponse.json({ error: "Prompt and projectId are required" }, { status: 400 });
    }

    await connectDb();

    // Fetch context
    const project = await Project.findById(projectId).populate("owner", "name").lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tasks = await Task.find({ projectId }).lean();
    const completedTasks = tasks.filter(t => t.status === "done").length;
    
    // Construct System Prompt
    const systemPrompt = `You are a world-class professional business consultant and project manager working for an agency.
Your job is to assist the freelancer by generating extremely professional, well-formatted text for proposals, updates, or client communication.

CONTEXT ABOUT THE PROJECT:
- Project Title: ${project.title}
- Client Name: ${project.owner?.name || 'Client'}
- Budget/Revenue: $${project.revenue || 0}
- Priority: ${project.priority}
- Overall Status: ${project.status}
- Tasks: ${tasks.length} total (${completedTasks} completed)
- Description: ${project.description}

REQUIREMENTS:
1. Write in a confident, professional, and slightly persuasive tone.
2. Structure your response using Markdown (Headers, bolding, bullet points).
3. If writing a proposal, clearly define Scope of Work, Investment, and Next Steps.
4. Keep it concise but highly impactful.
5. Do NOT break character or explain that you are an AI. Just provide the final text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }] }
      ],
      config: {
        temperature: 0.7,
      }
    });

    const proposalText = response.text;

    return NextResponse.json({ proposal: proposalText }, { status: 200 });
  } catch (error) {
    console.error("AI Proposal Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response. Please check API Key and limits." }, { status: 500 });
  }
}
