import { GoogleGenerativeAI } from "@google/generative-ai";
import { NotionCareerInfra } from "./notion-career-infra";
import { JobRecommendationEngine } from "./job-engine";

export class SentinelWatchdog {
  private notionToken: string;
  private genAI: GoogleGenerativeAI;

  constructor(notionToken: string) {
    this.notionToken = notionToken;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  private async notionFetch(endpoint: string, method: string = "GET", body?: any) {
    const res = await fetch(`https://api.notion.com/v1/${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`NOTION_ERROR: ${err.message}`);
    }
    return res.json();
  }

  /**
   * Automatically scan the Jobs database for new URLs and run forensics
   */
  async runFullScan(careerPageId: string, profile: any) {
    const infra = new NotionCareerInfra(this.notionToken);
    const engine = new JobRecommendationEngine();
    
    // 1. Find the Jobs section
    const sections = await infra.getFullInfrastructure(careerPageId);
    if (!sections.jobs) throw new Error("Jobs section not found");

    // 2. Query the Jobs section for child pages (which act as a DB in this setup)
    const children = await this.notionFetch(`blocks/${sections.jobs}/children?page_size=50`);
    const jobPages = children.results.filter((c: any) => c.type === "child_page");

    console.log(`[WATCHDOG] Found ${jobPages.length} potential jobs to scan.`);

    const results = [];
    let count = 0;
    for (const page of jobPages) {
      if (count >= 3) break; // Limit to 3 jobs per run to stay under 10s timeout

      // Check if already has a report by checking its children
      const blocks = await this.notionFetch(`blocks/${page.id}/children?page_size=10`);
      const hasReport = blocks.results.some((b: any) => b.type === "callout" || b.type === "heading_3");
      
      if (!hasReport) {
        console.log(`[WATCHDOG] Scanning job: ${page.child_page.title}`);
        try {
          const url = page.child_page.title.includes("http") ? page.child_page.title : "https://linkedin.com/jobs";
          const analysis = await engine.forensicAnalysis(url);
          
          await infra.addResearchPage(page.id, {
            title: "Automated Forensic Report",
            company: "Analyzed by Watchdog",
            verdict: analysis.verdict,
            trustScore: analysis.trustScore,
            redFlags: analysis.redFlags
          });
          
          results.push({ id: page.id, status: "analyzed" });
          count++;
        } catch (e) {
          console.error(`[WATCHDOG] Failed to analyze ${page.id}:`, e);
        }
      }
    }

    return results;
  }

  async checkForApprovals(databaseId: string) {
    try {
      const data = await this.notionFetch(`databases/${databaseId}/query`, "POST", {
        filter: { property: "Approved", checkbox: { equals: true } },
        page_size: 1
      });
      return data.results || [];
    } catch (e) { return []; }
  }

  async finalizeLead(pageId: string) {
    try {
      // Mark as Finalized
      await this.notionFetch(`pages/${pageId}`, "PATCH", {
        properties: {
          "Status": { select: { name: "🚀 FINALIZED" } },
          "Approved": { checkbox: false }
        }
      });
      return true;
    } catch (e) { return false; }
  }
}
