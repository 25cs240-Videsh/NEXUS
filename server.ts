import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini AI Copilot Analysis endpoint
app.post("/api/ai/investigation-copilot", async (req, res) => {
  try {
    const { graphData, focusNodes, queryType, userQuestion } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        fallback: true,
        assessment: "Network indicates strong coordination between Alex Chen and Harbor Warehouse staging. Downtown Cafe alibi shows significant 22:00 timeline fragility.",
        criticalContradictions: [
          "Alex claims Downtown Cafe presence at 22:00, but Harbor Warehouse keycard logged access at 22:14 (travel time delta is near zero).",
          "Maria Santos proximity near Harbor at 21:45 precedes Alex Chen arrival without direct communication records registered."
        ],
        highPriorityLeads: [
          "Subpoena cell tower sector telemetry for Phone #555-0199 between 21:30 and 22:30.",
          "Interrogate cafe barista regarding witness statement reliability (currently 50% confidence).",
          "Audit physical keycard logs at Harbor Warehouse for badge clone discrepancies."
        ],
        hypotheses: [
          "Downtown Cafe alibi was staged via proxy credit card handoff to James Wright.",
          "Voicemail 79 contains encrypted instructions for meeting location at Apartment 48 52."
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the AI Investigation Copilot: Unified Explainability Engine.
Analyze this criminal investigation network graph:
Nodes: ${JSON.stringify(graphData?.nodes || [])}
Links: ${JSON.stringify(graphData?.links || [])}
Focus: ${JSON.stringify(focusNodes || [])}
Query: ${userQuestion || queryType || "Analyze network gaps, contradictory alibis, and generate prioritized leads."}

Provide a concise, high-impact investigative breakdown with:
1. "assessment": A 2-sentence executive summary of network structure and key vulnerabilities.
2. "criticalContradictions": Array of potential alibi/timeline conflicts found.
3. "highPriorityLeads": Array of top 3 actionable investigative steps with rationale.
4. "hypotheses": Array of 2 testable hypotheses.

Respond in strictly valid JSON format matching this schema without markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    try {
      const parsed = JSON.parse(text);
      return res.json({ success: true, ...parsed });
    } catch {
      return res.json({ success: true, raw: text });
    }
  } catch (error: any) {
    console.error("AI Copilot error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to run AI investigation copilot",
      fallback: true
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
