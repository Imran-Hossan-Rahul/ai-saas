import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import Project from "@/models/project.model";
import Task from "@/models/task.model";
import Expense from "@/models/expense.model";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    await connectDb();

    const [project, tasks, expenses] = await Promise.all([
      Project.findById(projectId).populate("owner", "name email").lean(),
      Task.find({ projectId }).lean(),
      Expense.find({ project: projectId }).lean(),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const completedTasks = tasks.filter(t => t.status === "done");
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netAmount = (project.revenue || 0) - totalExpenses;

    const systemPrompt = `You are an expert billing specialist. Generate a professional, itemized invoice breakdown in valid JSON format based on the project data below.

PROJECT DATA:
- Title: ${project.title}
- Client: ${project.owner?.name || "Client"}
- Total Project Budget: $${project.revenue || 0}
- Total Expenses Incurred: $${totalExpenses}
- Completed Tasks (${completedTasks.length}): ${completedTasks.map(t => t.title).join(", ") || "None"}
- Description: ${project.description}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "invoiceTitle": "string",
  "clientName": "string",
  "lineItems": [
    { "description": "string", "quantity": number, "unitPrice": number, "total": number }
  ],
  "subtotal": number,
  "tax": number,
  "totalAmount": number,
  "notes": "string"
}

Rules:
1. Break down the completed work into 3-6 logical line items.
2. unitPrice and quantity should multiply to total.
3. Set tax to 0 unless obvious.
4. totalAmount = subtotal + tax. Keep it close to $${project.revenue || 0}.
5. notes should be a professional payment note (e.g., "Payment due within 14 days").
6. Return ONLY the JSON object. No explanation, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { temperature: 0.3, responseMimeType: "application/json" },
    });

    let rawText = response.text.trim();
    // Strip potential markdown fences
    rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const invoiceData = JSON.parse(rawText);

    return NextResponse.json({ invoiceData, projectRevenue: project.revenue }, { status: 200 });
  } catch (error) {
    console.error("AI Invoice Generator Error:", error);
    return NextResponse.json({ error: "Failed to generate invoice. Check your API key." }, { status: 500 });
  }
}
