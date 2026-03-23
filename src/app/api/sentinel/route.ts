import { NextResponse } from "next/server";
import { McpOrchestrator } from "@/lib/mcp/orchestrator";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  let stage = "INIT";
  try {
    const { mode, payload } = await req.json();
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // The Notion Token is pulled from ENV for the server-side handshake
    // ensuring the user's secret is never exposed to the browser.
    const orchestrator = new McpOrchestrator(process.env.NOTION_TOKEN!);

    // --- MODE: TRUE MCP AGENTIC LOOP ---
    if (mode === "AGENTIC_LOOP") {
      stage = "MCP_HANDSHAKE_EXECUTION";
      
      const result = await orchestrator.executeAgenticLoop(
        payload.prompt, 
        { userId: user.id, email: user.emailAddresses[0].emailAddress }
      );

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: "Handshake Idle" });

  } catch (error: any) {
    console.error(`❌ STAGE_FAILED [${stage}]:`, error.message);
    return NextResponse.json({ error: error.message, stage }, { status: 500 });
  }
}
