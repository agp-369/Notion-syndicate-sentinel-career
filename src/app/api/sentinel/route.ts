import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const { mode, accessToken, payload } = await req.json();
  if (!accessToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    // 🔍 DISCOVERY
    if (mode === "DISCOVER") {
      const searchRes = await fetch("https://api.notion.com/v1/search", {
        method: "POST", headers, body: JSON.stringify({
          filter: { property: "object", value: "database" }
        })
      });
      const searchData = await searchRes.json();
      const ledger = searchData.results?.find((d: any) => d.title?.[0]?.plain_text?.includes("Job Ledger"));

      const pageSearchRes = await fetch("https://api.notion.com/v1/search", {
        method: "POST", headers, body: JSON.stringify({
          filter: { property: "object", value: "page" }
        })
      });
      const pageSearchData = await pageSearchRes.json();
      const profile = pageSearchData.results?.find((d: any) => d.properties?.title?.title?.[0]?.plain_text?.includes("My Core Profile") || d.id === process.env.PROFILE_PAGE_ID?.replace(/-/g, ""));

      return NextResponse.json({ 
        success: true, 
        ledgerId: ledger?.id, 
        profileId: profile?.id,
        found: !!ledger
      });
    }

    // 🏗️ ARCHITECT: Create databases
    if (mode === "INITIALIZE_WORKSPACE") {
      const pageSearch = await fetch("https://api.notion.com/v1/search", {
        method: "POST", headers, body: JSON.stringify({ filter: { property: "object", value: "page" }, page_size: 1 })
      });
      const pageData = await pageSearch.json();
      const parentId = pageData.results?.[0]?.id;

      if (!parentId) throw new Error("No shared page found in Notion. Please create an empty page in Notion and share it with the 'Syndicate Nexus' integration to link your workspace.");

      // Create Job Ledger DB
      const createLedger = await fetch("https://api.notion.com/v1/databases", {
        method: "POST", headers, body: JSON.stringify({
          parent: { page_id: parentId },
          title: [{ text: { content: "Job Ledger" } }],
          properties: {
            "Name": { title: {} },
            "Job Link": { url: {} },
            "Status": { select: { options: [{ name: "🔴 SCAM RISK", color: "red" }, { name: "🟢 VERIFIED", color: "green" }, { name: "🟡 PENDING_APPROVAL", color: "yellow" }] } },
            "Match Score": { number: { format: "percent" } },
            "Safety Score": { number: { format: "percent" } },
            "Tailored Pitch": { rich_text: {} },
            "Approved": { checkbox: {} }
          }
        })
      });
      const createLedgerData = await createLedger.json();
      
      return NextResponse.json({ success: true, message: "Workspace Initialized", ledgerId: createLedgerData.id });
    }

    // 🤖 AUDIT JOB: Scrape & AI Analysis
    if (mode === "AUDIT_JOB") {
      const url = payload.url;
      let text = "";
      try {
         const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000 });
         const $ = cheerio.load(res.data);
         text = $("body").text().replace(/\s+/g, " ").trim().substring(0, 3000);
      } catch (e) {
         text = "Failed to scrape job content directly. Assume basic context based on URL domain.";
      }
      
      const domain = new URL(url).hostname;

      // Gemini Prompt
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are Lumina, an elite cyber-forensic career agent. 
      Analyze this job posting from domain: ${domain}
      Content: ${text}
      
      Tasks:
      1. Verify if this looks like a scam (ghost job, weird payment terms, unrelated domain). Calculate a Safety Score (0-100).
      2. Assuming I am a highly motivated technology professional, evaluate the job requirement stringency and calculate a Match Score (0-100).
      3. Write a short explanation (2-3 sentences max) of why this match/safety score was given. This will be shown via progressive disclosure in the UI.
      4. Write a 2-sentence tailored pitch I can use.
      5. Extract a logical "Job Title" based on the posting.
      
      Format your response EXACTLY as a raw JSON string with NO markdown wrapping, matching this interface:
      {
        "safetyScore": number,
        "matchScore": number,
        "verdict": "🟢 VERIFIED" | "🔴 SCAM RISK" | "🟡 PENDING_APPROVAL",
        "reasoning": string,
        "pitch": string,
        "jobTitle": string
      }
      `;
      
      const aiRes = await model.generateContent(prompt);
      const aiResponseText = aiRes.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const analysis = JSON.parse(aiResponseText);
      
      return NextResponse.json({ success: true, analysis });
    }

    // 🎓 GENERATE SYLLABUS: AI Mentorship Matching & 90-Day Pathway
    if (mode === "GENERATE_SYLLABUS") {
      const { menteeName, targetRole } = payload;
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are Lumina, an elite Career Orchestration Agent.
      Generate a 90-Day Mentorship Syllabus for a mentee named "${menteeName}" aiming for the role of "${targetRole}".
      Include:
      1. A calculated Mentor Match Score (0-100) based on optimal career trajectories.
      2. A 3-phase high-level syllabus (Days 1-30, Days 31-60, Days 61-90).
      3. A justification for the match ("Why this recommendation?").
      
      Return EXACTLY raw JSON (no markdown):
      {
        "matchScore": number,
        "mentorName": "Alex Rivera (Principal Engineer)",
        "justification": string,
        "phases": [
           { "timeframe": "Days 1-30", "focus": string },
           { "timeframe": "Days 31-60", "focus": string },
           { "timeframe": "Days 61-90", "focus": string }
        ]
      }`;
      const aiRes = await model.generateContent(prompt);
      const aiResponseText = aiRes.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const syllabus = JSON.parse(aiResponseText);
      
      return NextResponse.json({ success: true, syllabus });
    }

    // 🚀 SYNC TO NOTION
    if (mode === "SYNC_TO_NOTION") {
      const { ledgerId, analysis, url } = payload;
      
      // 1. Create the page
      const createRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST", headers, body: JSON.stringify({
          parent: { database_id: ledgerId },
          properties: {
            "Name": { title: [{ text: { content: analysis.jobTitle || "Analyzed Job" } }] },
            "Job Link": { url: url },
            "Status": { select: { name: analysis.verdict } },
            "Match Score": { number: analysis.matchScore / 100 },
            "Safety Score": { number: analysis.safetyScore / 100 },
            "Tailored Pitch": { rich_text: [{ text: { content: analysis.pitch } }] },
            "Approved": { checkbox: true }
          }
        })
      });
      const newPage = await createRes.json();
      
      // 2. Append Forensic Log block (Advanced UI formatting)
      const blocksParams = {
        children: [
          {
            object: "block",
            type: "callout",
            callout: {
              rich_text: [{ type: "text", text: { content: `LUMINA FORENSIC AUDIT: ${analysis.verdict} (${analysis.safetyScore}% Safe)` } }],
              icon: { emoji: analysis.safetyScore > 70 ? "🛡️" : "⚠️" },
              color: analysis.safetyScore > 70 ? "green_background" : "red_background"
            }
          },
          {
            object: "block",
            type: "toggle",
            toggle: {
              rich_text: [{ type: "text", text: { content: "View Deep Reasoning & AI Audit Trail" } }],
              children: [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: { rich_text: [{ type: "text", text: { content: analysis.reasoning } }] }
                }
              ]
            }
          }
        ]
      };
      
      const blockRes = await fetch(`https://api.notion.com/v1/blocks/${newPage.id}/children`, {
        method: "PATCH", headers, body: JSON.stringify(blocksParams)
      });
      
      return NextResponse.json({ success: true, url: newPage.url });
    }

    // 🚀 SYNC SYLLABUS TO NOTION
    if (mode === "SYNC_SYLLABUS") {
      const { parentId, syllabus, menteeName, targetRole } = payload;
      
      const createRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST", headers, body: JSON.stringify({
          parent: { page_id: parentId.replace(/-/g, "") },
          properties: {
            "title": { title: [{ text: { content: `Mentorship: ${menteeName} x ${syllabus.mentorName}` } }] }
          },
          children: [
            {
              object: "block",
              type: "callout",
              callout: {
                rich_text: [{ type: "text", text: { content: `LUMINA MENTOR MATCH: ${syllabus.matchScore}% Synergy` } }],
                icon: { emoji: "🤝" },
                color: "blue_background"
              }
            },
            {
              object: "block",
              type: "heading_2",
              heading_2: { rich_text: [{ type: "text", text: { content: "🎯 The 90-Day Syllabus" } }] }
            },
            ...syllabus.phases.map((p: any) => ({
              object: "block",
              type: "to_do",
              to_do: { rich_text: [{ type: "text", text: { content: `[${p.timeframe}] ${p.focus}` } }] }
            }))
          ]
        })
      });
      const newPage = await createRes.json();
      return NextResponse.json({ success: true, url: newPage.url });
    }

    return NextResponse.json({ success: false, error: "Invalid Mode" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
