/**
 * NOTION CAREER INFRASTRUCTURE - Page-Based Architecture
 * Notion uses PAGES for everything.
 */

import { Client } from "@notionhq/client";
import type { UserProfile } from "./notion-profile-reader";

export interface CareerInfrastructure {
  careerPageId: string;
  profilePageId: string;
  jobsSectionId: string;
  skillsSectionId: string;
  roadmapsSectionId: string;
  researchSectionId: string;
}

export class NotionCareerInfra {
  private notion: Client;

  constructor(token: string) {
    this.notion = new Client({ auth: token });
  }

  async findCareerPage(): Promise<string | null> {
    try {
      const search = await this.notion.search({
        query: "Forensic Career OS",
        filter: { property: "object", value: "page" },
        page_size: 5,
      });

      for (const page of search.results as any[]) {
        const title = page.properties?.title?.title?.[0]?.plain_text || 
                      page.properties?.Name?.title?.[0]?.plain_text || "";
        if (title.toLowerCase().includes("forensic career os") || title.toLowerCase().includes("agent career os")) {
          return page.id;
        }
      }
      return null;
    } catch (err) {
      console.error("Error finding career page:", err);
      return null;
    }
  }

  async findOrCreateCareerPage(): Promise<string> {
    const existingId = await this.findCareerPage();
    if (existingId) return existingId;

    // Try to create at workspace root
    try {
      console.log("Creating Career OS at workspace root...");
      const newPage = await this.notion.pages.create({
        parent: { type: "workspace", workspace: true } as any,
        icon: { emoji: "🔍" },
        properties: {
          title: { title: [{ text: { content: "🔍 Forensic Career OS" } }] },
        },
      });
      return newPage.id;
    } catch (err) {
      console.log("Workspace root denied, falling back to shared pages...");
      const sharedPages = await this.notion.search({
        filter: { property: "object", value: "page" },
        page_size: 1,
      });

      if (sharedPages.results.length > 0) {
        const parentId = sharedPages.results[0].id;
        const newPage = await this.notion.pages.create({
          parent: { page_id: parentId },
          icon: { emoji: "🔍" },
          properties: {
            title: { title: [{ text: { content: "🔍 Forensic Career OS" } }] },
          },
        });
        return newPage.id;
      }
      throw new Error("Could not create Career OS. Please share at least one page with the integration.");
    }
  }

  async infrastructureExists(careerPageId: string): Promise<boolean> {
    try {
      const children = await this.notion.blocks.children.list({
        block_id: careerPageId,
        page_size: 50,
      });

      let hasJobs = false;
      let hasSkills = false;

      for (const block of children.results as any[]) {
        if (block.type === "child_page") {
          const title = block.child_page?.title || "";
          if (title.includes("Jobs")) hasJobs = true;
          if (title.includes("Skills")) hasSkills = true;
        }
      }
      return hasJobs && hasSkills;
    } catch {
      return false;
    }
  }

