import dotenv from "dotenv";
import { Client } from "@notionhq/client";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function designEliteCareerOS() {
  const databaseId = process.env.DATABASE_ID!;
  const profileId = process.env.PROFILE_PAGE_ID!;

  console.log("🎨 NCA_DESIGNER: Initiating Construction of the Elite Career OS...");

  try {
    // 1. CREATE THE COMMAND CENTER (Master Shell)
    const dashboard = await notion.pages.create({
      parent: { page_id: profileId },
      icon: { type: "emoji", emoji: "🛰️" },
      cover: { type: "external", external: { url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072" } },
      properties: {
        title: { title: [{ text: { content: "SOVEREIGN CAREER OS" } }] }
      }
    });

    const pageId = dashboard.id;

    // 2. BUILD THE HUD (Heads-Up Display)
    await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: "block",
          type: "heading_1",
          heading_1: { rich_text: [{ type: "text", text: { content: "🖥️ SYSTEM HUD" } }] }
        },
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { emoji: "🛡️" },
            color: "blue_background",
            rich_text: [{ type: "text", text: { content: "NCA GUARDIAN ACTIVE: Monitoring Hacker News & Job Ledger for high-fidelity opportunities. Scam Forensics engine is synced with Gemini 2.5 Flash." } }]
          }
        },
        {
          object: "block",
          type: "divider",
          divider: {}
        }
      ]
    });

    // 3. CREATE THE CORE GRIDS (Columnar Layout)
    // We add placeholders that explain the professional workflow
    await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "📊 Intelligence Manifold" } }] }
        },
        {
          object: "block",
          type: "link_to_page",
          link_to_page: { type: "database_id", database_id: databaseId }
        },
        {
          object: "block",
          type: "quote",
          quote: { rich_text: [{ type: "text", text: { content: "PROFESSIONAL WORKFLOW: Seeker Agent discovers leads -> Strategist Agent performs forensics & matching -> User reviews and checks 'Approved' -> Guardian Agent finalizes dispatch manifest." } }] }
        }
      ]
    });

    console.log("✅ SUCCESS: Elite Career OS Manifested.");
    console.log(`🔗 PRODUCTION URL: https://notion.so/${pageId.replace(/-/g, '')}`);

  } catch (error: any) {
    console.error("❌ DESIGN_CRITICAL_FAILURE:", error.message);
  }
}

designEliteCareerOS();
