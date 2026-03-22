import dotenv from "dotenv";
import { Client } from "@notionhq/client";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function buildProfessionalTemplate() {
  const databaseId = process.env.DATABASE_ID!;
  console.log("🏗️ NCA_TEMPLATE_BUILDER: Architecting Forensic Dossier Structure...");

  try {
    // 1. ADD COLUMNS FOR PROFESSIONAL RIGOR
    // We add technical properties that show deep data-handling
    await notion.databases.update({
      database_id: databaseId,
      properties: {
        "Scam DNA": { select: { options: [
          { name: "🔴 HIGH RISK", color: "red" },
          { name: "🟡 SUSPICIOUS", color: "orange" },
          { name: "🟢 VERIFIED SOURCE", color: "green" }
        ] } },
        "Tech Stack Match": { multi_select: { options: [] } },
        "Last Scan": { date: {} }
      }
    });

    console.log("✅ SUCCESS: Database Schema Hardened with Forensic Properties.");

    // 2. EXPLAIN THE VIEW ARCHITECTURE
    // (Note: Database Views cannot be created via API currently, 
    // so we will append instructions to the Dashboard instead)
    
    const dashboardId = "32ab053abf99814eb90df36f917453d0"; // Your new OS Page ID
    await notion.blocks.children.append({
      block_id: dashboardId,
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "🕵️ Forensic Protocol" } }] }
        },
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { emoji: "🔬" },
            color: "yellow_background",
            rich_text: [{ type: "text", text: { content: "The Strategist Agent performs a 4-point check on every lead: Domain Authority, High-Pay Logic, Urgency Markers, and Recruiter Sentiment." } }]
          }
        }
      ]
    });

    console.log("✅ SUCCESS: Forensic Protocol instructions appended to Dashboard.");

  } catch (error: any) {
    console.error("❌ TEMPLATE_BUILD_FAILED:", error.message);
  }
}

buildProfessionalTemplate();
