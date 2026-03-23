import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { mode, dbIds } = await req.json();
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    // 1. SECURE SESSION VERIFICATION (Clerk)
    stage = "SESSION_VERIFICATION";
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userEmail = user.emailAddresses[0].emailAddress;

    // --- MODULE: SOVEREIGN PROFILE SYNC ---
    if (mode === "SYNC_PROFILE") {
      stage = "NOTION_PROFILE_QUERY";
      
      // Query Notion database for this specific user's email
      const directoryRes = await notion.databases.query({
        database_id: dbIds.talent,
        filter: {
          property: "Email", // Assumes your Talent Directory has an "Email" column
          email: { equals: userEmail }
        }
      });

      const profile = directoryRes.results[0];
      if (!profile) return NextResponse.json({ success: true, profile: null, message: "User not found in directory." });

      return NextResponse.json({ success: true, profile });
    }

    // --- MODULE: AGENTIC MATCH (Same as before but now user-aware) ---
    if (mode === "AGENTIC_SYNC") {
      stage = "AGENTIC_REASONING";
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // The AI now knows EXACTLY who is requesting the match
      const decisionPrompt = `USER: ${userEmail}. Match this user with a senior mentor from the directory and create their workspace.`;
      
      // (Implementation logic continues...)
      return NextResponse.json({ success: true, message: "Agentic Loop Started" });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, failed_at: stage }, { status: 500 });
  }
}
