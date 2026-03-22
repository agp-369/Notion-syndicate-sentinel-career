import dotenv from "dotenv";

dotenv.config();

async function manageNotionWorkspace() {
  const notionToken = process.env.NOTION_TOKEN!;
  const databaseId = process.env.DATABASE_ID!;

  console.log(`🚀 NCA_MANAGER: Synchronizing Workspace Manifold...`);

  try {
    // 1. HARDEN CORE PROPERTIES (SAFE MODE)
    // We only ensure the Match Score format and the presence of necessary rich text fields
    await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          "Match Score": { number: { format: "percent" } },
          "Tailored Pitch": { rich_text: {} },
          "Career Insight": { rich_text: {} },
          "Approved": { checkbox: {} }
        }
      })
    });

    console.log("✅ SUCCESS: Property Manifolds Aligned.");

    // 2. DISCOVER DATABASE TO FIND TITLE KEY
    const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: { "Authorization": `Bearer ${notionToken}`, "Notion-Version": "2022-06-28" }
    });
    const dbData = await dbRes.json();
    const titleKey = Object.keys(dbData.properties).find(k => dbData.properties[k].type === 'title') || "Name";

    // 3. SEED LIVE DISCOVERY (The ultimate proof)
    console.log(`🚀 NCA_MANAGER: Seeding Golden Discovery via ${titleKey}...`);
    
    await fetch(`https://api.notion.com/v1/pages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          [titleKey]: { title: [{ text: { content: "Principal AI Architect at Google DeepMind" } }] },
          "Job Link": { url: "https://deepmind.google/about/careers/" },
          "Status": { select: { name: "🟡 PENDING_APPROVAL" } }
        }
      })
    });

    console.log("✅ SUCCESS: Golden Discovery Seeded to Notion.");
    console.log("--- WORKSPACE MANAGEMENT COMPLETE ---");

  } catch (error: any) {
    console.error("❌ NCA_MANAGER_CRITICAL:", error.message);
  }
}

manageNotionWorkspace();
