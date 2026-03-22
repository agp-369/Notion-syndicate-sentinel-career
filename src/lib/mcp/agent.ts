import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client as NotionClient } from "@notionhq/client";
import axios from "axios";
import dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

async function runMasterGuardian() {
  console.log("🛡️ NCA_GUARDIAN: Booting Dual-Agent Infrastructure...");

  const serverPath = path.join(process.cwd(), "src/lib/mcp/server.ts");
  const transport = new StdioClientTransport({ command: "npx", args: ["tsx", serverPath] });
  const mcpClient = new Client({ name: "nca-master-agent", version: "2.0.0" }, { capabilities: { tools: {} } });

  await mcpClient.connect(transport);
  console.log("🔗 MCP_UPLINK: Handshake Complete.");

  while (true) {
    try {
      // --- AGENT 1: THE OPPORTUNITY SEEKER ---
      console.log("📡 SEEKER_AGENT: Hunting for elite jobs on Hacker News...");
      const hnRes = await axios.get("https://hacker-news.firebaseio.com/v0/jobstories.json");
      const latestJobs = hnRes.data.slice(0, 3); // Get top 3 latest jobs

      for (const jobId of latestJobs) {
        const jobDetail = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${jobId}.json`);
        const job = jobDetail.data;

        // Check if job already exists in Notion
        const existing = await notion.databases.query({
          database_id: process.env.DATABASE_ID!,
          filter: { property: "Job Link", url: { equals: job.url || `https://news.ycombinator.com/item?id=${jobId}` } }
        });

        if (existing.results.length === 0) {
          console.log(`✨ SEEKER_AGENT: Discovered new lead: ${job.title}`);
          await notion.pages.create({
            parent: { database_id: process.env.DATABASE_ID! },
            properties: {
              "Company / Role": { title: [{ text: { content: job.title || "Elite Tech Role" } }] },
              "Job Link": { url: job.url || `https://news.ycombinator.com/item?id=${jobId}` },
              "Status": { select: { name: "🟡 PENDING_APPROVAL" } }
            }
          });
        }
      }

      // --- AGENT 2: THE STRATEGIC GUARDIAN ---
      console.log("🔍 STRATEGIST_AGENT: Scanning Ledger for unprocessed manifolds...");
      const pendingLeads = await notion.databases.query({
        database_id: process.env.DATABASE_ID!,
        filter: { property: "Status", select: { equals: "🟡 PENDING_APPROVAL" } },
        page_size: 1
      });

      if (pendingLeads.results.length > 0) {
        const page: any = pendingLeads.results[0];
        const url = page.properties["Job Link"]?.url || "NO_LINK";
        const title = page.properties["Company / Role"]?.title?.[0]?.plain_text || "Unknown";

        console.log(`🎯 TARGET_LOCKED: Analyzing ${title}...`);

        // Perform Scrape via MCP Tool
        const scrapeRes = await mcpClient.callTool({ name: "forensic_web_scrape", arguments: { url } });
        
        // Deep AI Analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
          ACT AS: Elite Career Strategist.
          TARGET: ${title}
          SOURCE_DATA: ${scrapeRes.content[0].text}
          USER_PROFILE: "Next.js, Python, AI Agent Expert, Kaggle High-Ranker."
          
          TASK:
          1. SCAM_DNA: Identify risk (🔴 HIGH | 🟡 SUSPICIOUS | 🟢 VERIFIED).
          2. SALARY_EST: Professional estimate based on role.
          3. MATCH_SCORE: 0-100.
          4. INSIGHT: Why this matters for a high-end career path.
          5. PITCH: A 3-sentence high-conversion application draft.
          
          RETURN RAW JSON ONLY:
          {
            "tag": "🟢 VERIFIED",
            "risk": "🟢 VERIFIED SOURCE",
            "salary": "$140k - $190k",
            "score": 92,
            "insight": "...",
            "pitch": "..."
          }
        `;

        const aiResult = await model.generateContent(prompt);
        const intel = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

        // Update Notion
        await notion.pages.update({
          page_id: page.id,
          properties: {
            "Status": { select: { name: intel.tag } },
            "Scam DNA": { select: { name: intel.risk } },
            "Match Score": { number: intel.score / 100 },
            "Tailored Pitch": { rich_text: [{ text: { content: intel.pitch } }] }
          }
        });

        // Append Rich Dossier
        await mcpClient.callTool({
          name: "notion_append_insight",
          arguments: {
            pageId: page.id,
            insight: `${intel.insight} | Estimated Salary: ${intel.salary}`,
            emailBody: `Subject: Strategic Application - ${title}\n\n${intel.pitch}\n\nBest,\nAbhishek`
          }
        });

        console.log("✅ SUCCESS: Intelligence Manifold Dispatched.");
      }

      await new Promise(r => setTimeout(r, 20000)); // Poll every 20s

    } catch (e: any) {
      console.error("❌ GUARDIAN_ERROR:", e.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

runMasterGuardian().catch(console.error);
