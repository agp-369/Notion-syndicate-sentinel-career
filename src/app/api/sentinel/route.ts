import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId, memoryPageId, mode, targetPageId, finalIntel } = await req.json();
    
    // --- STAGE A: THE FORENSIC COMMIT HANDLER ---
    if (mode === "COMMIT") {
      stage = "FORENSIC_SYNDICATION";
      
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

      // APPEND THE DEEP FORENSIC REPORT BLOCKS
      await fetch(`https://api.notion.com/v1/blocks/${targetPageId}/children`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({
          children: [
            { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: "🛡️ Sentinel Forensic Audit Report" } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "🕵️‍♂️" }, color: "red_background", rich_text: [{ type: "text", text: { content: "Fraud Verdict: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.fraud_verdict } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "🧠" }, color: "blue_background", rich_text: [{ type: "text", text: { content: "Strategic Match: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.mentor_insight } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "📄" }, color: "gray_background", rich_text: [{ type: "text", text: { content: "Resume Optimization: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.resume_strategy } }] } },
            { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: "✍️ Voice-Cloned Application Pitch" } }] } },
            { object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: finalIntel.cloned_pitch } }] } },
            { object: "block", type: "divider", divider: {} },
            { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: "🏢 Company Intelligence" } }] } },
            { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: finalIntel.company_health } }] } }
          ]
        })
      });

      return NextResponse.json({ success: true });
    }

    // --- STAGE B: THE FORENSIC PREVIEW HANDLER ---
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

    if (!targetPage) throw new Error("WORKSPACE_IDLE: No pending leads found in your Notion Ledger.");

    stage = "AI_FORENSIC_ANALYSIS";
    const prompt = `
      ROLE: Elite Career Forensic Architect.
      
      TASK: Perform a deep forensic audit of a job opportunity.
      
      CONTEXT:
      - USER_PROFILE: ${JSON.stringify(profileData.properties)}
      - USER_VOICE: ${JSON.stringify(memoryData || "Professional")}
      - TARGET_JOB: ${JSON.stringify(targetPage.properties)}
      
      FORENSIC REQUIREMENTS:
      1. TLD AUDIT: Check the domain (if URL provided). Flag .xyz, .top, .pw or unofficial domains as high risk.
      2. SCAM PATTERNS: Look for "Telegram," "WhatsApp," "Immediate Start," or "Payment required" signals.
      3. AUTHENTICITY SCORE: Evaluate if the JD feels synthetically generated or high-value.
      4. COMPANY HEALTH: Based on the company name, provide a brief (1 sentence) simulated business intelligence report.
      5. RESUME STRATEGY: Exactly what to highlight for a 90%+ match.
      
      OUTPUT JSON (STRICT):
      {
        "verdict": "🟢 Verified Match | 🟡 Strategic Reach | 🔴 High Risk Scam",
        "score": 92,
        "fraud_verdict": "A brief explanation of why this job is safe or dangerous.",
        "mentor_insight": "A strategic match analysis.",
        "resume_strategy": "Direct resume optimization tips.",
        "cloned_pitch": "A 3-sentence voice-cloned application draft.",
        "company_health": "A summary of the company's market position."
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
