import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import axios from "axios";

/**
 * 🏛️ NOTION CAREER AGENT (NCA) - PRO VERSION
 * Focused on High-Value Discovery and Forensic Protection.
 */

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { pageId, notionToken, userProfileId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- STAGE 1: THE SEEKER (HACKER NEWS INTELLIGENCE) ---
    stage = "HACKER_NEWS_DISCOVERY";
    console.log("AGENT_SEEKER: Intelligence Gathering on Hacker News...");
    
    // Fetch latest HN Job stories
    const hnRes = await axios.get("https://hacker-news.firebaseio.com/v0/jobstories.json");
    const latestJobId = hnRes.data[0];
    const jobDetailRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${latestJobId}.json`);
    const hnJob = jobDetailRes.data;

    // --- STAGE 2: AUTO-SEED TO NOTION ---
    stage = "WORKSPACE_SEEDING";
    const createPayload = {
      parent: { database_id: pageId },
      properties: {
        "Name": { title: [{ text: { content: hnJob.title || "New Tech Opportunity" } }] },
        "Job Link": { url: hnJob.url || `https://news.ycombinator.com/item?id=${latestJobId}` },
        "Status": { select: { name: "🟡 PENDING_APPROVAL" } }
      }
    };

    const notionCreateRes = await fetch(`https://api.notion.com/v1/pages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(createPayload)
    });
    const newPage = await notionCreateRes.json();
    if (!notionCreateRes.ok) throw new Error("SEEKER_DISPATCH_FAILED");

    // --- STAGE 3: THE STRATEGIST (FORENSICS + PITCH) ---
    stage = "STRATEGIC_ANALYSIS";
    let profileContext = "Highly skilled developer.";
    if (userProfileId) {
      const pRes = await fetch(`https://api.notion.com/v1/pages/${userProfileId}`, {
        headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
      });
      if (pRes.ok) profileContext = JSON.stringify((await pRes.json()).properties);
    }

    const prompt = `
      ROLE: Notion Career Agent (NCA).
      SOURCE: Hacker News (${hnJob.title})
      USER_CONTEXT: ${profileContext}
      TASK: Perform forensics and write a pitch.
      RETURN RAW JSON ONLY: { "tag": "🟢 VERIFIED", "score": 88, "insight": "...", "pitch": "..." }
    `;

    const aiRes = await model.generateContent(prompt);
    const intel = JSON.parse(aiRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    // --- STAGE 4: FINAL WRITEBACK ---
    stage = "GUARDIAN_SYNC";
    await fetch(`https://api.notion.com/v1/pages/${newPage.id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: {
          "Status": { select: { name: intel.tag } },
          "Match Score": { number: intel.score / 100 },
          "Tailored Pitch": { rich_text: [{ text: { content: intel.pitch } }] }
        }
      })
    });

    return NextResponse.json({ success: true, rowName: hnJob.title });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
