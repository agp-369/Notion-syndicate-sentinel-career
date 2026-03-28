import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NotionMCPClient } from "@/lib/notion-mcp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COOKIE_NAME = "notion_token";

async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

/**
 * POST /api/sentinel
 * Forensic Career OS - MCP v2.0 Operations
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode, payload } = body as { mode: string; payload?: any };
  const token = await getTokenFromCookie();

  if (!token) {
    return NextResponse.json({ success: false, error: "Notion not connected." }, { status: 401 });
  }

  const mcp = new NotionMCPClient(token);

  try {
    // ── MCP Handshake / Health Check ─────────────────────────
    if (mode === "SYSTEM_DIAGNOSTICS") {
      return NextResponse.json({
        success: true,
        gemini: !!process.env.GEMINI_API_KEY,
        hasToken: true,
        connected: !!token,
        mcpVersion: "2.0.0",
        mcpEndpoint: "https://mcp.notion.com/mcp",
        apiVersion: "2025-09-03",
      });
    }

    // ── Initialize Infrastructure ─────────────────────────────
    if (mode === "INITIALIZE_INFRASTRUCTURE") {
      let parentPageId: string = payload?.parentPageId;

      if (!parentPageId) {
        const searchRes = await mcp.searchWorkspace("Forensic", (tx) => console.log(`[MCP] ${tx.method}`));
        parentPageId = (searchRes?.results || [])[0]?.id;
      }

      if (!parentPageId) {
        return NextResponse.json({ success: false, error: "No parent page found" }, { status: 400 });
      }

      const setup = await mcp.initializeWorkspace(parentPageId, (tx) => {
        console.log(`[MCP] ${tx.method} - ${tx.duration}ms - ${tx.error || 'ok'}`);
      });

      return NextResponse.json({
        success: true,
        ...setup,
        connected: true,
      });
    }

    // ── Forensic Audit ───────────────────────────────────────
    if (mode === "FORENSIC_AUDIT" && payload?.url) {
      const { JobRecommendationEngine } = await import("@/lib/job-engine");
      const jobEngine = new JobRecommendationEngine();
      const analysis = await jobEngine.forensicAnalysis(payload.url);

      return NextResponse.json({
        success: true,
        analysis,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown mode: ${mode}` }, { status: 400 });

  } catch (err: any) {
    console.error("[SENTINEL_API]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/sentinel
 * Check connection status
 */
export async function GET() {
  const token = await getTokenFromCookie();
  
  if (!token) {
    return NextResponse.json({ connected: false, infraCreated: false });
  }

  try {
    const mcp = new NotionMCPClient(token);
    const searchRes = await mcp.searchWorkspace("Forensic Career OS", () => {});
    const infraCreated = (searchRes?.results || []).length > 0;

    return NextResponse.json({
      connected: true,
      infraCreated,
      mcpVersion: "2.0.0",
      mcpEndpoint: "https://mcp.notion.com/mcp",
    });
  } catch {
    return NextResponse.json({ connected: true, infraCreated: false });
  }
}
