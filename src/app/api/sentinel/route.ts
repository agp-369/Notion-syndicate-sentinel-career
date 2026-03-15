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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 1. DISCOVER DATABASE SCHEMA
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

    // 3. AUTO-SEED IF EMPTY
    if (!targetPage) {
      stage = "AUTO_SEED_PROTOCOL";
      const seedPrompt = "Generate 1 high-growth tech lead (e.g. Google). Return RAW JSON: { \"role\": \"string\", \"company\": \"string\", \"url\": \"string\" }";
      const seedResult = await model.generateContent(seedPrompt);
      const lead = JSON.parse(seedResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

      const createPayload: any = {
        parent: { database_id: pageId },
        properties: {
          [nameKey]: { title: [{ text: { content: `${lead.role} at ${lead.company}` } }] }
        }
      };
      
      // Only add URL if the discovered linkKey is a URL property
      if (properties[linkKey]?.type === 'url') createPayload.properties[linkKey] = { url: lead.url };

      const createRes = await fetch(`https://api.notion.com/v1/pages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify(createPayload)
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(`SEED_WRITE_FAILED: ${err.message}. Found columns: ${Object.keys(properties).join(", ")}`);
      }
      targetPage = await createRes.json();
    }

    // 4. AGENTIC ANALYSIS
    stage = "AI_GUARDIAN_SYNTHESIS";
    const aiResult = await model.generateContent(`Analyze this job: ${JSON.stringify(targetPage.properties)}`);
    const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    // 5. FINAL SYNC
    stage = "NOTION_WRITEBACK";
    const updatePayload: any = { properties: {} };
    const scoreKey = findKey("score") || "Match Score";
    const pitchKey = findKey("pitch") || "Tailored Pitch";

    if (statusKey && properties[statusKey]?.type === 'select') {
      updatePayload.properties[statusKey] = { select: { name: intel.tag || "🟢 VERIFIED" } };
    }
    if (scoreKey && properties[scoreKey]?.type === 'number') {
      updatePayload.properties[scoreKey] = { number: (intel.score || 85) / 100 };
    }
    if (pitchKey) {
      updatePayload.properties[pitchKey] = { rich_text: [{ text: { content: intel.draft || "Personalized pitch ready." } }] };
    }

    await fetch(`https://api.notion.com/v1/pages/${targetPage.id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    return NextResponse.json({ success: true, rowName: "Agent Initialized" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
