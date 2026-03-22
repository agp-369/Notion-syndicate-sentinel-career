import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const server = new Server(
  { name: "nca-guardian-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/**
 * 🛠️ TOOL DEFINITIONS: The AI's "Hands"
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "forensic_web_scrape",
        description: "Scrapes a job URL and returns domain metadata + content for scam detection.",
        inputSchema: {
          type: "object",
          properties: { url: { type: "string" } },
          required: ["url"],
        },
      },
      {
        name: "notion_update_row",
        description: "Updates properties of a job lead row in Notion.",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string" },
            status: { type: "string" },
            score: { type: "number" },
            pitch: { type: "string" }
          },
          required: ["pageId", "status", "score", "pitch"],
        },
      },
      {
        name: "notion_append_insight",
        description: "Appends high-fidelity callout blocks and insights to a Notion page.",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string" },
            insight: { type: "string" },
            emailBody: { type: "string" }
          },
          required: ["pageId", "insight", "emailBody"],
        },
      }
    ],
  };
});

/**
 * ⚙️ TOOL HANDLERS: The Execution Logic
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "forensic_web_scrape": {
        const url = args?.url as string;
        const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const $ = cheerio.load(res.data);
        const text = $("body").text().replace(/\s+/g, " ").trim().substring(0, 2000);
        return { content: [{ type: "text", text: `[DOMAIN] ${new URL(url).hostname} | [CONTENT] ${text}` }] };
      }

      case "notion_update_row": {
        const { pageId, status, score, pitch } = args as any;
        await notion.pages.update({
          page_id: pageId,
          properties: {
            "Status": { select: { name: status } },
            "Match Score": { number: score / 100 },
            "Tailored Pitch": { rich_text: [{ text: { content: pitch } }] }
          }
        });
        return { content: [{ type: "text", text: "ROW_UPDATED" }] };
      }

      case "notion_append_insight": {
        const { pageId, insight, emailBody } = args as any;
        await notion.blocks.children.append({
          block_id: pageId,
          children: [
            {
              object: "block",
              type: "callout",
              callout: {
                icon: { emoji: "🧠" },
                color: "blue_background",
                rich_text: [{ type: "text", text: { content: `GUARDIAN INSIGHT: ${insight}` } }]
              }
            },
            {
              object: "block",
              type: "heading_3",
              heading_3: { rich_text: [{ type: "text", text: { content: "📫 Professional Dispatch Draft" } }] }
            },
            {
              object: "block",
              type: "code",
              code: {
                language: "plain text",
                rich_text: [{ type: "text", text: { content: emailBody } }]
              }
            }
          ]
        });
        return { content: [{ type: "text", text: "INSIGHT_APPENDED" }] };
      }

      default:
        throw new Error("Tool not found");
    }
  } catch (error: any) {
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
