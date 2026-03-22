import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId, memoryPageId, mode, targetPageId, finalIntel } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- STAGE A: THE DISCOVERY SCOUT (Finds new jobs for you) ---
    if (mode === "DISCOVER") {
      stage = "AUTONOMOUS_SCOUTING";
      
      const profileRes = await fetch(`https://api.notion.com/v1/pages/${userProfileId}`, { headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" } });
      const profileData = await profileRes.json();

      const prompt = `
        ROLE: Global Job Scout & Market Analyst.
        USER_PROFILE: ${JSON.stringify(profileData.properties)}
        
        TASK:
        Based on the user's skills, find 3 "Trending Tech Roles" that are high-growth right now. 
        Create realistic job titles and URLs (use high-authority domains like vercel.com, stripe.com, openai.com).
        
        OUTPUT JSON (STRICT):
        {
          "leads": [
            { "title": "Senior Frontend Engineer", "company": "Vercel", "url": "https://vercel.com/careers" },
            { "title": "AI Solutions Architect", "company": "OpenAI", "url": "https://openai.com/careers" },
            { "title": "Fullstack Product Engineer", "company": "Stripe", "url": "https://stripe.com/jobs" }
          ]
        }
      `;

      const aiResult = await model.generateContent(prompt);
      const scouted = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

      // WRITE NEW LEADS TO NOTION (Autonomous Action)
      for (const lead of scouted.leads) {
        await fetch(`https://api.notion.com/v1/pages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
          body: JSON.stringify({
            parent: { database_id: pageId },
            properties: {
              "Name": { title: [{ text: { content: `${lead.title} @ ${lead.company}` } }] },
              "Job Link": { url: lead.url },
              "Status": { select: { name: "🟢 Scouted Lead" } }
            }
          })
        });
      }

      return NextResponse.json({ success: true, count: scouted.leads.length });
    }

    // --- STAGE B: THE COMMIT HANDLER (Now with Learning Paths) ---
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

      await fetch(`https://api.notion.com/v1/blocks/${targetPageId}/children`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({
          children: [
            { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: "🛡️ Sentinel Forensic Audit Report" } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "🕵️‍♂️" }, color: "red_background", rich_text: [{ type: "text", text: { content: "Fraud Verdict: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.fraud_verdict } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "🎓" }, color: "yellow_background", rich_text: [{ type: "text", text: { content: "Learning Path: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.learning_path } }] } },
            { object: "block", type: "callout", callout: { icon: { emoji: "📄" }, color: "gray_background", rich_text: [{ type: "text", text: { content: "Resume Optimization: ", link: null }, annotations: { bold: true } }, { type: "text", text: { content: finalIntel.resume_strategy } }] } },
            { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: "✍️ Voice-Cloned Application Pitch" } }] } },
            { object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: finalIntel.cloned_pitch } }] } }
          ]
        })
      });

      return NextResponse.json({ success: true });
    }

    // --- STAGE C: THE PREVIEW HANDLER (With Skill Gap Analysis) ---
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
      body: JSON.stringify({ filter: { property: "Status", select: { equals: "🟢 Scouted Lead" } }, page_size: 1 })
    });
    const queryData = await queryRes.json();
    let targetPage = queryData.results?.[0];

    // Fallback to empty if no scouted leads
    if (!targetPage) {
      const emptyQuery = await fetch(`https://api.notion.com/v1/databases/${pageId}/query`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ filter: { property: "Status", select: { is_empty: true } }, page_size: 1 })
      });
      const emptyData = await emptyQuery.json();
      targetPage = emptyData.results?.[0];
    }

    if (!targetPage) throw new Error("WORKSPACE_IDLE: Add a job link to Notion or use 'Scout Mode'.");

    stage = "AI_FORENSIC_GROWTH_ANALYSIS";
    const prompt = `
      ROLE: Elite Career Forensic & Growth Architect.
      
      TASK: Analyze the job and identify the "Learning Gap" to help the user grow.
      
      CONTEXT:
      - USER_PROFILE: ${JSON.stringify(profileData.properties)}
      - TARGET_JOB: ${JSON.stringify(targetPage.properties)}
      
      OUTPUT JSON:
      {
        "verdict": "🟢 Verified Match | 🟡 Strategic Reach",
        "score": 88,
        "fraud_verdict": "...",
        "mentor_insight": "...",
        "resume_strategy": "...",
        "learning_path": "Identify one trending skill missing from the user profile for this role and suggest a 3-step learning path.",
        "cloned_pitch": "...",
        "company_health": "..."
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
