import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Task from "@/models/task.model";
import Workspace from "@/models/workspace.model";
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
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    // Construct System Prompt for JSON output
    const systemPrompt = `You are a Senior Technical Project Manager.
Your job is to break down the user's request into actionable, concrete tasks for the project: "${project.title}".

REQUIREMENTS:
1. Return ONLY a valid JSON array of task objects. Do not wrap it in markdown code blocks like \`\`\`json.
2. Each task object MUST have these EXACT keys:
   - "title" (string, max 100 chars)
   - "description" (string, max 200 chars)
   - "priority" (string, strictly one of: "standard", "urgent", "emergency")
   - "status" (string, strictly "todo")
3. Create between 2 to 7 tasks depending on the complexity of the request.
4. DO NOT output any text before or after the JSON array.

Example Output:
[
  {
    "title": "Design Hero Section",
    "description": "Create a high-converting hero section with call-to-action buttons.",
    "priority": "urgent",
    "status": "todo"
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }] }
      ],
      config: {
        temperature: 0.2, // Low temp for more deterministic JSON
        responseMimeType: "application/json",
      }
    });

    let generatedTasks = [];
    try {
      const text = response.text.trim();
      // Remove potential markdown wrappers if Gemini ignores instructions
      const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
      generatedTasks = JSON.parse(cleanJson);
      
      if (!Array.isArray(generatedTasks)) {
        throw new Error("Output is not an array");
      }
    } catch (e) {
      console.error("Failed to parse Gemini output as JSON:", response.text);
      return NextResponse.json({ error: "AI failed to generate a valid task format." }, { status: 500 });
    }

    // Get the current highest order for the project
    const lastTask = await Task.findOne({ projectId }).sort({ order: -1 });
    let startOrder = lastTask ? lastTask.order + 1 : 0;

    // Prepare tasks for DB insertion
    const tasksToInsert = generatedTasks.map((t, index) => ({
      title: t.title,
      description: t.description,
      priority: ["standard", "urgent", "emergency"].includes(t.priority) ? t.priority : "standard",
      status: "todo",
      projectId: project._id,
      workspace: project.workspace,
      order: startOrder + index,
    }));

    // Insert into DB
    const createdTasks = await Task.insertMany(tasksToInsert);

    return NextResponse.json({ tasks: createdTasks, message: "Tasks generated and added successfully." }, { status: 200 });
  } catch (error) {
    console.error("AI Task Generator Error:", error);
    return NextResponse.json({ error: "Failed to generate AI tasks. Please check API Key and limits." }, { status: 500 });
  }
}
