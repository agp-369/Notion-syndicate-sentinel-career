import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { mode, accessToken, payload } = await req.json();

  if (!accessToken) return NextResponse.json({ success: false, error: "Missing Access Token" }, { status: 401 });

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    // 🔍 MODE: DISCOVER (Finds the user's databases dynamically)
    if (mode === "DISCOVER") {
      const searchRes = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          filter: { property: "object", value: "database" },
          page_size: 100
        }),
      });
      const searchData = await searchRes.json();
      
      const directory = searchData.results.find((d: any) => d.title?.[0]?.plain_text?.includes("Directory"));
      const cohorts = searchData.results.find((d: any) => d.title?.[0]?.plain_text?.includes("Cohorts"));

      return NextResponse.json({ 
        success: true, 
        directoryId: directory?.id, 
        cohortsId: cohorts?.id,
        found: !!(directory && cohorts)
      });
    }

    // 📋 MODE: FETCH_DIRECTORY (Gets real rows)
    if (mode === "FETCH_DIRECTORY" && payload.directoryId) {
      const queryRes = await fetch(`https://api.notion.com/v1/databases/${payload.directoryId}/query`, {
        method: "POST",
        headers,
      });
      const queryData = await queryRes.json();
      return NextResponse.json({ success: true, results: queryData.results });
    }

    // 🚀 MODE: EXECUTE_MATCH (Creates a real page in Notion)
    if (mode === "EXECUTE_MATCH" && payload.cohortsId) {
      const createRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: payload.cohortsId },
          properties: {
            "Name": { title: [{ text: { content: `Sovereign Sync: ${payload.userName || "Admin"}` } }] },
            "Status": { select: { name: "Active" } }
          },
          children: [
            { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "90-Day Mentorship Syllabus" } }] } },
            { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: "Autonomous syllabus generated via Syndicate Sentinel MCP." } }] } }
          ]
        }),
      });
      const createData = await createRes.json();
      return NextResponse.json({ success: true, url: createData.url });
    }

    return NextResponse.json({ success: false, error: "Invalid Mode" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