  async createInfrastructure(careerPageId: string, profile: UserProfile): Promise<CareerInfrastructure> {
    // 1. Get existing sections to avoid duplicates
    const existing = await this.getFullInfrastructure(careerPageId);
    
    const infra: CareerInfrastructure = {
      careerPageId,
      profilePageId: existing.profile || "",
      jobsSectionId: existing.jobs || "",
      skillsSectionId: existing.skills || "",
      roadmapsSectionId: existing.roadmaps || "",
      researchSectionId: existing.research || "",
    };

    // 2. Add welcome only if new
    if (Object.keys(existing).length === 0) {
      await this.addWelcomeContent(careerPageId, profile);
    }

    // 3. Create missing pages
    // Note: Creating these sequentially to be extremely safe, though slower.
    if (!infra.profilePageId) {
      const p = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { emoji: "👤" },
        properties: { title: { title: [{ text: { content: "Profile" } }] } },
      });
      infra.profilePageId = p.id;
    }

    if (!infra.jobsSectionId) {
      const p = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { emoji: "💼" },
        properties: { title: { title: [{ text: { content: "Jobs" } }] } },
      });
      infra.jobsSectionId = p.id;
    }

    if (!infra.skillsSectionId) {
      const p = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { emoji: "🛠️" },
        properties: { title: { title: [{ text: { content: "Skills" } }] } },
      });
      infra.skillsSectionId = p.id;
    }

    if (!infra.roadmapsSectionId) {
      const p = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { emoji: "🗺️" },
        properties: { title: { title: [{ text: { content: "Learning Roadmaps" } }] } },
      });
      infra.roadmapsSectionId = p.id;
    }

    if (!infra.researchSectionId) {
      const p = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { emoji: "🔬" },
        properties: { title: { title: [{ text: { content: "Forensic Research" } }] } },
      });
      infra.researchSectionId = p.id;
    }

    return infra;
  }

  /**
   * Deep populate sub-pages with data. 
   * This is called after createInfrastructure to keep response times low.
   */
  async populateSubPages(infra: CareerInfrastructure, profile: UserProfile): Promise<void> {
    try {
      const populationTasks = [];

      // Populate Profile
      if (infra.profilePageId) {
        populationTasks.push(this.notion.blocks.children.append({
          block_id: infra.profilePageId,
          children: [
            { type: "heading_1", heading_1: { rich_text: [{ text: { content: profile.name || "My Professional Profile" } }] } },
            { type: "paragraph", paragraph: { rich_text: [{ text: { content: profile.headline || "" } }] } },
            { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Summary" } }] } },
            { type: "paragraph", paragraph: { rich_text: [{ text: { content: profile.summary || "No summary provided." } }] } },
            { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Experience" } }] } },
            ...profile.experience.map(exp => ({
              type: "bulleted_list_item" as const,
              bulleted_list_item: { rich_text: [{ text: { content: `${exp.role} at ${exp.company} (${exp.duration})` }, annotations: { bold: true } }] }
            })),
          ] as any[]
        }));
      }

      // Populate Skills
      if (infra.skillsSectionId && profile.skills.length > 0) {
        populationTasks.push(this.notion.blocks.children.append({
          block_id: infra.skillsSectionId,
          children: [
            { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Current Skill DNA" } }] } },
            ...profile.skills.map(skill => ({
              type: "bulleted_list_item" as const,
              bulleted_list_item: { rich_text: [{ text: { content: skill } }] }
            }))
          ] as any[]
        }));
      }

      await Promise.all(populationTasks);
    } catch (err) {
      console.error("Failed to populate sub-pages:", err);
    }
  }

  private async addWelcomeContent(pageId: string, profile: UserProfile): Promise<void> {
    const welcomeBlocks: any[] = [
      { type: "callout", callout: { rich_text: [{ text: { content: `Forensic Career OS for ${profile.name || "you"}!` } }], icon: { emoji: "🤖" }, color: "blue_background" } },
    ];
    
    await this.notion.blocks.children.append({
      block_id: pageId,
      children: welcomeBlocks,
    });
  }

  async addJobPage(jobsSectionId: string, job: { title: string; company: string; matchScore: number; status: string; url?: string }): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { page_id: jobsSectionId },
      icon: { emoji: job.matchScore >= 80 ? "✅" : job.matchScore >= 60 ? "⚠️" : "❌" },
      properties: { title: { title: [{ text: { content: `${job.title} @ ${job.company}` } }] } },
    });

    if (job.url) {
      await this.notion.blocks.children.append({
        block_id: page.id,
        children: [{ type: "paragraph", paragraph: { rich_text: [{ text: { content: "Job URL: " } }, { text: { content: job.url }, href: { url: job.url } }] } }] as any[]
      });
    }

    return page.id;
  }

  async addSkillPage(skillsSectionId: string, skill: { name: string; demand: number }): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { page_id: skillsSectionId },
      icon: { emoji: skill.demand >= 0.8 ? "🔥" : "⚡" },
      properties: { title: { title: [{ text: { content: skill.name } }] } },
    });

    return page.id;
  }

  async addResearchPage(researchSectionId: string, research: { title: string; company: string; verdict: string; trustScore: number; redFlags: string[] }): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { page_id: researchSectionId },
      icon: { emoji: research.verdict.includes("LEGITIMATE") ? "✅" : "⚠️" },
      properties: { title: { title: [{ text: { content: `🔬 ${research.title}` } }] } },
    });

    const blocks: any[] = [
      { type: "callout", callout: { rich_text: [{ text: { content: `${research.verdict} | Trust: ${research.trustScore}%` } }], icon: { emoji: research.verdict.includes("LEGITIMATE") ? "✅" : "⚠️" }, color: research.verdict.includes("LEGITIMATE") ? "green_background" as const : "red_background" as const } },
    ];

    if (research.redFlags.length > 0) {
      blocks.push({ type: "heading_3", heading_3: { rich_text: [{ text: { content: "Red Flags" } }] } });
      for (const flag of research.redFlags) {
        blocks.push({ type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: flag } }] } });
      }
    }

    await this.notion.blocks.children.append({ block_id: page.id, children: blocks });

    return page.id;
  }

  async getFullInfrastructure(careerPageId: string): Promise<any> {
    const children = await this.notion.blocks.children.list({ block_id: careerPageId, page_size: 50 });
    const sections: any = {};

    for (const block of children.results as any) {
      if (block.type === "child_page") {
        const title = block.child_page?.title || "";
        if (title.includes("Jobs")) sections.jobs = block.id;
        else if (title.includes("Skills")) sections.skills = block.id;
        else if (title.includes("Roadmap")) sections.roadmaps = block.id;
        else if (title.includes("Research")) sections.research = block.id;
        else if (title.includes("Profile")) sections.profile = block.id;
      }
    }

    return sections;
  }

  async deleteInfrastructure(): Promise<void> {
    try {
      const search = await this.notion.search({
        query: "Forensic Career OS",
        filter: { property: "object", value: "page" },
        page_size: 5,
      });

      for (const page of search.results as any[]) {
        const title = page.properties?.title?.title?.[0]?.plain_text || "";
        if (title.includes("Forensic Career OS") || title.includes("Agent Career OS")) {
          await this.notion.pages.update({ page_id: page.id, archived: true });
        }
      }
    } catch (err) {
      console.error("Failed to delete infrastructure:", err);
    }
  }
}
