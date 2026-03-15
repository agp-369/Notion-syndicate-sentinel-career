import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * 🏛️ NOTION CAREER AGENT (NCA)
 * Protocol-Native Intelligence for Autonomous Career Architecture.
 */

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId } = await req.json();
    
    stage = "UPLINK_SETUP";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- STAGE 1: AGENTIC DISCOVERY (THE SEEKER) ---
    // Discovery logic would go here to add new leads to Notion automatically.

    // --- STAGE 2: FORENSIC ARCHITECT (THE STRATEGIST) ---
    stage = "DATABASE_QUERY";
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${pageId}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: "Status", select: { is_empty: true } }, page_size: 1 })
    });

    const dbData = await dbResponse.json();
    let targetPage = dbData.results?.[0];

    // Fallback to most recent if no empty rows
    if (!targetPage) {
      const fallback = await fetch(`https://api.notion.com/v1/databases/${pageId}/query`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ page_size: 1 })
      });
      const fallbackData = await fallback.json();
      targetPage = fallbackData.results?.[0];
    }

    if (!targetPage) throw new Error("WORKSPACE_EMPTY");

    const targetPageId = targetPage.id;
    const props = targetPage.properties;

    // 3. PROFILE EXTRACTION
    stage = "IDENTITY_PROBE";
    let profileContext = "User: Full-Stack Developer.";
    if (userProfileId) {
      const profileRes = await fetch(`https://api.notion.com/v1/pages/${userProfileId}`, {
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        profileContext = JSON.stringify(profileData.properties);
      }
    }

    // 4. AGENTIC REASONING
    stage = "AI_GUARDIAN_SYNTHESIS";
    const prompt = `
      ROLE: Notion Career Agent (NCA) - Master Strategist.
      CONTEXT: ${profileContext}
      TARGET_JOB: ${JSON.stringify(props)}
      
      TASK:
      1. FORENSICS: Perform deep scam analysis.
      2. STRATEGY: Match skills and calculate fit score (0-100).
      3. INSIGHT: Write 1 sentence on the 'Career Alignment' of this role.
      4. DISPATCH: Draft a high-conversion 2-sentence tailored pitch.
      
      RETURN RAW JSON ONLY:
      {
        "tag": "🟢 VERIFIED | 🔴 SCAM RISK",
        "score": 92,
        "insight": "...",
        "pitch": "..."
      }
    `;

    const aiResult = await model.generateContent(prompt);
    const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    // 5. WORKSPACE SYNC
    stage = "NOTION_WRITEBACK";
    const updatePayload: any = { properties: {} };
    const findKey = (name: string) => Object.keys(props).find(k => k.toLowerCase().includes(name.toLowerCase()));

    const statusKey = findKey("Status");
    const scoreKey = findKey("Match Score");
    const pitchKey = findKey("Tailored Pitch");

    if (statusKey) updatePayload.properties[statusKey] = { select: { name: intel.tag } };
    if (scoreKey) updatePayload.properties[scoreKey] = { number: intel.score / 100 };
    if (pitchKey) updatePayload.properties[pitchKey] = { rich_text: [{ text: { content: intel.pitch } }] };

    await fetch(`https://api.notion.com/v1/pages/${targetPageId}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    return NextResponse.json({ success: true, intel });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
