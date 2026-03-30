import { NotionMCPGateway } from "./notion-mcp-gateway";
import type { MCPTransaction } from "./notion-mcp-gateway";
import { runGroqForensic, extractProfileWithGroq } from "./groq-intelligence";
import type { ForensicReport } from "./groq-intelligence";

export type { MCPTransaction, ForensicReport };

export interface UserProfile {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: any[];
  education: any[];
  goals: string[];
  preferences: { location?: string; remote?: boolean; salary?: string; roles?: string[] };
}

export interface WorkspaceSetup {
  jobsDbId?: string;
  skillsDbId?: string;
  statePageId?: string;
}

/**
 * 🛰️ NotionMCPClient v8.0 - PROTOCOL ABSOLUTE
 * Fully aligned with API 2025-09-03 (Data Source Architecture)
 */
export class NotionMCPClient {
  public gateway: NotionMCPGateway;

  constructor(token: string) {
    this.gateway = new NotionMCPGateway(token);
  }

  /**
   * 🔍 OFFICIAL DISCOVERY: Uses 'notion-search' to find Lumina components.
   */
  async recoverInfrastructure(onLog?: (tx: MCPTransaction) => void): Promise<WorkspaceSetup> {
    const setup: WorkspaceSetup = {};
    try {
      const res = await this.gateway.callTool("notion-search", {
        query: "Lumina",
        filter: { property: "object", value: "database" }
      }, onLog, ["Discovering existing Forensic OS infrastructure..."]);

      const items = (res as any)?.results || [];
      for (const item of items) {
        const title = (item.title?.[0]?.plain_text || item.name || "").toLowerCase();
        if (title.includes("job tracker") || title.includes("career ledger")) setup.jobsDbId = item.id;
        else if (title.includes("skill dna") || title.includes("talent pool")) setup.skillsDbId = item.id;
      }

      const stateRes = await this.gateway.callTool("notion-search", {
        query: ".lumina-state",
        filter: { property: "object", value: "page" }
      });
      if ((stateRes as any)?.results?.[0]) setup.statePageId = (stateRes as any).results[0].id;

    } catch (e) {
      console.error("[PROTOCOL] Recovery failed.");
    }
    return setup;
  }

  /**
   * 🏗️ OFFICIAL PROVISIONING (API 2025-09-03 Standard)
   * Uses 'initial_data_source' nesting for schema definition.
   */
  async initializeWorkspace(parentPageId: string, onLog?: (tx: MCPTransaction) => void): Promise<WorkspaceSetup> {
    const existing = await this.recoverInfrastructure(onLog);
    if (existing.jobsDbId && existing.skillsDbId) return existing;

    try {
      // 1. Create Job Tracker (using Data Source schema)
      if (!existing.jobsDbId) {
        const jobsDb = await this.gateway.callTool("notion-create-database", {
          parent: { type: "page_id", page_id: parentPageId },
          title: [{ text: { content: "🎯 Lumina: Job Tracker" } }],
          initial_data_source: {
            name: "Lumina: Job Tracker",
            properties: {
              "Job Title": { title: {} },
              "Status": { select: { options: [
                { name: "🔍 Researching", color: "yellow" },
                { name: "🟡 REVIEW", color: "orange" },
                { name: "✅ VERIFIED", color: "green" },
                { name: "🚩 SCAM", color: "red" }
              ]}},
              "Company": { rich_text: {} },
              "Job URL": { url: {} },
              "Trust Score": { number: { format: "percent" } }
            }
          }
        }, onLog, ["Provisioning Forensic Job Tracker (2025-09-03 schema)..."]);
        existing.jobsDbId = jobsDb?.id;
      }

      // 2. Create Skill DNA
      if (!existing.skillsDbId) {
        const skillsDb = await this.gateway.callTool("notion-create-database", {
          parent: { type: "page_id", page_id: parentPageId },
          title: [{ text: { content: "🧬 Lumina: Skill DNA" } }],
          initial_data_source: {
            name: "Lumina: Skill DNA",
            properties: {
              "Skill": { title: {} },
              "Category": { select: { options: [{ name: "Technical", color: "blue" }, { name: "Soft", color: "yellow" }] }},
              "Proficiency": { number: { format: "percent" } }
            }
          }
        }, onLog, ["Provisioning Skill DNA (2025-09-03 schema)..."]);
        existing.skillsDbId = skillsDb?.id;
      }

      // 3. Persistent State Page
      const state = await this.gateway.callTool("notion-create-pages", {
        parent: { type: "page_id", page_id: parentPageId },
        properties: { title: [{ text: { content: ".lumina-state" } }] },
        children: [{ object: "block", type: "code", code: { language: "json", rich_text: [{ text: { content: JSON.stringify(existing) } }] } }]
      });
      existing.statePageId = state?.id;

    } catch (e) {
      console.error("[PROVISION] Critical failure in 2025-09-03 handshake.");
    } finally {
      await this.gateway.close();
    }
    return existing;
  }

