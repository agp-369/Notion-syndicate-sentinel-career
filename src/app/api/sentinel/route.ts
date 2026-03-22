import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId, memoryPageId, mode, targetPageId, finalIntel } = await req.json();
    
    // --- STAGE A: THE COMMIT HANDLER ---
    if (mode === "COMMIT") {
      stage = "SYNDICATION_COMMIT";
      
      // Update basic properties (Status/Score/Pitch)
      await fetch(`https://api.notion.com/v1/pages/${targetPageId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            "Status": { select: { name: finalIntel.verdict } },
            "Match Score": { number: finalIntel.score / 100 },
            "Pitch": { rich_text: [{ text: { content: finalIntel.cloned_pitch } }] }
          }
        })
      });

      // Append approved blocks
      await fetch(`https://api.notion.com/v1/blocks/${targetPageId}/children`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({
          children: [
            { object: "block", type: "callout", callout: { icon: { emoji: "🧠" }, color: "blue_background", rich_text: [{ type: "text", text: { content: "Approved Strategic Insight: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.mentor_insight } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "📄" }, color: "gray_background", rich_text: [{ type: "text", text: { content: "Resume Strategy: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.resume_strategy } }] } },
            { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: "✍️ Finalized Pitch" } }] } },
            { object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: finalIntel.cloned_pitch } }] } }
          ]
        })
      });

      return NextResponse.json({ success: true });
    }

    // --- STAGE B: THE PREVIEW HANDLER ---
    stage = "UPLINK_SETUP";
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    stage = "CONTEXT_GATHERING";
    const [profileRes, memoryRes] = await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${userProfileId}`, { headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" } }),
      memoryResIdFetch(notionToken, memoryPageId)
    ]);

    const profileData = await profileRes.json();
    const memoryData = memoryRes;

    stage = "TARGET_SEARCH";
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${pageId}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: "Status", select: { is_empty: true } }, page_size: 1 })
    });
    const queryData = await queryRes.json();
    const targetPage = queryData.results?.[0];

    if (!targetPage) throw new Error("No pending leads found in your Notion Ledger.");

    stage = "AI_PREVIEW_GENERATION";
    const prompt = `
      ROLE: Elite Career Architect. Generate a PREVIEW analysis for a job application.
      USER_PROFILE: ${JSON.stringify(profileData.properties)}
      USER_VOICE: ${JSON.stringify(memoryData || "Professional")}
      TARGET_JOB: ${JSON.stringify(targetPage.properties)}
      
      OUTPUT JSON:
      {
        "verdict": "🟢 Verified Match | 🟡 Strategic Reach",
        "score": 90,
        "mentor_insight": "A 2-sentence strategy.",
        "resume_strategy": "Exactly what to tweak.",
        "cloned_pitch": "A 3-sentence email pitch."
      }
    `;

    const aiResult = await model.generateContent(prompt);
    const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    return NextResponse.json({ success: true, intel: { ...intel, targetPageId: targetPage.id } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}

async function memoryResIdFetch(token: string, id: string) {
  if (!id) return null;
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, { headers: { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28" } });
  return res.ok ? await res.json() : null;
}
