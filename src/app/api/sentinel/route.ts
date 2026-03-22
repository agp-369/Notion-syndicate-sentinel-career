import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { mode, notionToken, dbIds, payload } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- MODULE 1: FORENSIC SENTINEL (Job Audits) ---
    if (mode === "FORENSIC_AUDIT") {
      stage = "FORENSIC_CONTEXT";
      const targetJobId = payload.targetJobId;
      const jobRes = await fetch(`https://api.notion.com/v1/pages/${targetJobId}`, { headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" } });
      const jobData = await jobRes.json();

      const prompt = `
        ROLE: Career Forensic Specialist. 
        Perform a Deep Audit of this Job: ${JSON.stringify(jobData.properties)}
        Check: TLD Safety, Scam Patterns, Authenticity Score (0-100).
        
        OUTPUT JSON: { "verdict": "Verified | Suspicious | Scam", "score": 85, "reasoning": "...", "trust_score": 92 }
      `;
      const aiResult = await model.generateContent(prompt);
      const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

      return NextResponse.json({ success: true, intel });
    }

    // --- MODULE 2: TALENT MATCHMAKER (Mentorship Pairing) ---
    if (mode === "TALENT_MATCH") {
      stage = "MENTORSHIP_PAIRING";
      const talentDbId = dbIds.talent;
      const talentQuery = await fetch(`https://api.notion.com/v1/databases/${talentDbId}/query`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
      });
      const talentData = await talentQuery.json();

      const prompt = `
        ROLE: HR Intelligence Agent. Pair Mentors and Mentees from this directory: ${JSON.stringify(talentData.results)}
        Match based on skills and goals. Provide a match confidence score.
        
        OUTPUT JSON: { "pairs": [ { "mentor": "...", "mentee": "...", "confidence": 95, "reason": "..." } ] }
      `;
      const aiResult = await model.generateContent(prompt);
      const pairing = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

      return NextResponse.json({ success: true, pairing });
    }

    // --- MODULE 3: THE ALCHEMIST (Syllabus & Page Generation) ---
    if (mode === "GENERATE_SYLLABUS") {
      stage = "AUTONOMOUS_ORCHESTRATION";
      const { mentorId, menteeId, topic } = payload;
      
      const prompt = `Generate a high-fidelity, 90-day mentorship syllabus for ${topic}. Break it into Month 1, 2, and 3 with weekly goals.`;
      const aiResult = await model.generateContent(prompt);
      const syllabus = aiResult.response.text();

      // Create a NEW Notion Page for the Mentorship Workspace
      const newPageRes = await fetch(`https://api.notion.com/v1/pages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({
          parent: { database_id: dbIds.mentorship },
          properties: { "Name": { title: [{ text: { content: `🤝 Workspace: ${topic}` } }] } },
          children: [
            { object: "block", type: "heading_1", heading_1: { rich_text: [{ type: "text", text: { content: "🚀 90-Day Learning Path" } }] } },
            { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: syllabus } }] } }
          ]
        })
      });

      return NextResponse.json({ success: true, page: await newPageRes.json() });
    }

    return NextResponse.json({ error: "INVALID_MODE" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