  /**
   * 🧬 DEEP DNA SYNC: Uses 'notion-fetch' to read Resume/CV pages.
   */
  async discoverAndReadProfile(onLog?: (tx: MCPTransaction) => void): Promise<UserProfile> {
    const profile: UserProfile = { 
      name: "", headline: "", summary: "", skills: [], experience: [], 
      education: [], goals: [], preferences: {}
    };
    try {
      const search = await this.gateway.callTool("notion-search", {
        query: "resume cv profile",
        filter: { property: "object", value: "page" }
      }, onLog, ["Scanning workspace for Resume/CV data..."]);

      let fullContent = "";
      const pages = (search as any)?.results || [];
      for (const page of pages.slice(0, 3)) {
        const content = await this.gateway.callTool("notion-fetch", {
          url: `https://notion.so/${page.id.replace(/-/g, "")}`
        }, onLog, [`Reading: ${page.properties?.title?.title?.[0]?.plain_text || "Page"}`]);
        fullContent += (content as any)?.content || (content as any)?.text || "";
      }

      if (fullContent.trim()) {
        const groqData = await extractProfileWithGroq(fullContent);
        Object.assign(profile, groqData);
      }
    } finally {
      await this.gateway.close();
    }
    return profile;
  }

  /**
   * 🛡️ FORENSIC AUTOMATION: Writes investigative proof to Notion.
   */
  async logForensicAudit(jobsDbId: string, analysis: ForensicReport, url: string, updatePageId?: string, onLog?: (tx: MCPTransaction) => void) {
    try {
      if (updatePageId) {
        return await this.gateway.callTool("notion-update-page", {
          page_id: updatePageId,
          properties: {
            "Status": { select: { name: "🟡 REVIEW" } },
            "Trust Score": { number: analysis.score / 100 }
          }
        }, onLog, ["Updating job entry with forensic proof..."]);
      }

      return await this.gateway.callTool("notion-create-pages", {
        parent: { database_id: jobsDbId },
        properties: {
          "Job Title": { title: [{ text: { content: `${analysis.jobDetails.company}: ${analysis.jobDetails.title}` } }] },
          "Status": { select: { name: "🟡 REVIEW" } },
          "Trust Score": { number: analysis.score / 100 },
          "Company": { rich_text: [{ text: { content: analysis.jobDetails.company } }] },
          "Job URL": { url: url }
        },
        children: [
          { object: "block", type: "callout", callout: { rich_text: [{ text: `🚨 VERDICT: ${analysis.verdict} (${analysis.score}%)` }], icon: { emoji: "🛡️" } } }
        ]
      }, onLog, ["Committing forensic evidence to Career Ledger..."]);
    } finally {
      await this.gateway.close();
    }
  }

  async queryDataSource(dbId: string, onLog?: (tx: MCPTransaction) => void) {
    return this.gateway.callTool("notion-query-database", { database_id: dbId }, onLog);
  }

  getTransactions(): MCPTransaction[] { return this.gateway.getTransactions(); }
}
