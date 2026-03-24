import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { runForensicAudit } from "./lib/intelligence.js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

/**
 * 🏛️ LUMINA SOVEREIGN MCP NODE
 * Protocol-Native Intelligence for Autonomous Career Architecture.
 */

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const server = new Server(
  {
    name: "lumina-mcp-node",
    version: "2.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Expose Notion Career Context as an AI Resource
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "notion://job-ledger-metadata",
        name: "User Job Ledger Structure",
        description: "The structural schema of the Job Ledger database.",
        mimeType: "application/json",
      }
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "notion://job-ledger-metadata") {
    // Dynamically fetch the Job Ledger ID 
    const dbSearch = await notion.search({ filter: { property: "object", value: "database" } });
    const ledger = dbSearch.results.find((db: any) => db.title[0]?.plain_text.includes("Job Ledger") || db.title[0]?.plain_text.includes("Talent Pool"));
    
    if (!ledger) throw new Error("Job Ledger/Talent Pool not found in Workspace. Run UI setup first.");
    
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(ledger, null, 2),
      }],
    };
  }
  throw new Error("Resource not found");
});

// Expose Forensics & Sync as AI Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_forensic_audit",
        description: "Scrapes a job posting URL and performs a deep forensic analysis for scam risks, ghost job indicators, and cultural mismatch, then logs it to the Notion Job Ledger.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target URL to audit." }
          },
          required: ["url"],
        },
      },
      {
        name: "generate_career_syllabus",
        description: "Generates a 90-day gamified mentorship syllabus and provisions a dedicated Notion workspace page for it.",
        inputSchema: {
          type: "object",
          properties: {
            menteeName: { type: "string", description: "Name of the person." },
            targetRole: { type: "string", description: "Their target career goal." }
          },
          required: ["menteeName", "targetRole"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "run_forensic_audit": {
        const url = args?.url as string;
        
        // 1. Intelligence Engine Execution
        const analysis = await runForensicAudit(url);

        // 2. Find Ledger
        const dbSearch = await notion.search({ filter: { property: "object", value: "database" } });
        // Look for "Job Ledger" OR "Talent Pool" (fallback for demo simplicity)
        const ledger = dbSearch.results.find((db: any) => db.title[0]?.plain_text.includes("Job Ledger") || db.title[0]?.plain_text.includes("Talent Pool"));
        if (!ledger) throw new Error("Job Ledger database not found. Please initialize via the web dashboard first.");

        // 3. Sync to Notion
        // Note: We adapt the properties based on what we likely have in the DB.
        // For a robust implementation, we'd check the schema, but for hackathon speed we assume the 'Job Ledger' schema.
        
        const properties: any = {
           "Name": { title: [{ text: { content: analysis.jobDetails.title } }] },
           "Job Link": { url: url },
           "Status": { select: { name: analysis.verdict } },
           "Match Score": { number: analysis.score / 100 },
           "Tailored Pitch": { rich_text: [{ text: { content: `CULTURE MATCH: ${analysis.analysis.cultureMatch}\n\nSUMMARY: ${analysis.jobDetails.summary}` } }] }
        };

        // If Safety Score property exists (optional check), we could add it. 
        // We'll stick to the core properties defined in the setup guide.

        const newPage = await notion.pages.create({
          parent: { database_id: ledger.id },
          properties: properties,
          children: [
            {
              object: "block",
              type: "callout",
              callout: {
                rich_text: [{ type: "text", text: { content: `VERDICT: ${analysis.verdict} (${analysis.score}%)` } }],
                icon: { emoji: analysis.score > 80 ? "🟢" : analysis.score > 50 ? "🟡" : "🔴" },
                color: analysis.score > 80 ? "green_background" : "red_background"
              }
            },
            {
              object: "block",
              type: "heading_3",
              heading_3: { rich_text: [{ type: "text", text: { content: "🚩 Forensic Flags" } }] }
            },
            {
              object: "block",
              type: "bulleted_list_item",
              bulleted_list_item: { rich_text: [{ type: "text", text: { content: analysis.analysis.flags.join(", ") || "No major red flags detected." } }] }
            },
            {
              object: "block",
              type: "heading_3",
              heading_3: { rich_text: [{ type: "text", text: { content: "🕵️ Hidden Signals" } }] }
            },
            {
              object: "block",
              type: "paragraph",
              paragraph: { rich_text: [{ type: "text", text: { content: analysis.analysis.hiddenSignals.join("\n") } }] }
            }
          ]
        });

        return { 
          content: [
            { 
              type: "text", 
              text: `[FORENSIC_AUDIT_COMPLETE] Analyzed ${analysis.jobDetails.company}. Verdict: ${analysis.verdict}. Logged to Notion: ${(newPage as any).url}` 
            }
          ] 
        };
      }

      case "generate_career_syllabus": {
        const { menteeName, targetRole } = args as any;

        // 1. Gemini Gen
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate a 90-Day Mentorship Syllabus for a mentee named "${menteeName}" aiming for "${targetRole}".
        Return EXACT raw JSON matching: { "matchScore": number, "mentorName": "...", "justification": "...", "phases": [ { "timeframe": "Days 1-30", "focus": "..." }, ... ] }`;
        const aiRes = await model.generateContent(prompt);
        const syllabus = JSON.parse(aiRes.response.text().replace(/```json/g, "").replace(/```/g, "").trim());

        // 2. Find parent page (where Job Ledger is stored)
        const dbSearch = await notion.search({ filter: { property: "object", value: "database" } });
        const ledger = dbSearch.results.find((db: any) => db.title[0]?.plain_text.includes("Job Ledger"));
        if (!ledger) throw new Error("Parent Workspace not found. Initialize UI first.");
        
        const parentId = (ledger as any).parent?.page_id || process.env.PROFILE_PAGE_ID;

        // 3. Create Syllabus Page in Notion
        const newPage = await notion.pages.create({
           parent: { page_id: parentId },
           properties: { "title": { title: [{ text: { content: `Mentorship: ${menteeName} x ${syllabus.mentorName}` } }] } },
           children: [
             { object: "block", type: "callout", callout: { rich_text: [{ type: "text", text: { content: `LUMINA MENTOR MATCH: ${syllabus.matchScore}% Synergy` } }], icon: { emoji: "🤝" }, color: "blue_background" } },
             ...syllabus.phases.map((p: any) => ({ object: "block", type: "to_do", to_do: { rich_text: [{ type: "text", text: { content: `[${p.timeframe}] ${p.focus}` } }] } }))
           ]
        });

        return { content: [{ type: "text", text: `[SYLLABUS_CREATED] Notion workspace provisioned at: ${(newPage as any).url}` }] };
      }

      default:
        throw new Error("Tool not found");
    }
  } catch (e: any) {
    return { isError: true, content: [{ type: "text", text: `EXECUTION_FAILURE: ${e.message}` }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log strictly to stderr so stdout remains clean for MCP communication
  console.error("Lumina MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
