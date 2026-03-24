import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function setup() {
  try {
    console.log("🔍 Checking Notion connection...");
    const searchRes = await notion.search({
      filter: { property: "object", value: "page" },
      page_size: 1,
    });

    if (searchRes.results.length === 0) {
      console.log("❌ ERROR: Your Notion Integration is working, but it has NO access to any pages.");
      console.log("👉 FIX: Please go to Notion, create a page called 'Lumina Career OS', click the '...' menu, select 'Connect to' and choose your integration.");
      return;
    }

    const parentPageId = searchRes.results[0].id;
    console.log(`✅ Found a shared parent page! ID: ${parentPageId}`);

    console.log("🏗️ Checking for 'Job Ledger' database...");
    const dbSearch = await notion.search({
      filter: { property: "object", value: "database" },
    });
    
    const ledger = dbSearch.results.find((db: any) => db.title[0]?.plain_text.includes("Job Ledger"));
    
    if (ledger) {
      console.log(`✅ Job Ledger already exists with ID: ${ledger.id}`);
      return;
    }

    console.log("🏗️ Creating 'Job Ledger' database...");
    const createRes = await notion.databases.create({
      parent: { page_id: parentPageId },
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
    });

    console.log(`🎉 SUCCESS! Lumina Job Ledger properly created with ID: ${createRes.id}`);
  } catch (error: any) {
    console.error("❌ FATAL NOTION API ERROR:");
    console.error(error.message);
  }
}

setup();
