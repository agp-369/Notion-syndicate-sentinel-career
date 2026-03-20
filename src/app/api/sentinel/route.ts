import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId } = await req.json();
    
    stage = "UPLINK_SETUP";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using flash for speed, but giving it a deep contextual prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 1. DISCOVER SCHEMA
    stage = "SCHEMA_DISCOVERY";
    const dbRes = await fetch(`https://api.notion.com/v1/databases/${pageId}`, {
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
    });
    const dbSchema = await dbRes.json();
    if (!dbRes.ok) throw new Error(`NOTION_SCHEMA_ERROR: ${dbSchema.message}`);

    const properties = dbSchema.properties;
    const findKey = (name: string) => Object.keys(properties).find(k => k.toLowerCase().includes(name.toLowerCase()));

    const nameKey = findKey("name") || "Name";
    const linkKey = findKey("link") || "Job Link";
    const statusKey = findKey("status") || "Status";

    // 2. QUERY FOR UNPROCESSED ROWS
    stage = "DATABASE_QUERY";
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${pageId}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: statusKey, select: { is_empty: true } }, page_size: 1 })
    });
    const queryData = await queryRes.json();
    let targetPage = queryData.results?.[0];

    // 3. AUTO-SEED IF EMPTY (Friendly Seed)
    if (!targetPage) {
      stage = "AUTO_SEED";
      const lead = { role: "Frontend Developer", company: "Vercel", url: "https://vercel.com/careers" };
      const createPayload: any = {
        parent: { database_id: pageId },
        properties: { [nameKey]: { title: [{ text: { content: `${lead.role} @ ${lead.company}` } }] } }
      };
      if (properties[linkKey]?.type === 'url') createPayload.properties[linkKey] = { url: lead.url };

      const createRes = await fetch(`https://api.notion.com/v1/pages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify(createPayload)
      });
      targetPage = await createRes.json();
    }

    const targetPageId = targetPage.id;
    const props = targetPage.properties;

    // 4. PROFILE EXTRACTION
    stage = "IDENTITY_PROBE";
    let profileContext = "User is looking for their next big opportunity in tech.";
    if (userProfileId) {
      const profileRes = await fetch(`https://api.notion.com/v1/pages/${userProfileId}`, {
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        profileContext = JSON.stringify(profileData.properties);
      }
    }

    // 5. EMPATHETIC MENTOR ANALYSIS
    stage = "AI_MENTOR_SYNTHESIS";
    const prompt = `
      ROLE: You are an Empathetic, Expert Career Mentor. Your goal is to cure job-hunting burnout by providing realistic encouragement, identifying actual skill matches, and protecting the user from scams.
      
      USER CONTEXT: ${profileContext}
      JOB TO ANALYZE: ${JSON.stringify(props)}
      
      TASK:
      1. Analyze the job against the user's skills.
      2. Find a reason to encourage them (e.g., "You don't have X, but your experience in Y is highly transferable").
      3. Draft a warm, professional, authentic email pitch to the recruiter.
      4. Ensure the job isn't a scam (if it asks for payment or seems sketchy, flag it).

      OUTPUT EXACTLY IN THIS JSON FORMAT:
      {
        "status_tag": "🟢 Verified Match | 🟡 Reach Role | 🔴 Scam Risk",
        "match_score": 88,
        "mentor_insight": "A 2-sentence encouraging insight comparing their skills to the job.",
        "email_draft": "A 3-sentence professional email draft."
      }
    `;

    const aiResult = await model.generateContent(prompt);
    const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    // 6. RICH NOTION WRITEBACK
    stage = "NOTION_WRITEBACK";
    const updatePayload: any = { properties: {} };
    
    // Update basic properties
    if (statusKey && properties[statusKey]?.type === 'select') {
      updatePayload.properties[statusKey] = { select: { name: intel.status_tag || "🟢 Verified Match" } };
    }
    const scoreKey = findKey("score") || "Match Score";
    if (scoreKey && properties[scoreKey]?.type === 'number') {
      updatePayload.properties[scoreKey] = { number: (intel.match_score || 85) / 100 };
    }

    // Update the row properties
    await fetch(`https://api.notion.com/v1/pages/${targetPageId}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    // APPEND BEAUTIFUL RICH BLOCKS TO THE PAGE CONTENT
    await fetch(`https://api.notion.com/v1/blocks/${targetPageId}/children`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({
        children: [
          {
            object: "block",
            type: "callout",
            callout: {
              icon: { emoji: "💡" },
              color: "blue_background",
              rich_text: [
                { type: "text", text: { content: "Mentor's Insight: ", link: null }, annotations: { bold: true } },
                { type: "text", text: { content: intel.mentor_insight } }
              ]
            }
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: { rich_text: [{ type: "text", text: { content: "✍️ Suggested Application Draft" } }] }
          },
          {
            object: "block",
            type: "quote",
            quote: { rich_text: [{ type: "text", text: { content: intel.email_draft } }] }
          },
          {
            object: "block",
            type: "divider",
            divider: {}
          }
        ]
      })
    });

    return NextResponse.json({ success: true, rowName: "Career Analysis Complete" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
