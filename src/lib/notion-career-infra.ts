/**
 * NOTION CAREER INFRASTRUCTURE - Beautiful Page-Based Architecture
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
  gamificationId: string;
  progressId: string;
}

export class NotionCareerInfra {
  private notion: Client;

  constructor(token: string) {
    this.notion = new Client({ auth: token });
  }

  async findOrCreateCareerPage(): Promise<string> {
    const search = await this.notion.search({
      query: "Forensic Career OS",
      filter: { property: "object", value: "page" },
      page_size: 10,
    });

    for (const page of search.results as any[]) {
      const title = page.properties?.title?.title?.[0]?.plain_text || "";
      if (title.toLowerCase().includes("forensic career os") || title.toLowerCase().includes("agent career os")) {
        return page.id;
      }
    }

    const newPage = await this.notion.pages.create({
      parent: { type: "workspace", workspace: true } as any,
      icon: { type: "emoji", emoji: "🔍" },
      properties: {
        title: { title: [{ text: { content: "Forensic Career OS" } }] },
      },
    });

    return newPage.id;
  }

  async infrastructureExists(careerPageId: string): Promise<boolean> {
    try {
      const children = await this.notion.blocks.children.list({
        block_id: careerPageId,
        page_size: 100,
      });

      const sectionNames = ["Profile", "Jobs", "Skills", "Roadmaps", "Research", "Progress", "Gamification"];
      let foundCount = 0;
      
      for (const block of children.results as any[]) {
        if (block.type === "child_page") {
          const title = block.child_page?.title || "";
          if (sectionNames.some(name => title.includes(name))) {
            foundCount++;
          }
        }
      }
      
      return foundCount >= 4;
    } catch {
      return false;
    }
  }

  async createInfrastructure(careerPageId: string, profile: UserProfile): Promise<CareerInfrastructure> {
    const infra: CareerInfrastructure = {
      careerPageId,
      profilePageId: "",
      jobsSectionId: "",
      skillsSectionId: "",
      roadmapsSectionId: "",
      researchSectionId: "",
      gamificationId: "",
      progressId: "",
    };

    await this.addWelcomeContent(careerPageId, profile);
    infra.profilePageId = await this.createProfilePage(careerPageId, profile);
    infra.jobsSectionId = await this.createJobsSection(careerPageId);
    infra.skillsSectionId = await this.createSkillsSection(careerPageId, profile);
    infra.roadmapsSectionId = await this.createRoadmapsSection(careerPageId);
    infra.researchSectionId = await this.createResearchSection(careerPageId);
    infra.gamificationId = await this.createGamificationSection(careerPageId, profile);
    infra.progressId = await this.createProgressSection(careerPageId);

    return infra;
  }

  private async addWelcomeContent(pageId: string, profile: UserProfile): Promise<void> {
    const name = profile.name || "you";
    const role = profile.currentRole || "professional";
    const company = profile.currentCompany || "your company";
    const skills = profile.skills?.length || 0;
    
    try {
      const welcomeBlocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Forensic Career OS initialized for " + name + "!" } }], icon: { type: "emoji", emoji: "🚀" }, color: "blue_background" } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "Your AI-powered career companion is ready." } }] } },
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Your Career Snapshot" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Role: " + role + " at " + company } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Experience: " + (profile.yearsOfExperience || 0) + "+ years" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Skills: " + skills + " identified" } }] } },
        { type: "callout", callout: { rich_text: [{ text: { content: "Use the chat assistant for commands like 'find me jobs' or 'analyze URL'" } }], icon: { type: "emoji", emoji: "💡" }, color: "yellow_background" } },
      ];
      
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: welcomeBlocks,
      });
    } catch (err) {
      console.error("Error adding welcome content:", err);
    }
  }

  private async createProfilePage(careerPageId: string, profile: UserProfile): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "👤" },
        properties: { title: { title: [{ text: { content: profile.name || "My Profile" } }] } },
      });

      const blocks: any[] = [
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Professional Profile" } }] } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: profile.headline || profile.summary || "Career professional" } }] } },
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Current Position" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Role: " + (profile.currentRole || "Not specified") } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Company: " + (profile.currentCompany || "Not specified") } }] } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: (profile.yearsOfExperience || 0) + "+ years of experience" } }] } },
      ];

      if (profile.skills && profile.skills.length > 0) {
        blocks.push({ type: "heading_2", heading_2: { rich_text: [{ text: { content: "Skills" } }] } });
        for (const skill of profile.skills.slice(0, 15)) {
          blocks.push({ type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: skill } }] } });
        }
      }

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating profile page:", err);
      return careerPageId;
    }
  }

  private async createJobsSection(careerPageId: string): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "💼" },
        properties: { title: { title: [{ text: { content: "Job Opportunities" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Track your job applications with AI match scores!" } }], icon: { type: "emoji", emoji: "💡" }, color: "blue_background" } },
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "How to Use" } }] } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "1. Add jobs using chat" } }] } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "2. Update status as you apply" } }] } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "3. Run forensic scan on job URLs" } }] } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating jobs section:", err);
      return careerPageId;
    }
  }

  private async createSkillsSection(careerPageId: string, profile: UserProfile): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "🧬" },
        properties: { title: { title: [{ text: { content: "Skill DNA Analysis" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Your skills with market demand analysis." } }], icon: { type: "emoji", emoji: "🧬" }, color: "purple_background" } },
      ];

      for (const skill of (profile.skills || []).slice(0, 10)) {
        blocks.push({ type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: skill } }] } });
      }

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating skills section:", err);
      return careerPageId;
    }
  }

  private async createRoadmapsSection(careerPageId: string): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "🗺️" },
        properties: { title: { title: [{ text: { content: "Learning Roadmaps" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Personalized learning paths to level up!" } }], icon: { type: "emoji", emoji: "🚀" }, color: "green_background" } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "Complete courses and track your learning journey." } }] } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating roadmaps section:", err);
      return careerPageId;
    }
  }

  private async createResearchSection(careerPageId: string): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "🔬" },
        properties: { title: { title: [{ text: { content: "Forensic Research" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Verify job legitimacy before applying!" } }], icon: { type: "emoji", emoji: "⚠️" }, color: "red_background" } },
        { type: "paragraph", paragraph: { rich_text: [{ text: { content: "Paste any job URL for deep analysis. AI checks company reputation and red flags." } }] } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating research section:", err);
      return careerPageId;
    }
  }

  private async createGamificationSection(careerPageId: string, profile: UserProfile): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "🏆" },
        properties: { title: { title: [{ text: { content: "Gamification" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Level up! Complete actions to earn badges." } }], icon: { type: "emoji", emoji: "🎮" }, color: "yellow_background" } },
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Your Stats" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Level: Career Rookie (Level 1)" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "XP: 0 / 100" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Badges: 0 earned" } }] } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating gamification section:", err);
      return careerPageId;
    }
  }

  private async createProgressSection(careerPageId: string): Promise<string> {
    try {
      const page = await this.notion.pages.create({
        parent: { page_id: careerPageId },
        icon: { type: "emoji", emoji: "📊" },
        properties: { title: { title: [{ text: { content: "Progress Tracker" } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Track your career journey." } }], icon: { type: "emoji", emoji: "📈" }, color: "green_background" } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Jobs Researched: 0" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Jobs Applied: 0" } }] } },
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: "Interviews: 0" } }] } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error creating progress section:", err);
      return careerPageId;
    }
  }

  async addJobPage(jobsSectionId: string, job: { title: string; company: string; matchScore: number; status: string; url?: string }): Promise<string> {
    try {
      const emojiChar = job.matchScore >= 80 ? "✅" : job.matchScore >= 60 ? "⚠️" : "❌";
      const color = job.matchScore >= 80 ? "green_background" : job.matchScore >= 60 ? "yellow_background" : "red_background";
      
      const page = await this.notion.pages.create({
        parent: { page_id: jobsSectionId },
        icon: { type: "emoji", emoji: emojiChar },
        properties: { title: { title: [{ text: { content: job.title + " at " + job.company } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: job.matchScore + "% Match | Status: " + job.status } }], icon: { type: "emoji", emoji: emojiChar }, color } },
        { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Action Checklist" } }] } },
        { type: "to_do", to_do: { rich_text: [{ text: { content: "Research company" } }], checked: false } },
        { type: "to_do", to_do: { rich_text: [{ text: { content: "Update resume" } }], checked: false } },
        { type: "to_do", to_do: { rich_text: [{ text: { content: "Submit application" } }], checked: false } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error adding job page:", err);
      return "";
    }
  }

  async addSkillPage(skillsSectionId: string, skill: { name: string; demand: number }): Promise<string> {
    try {
      const emojiChar = skill.demand >= 0.8 ? "🔥" : skill.demand >= 0.6 ? "⚡" : "📚";
      const color = skill.demand >= 0.8 ? "red_background" : skill.demand >= 0.6 ? "yellow_background" : "gray_background";
      
      const page = await this.notion.pages.create({
        parent: { page_id: skillsSectionId },
        icon: { type: "emoji", emoji: emojiChar },
        properties: { title: { title: [{ text: { content: skill.name } }] } },
      });

      const blocks: any[] = [
        { type: "callout", callout: { rich_text: [{ text: { content: "Demand: " + Math.round(skill.demand * 100) + "%" } }], icon: { type: "emoji", emoji: emojiChar }, color } },
      ];

      await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
      return page.id;
    } catch (err) {
      console.error("Error adding skill page:", err);
      return "";
    }
  }

  async addResearchPage(researchSectionId: string, research: { title: string; company: string; verdict: string; trustScore: number; redFlags: string[] }): Promise<string> {
    const isLegit = research.verdict.includes("LEGITIMATE");
    const emojiChar = isLegit ? "✅" : "⚠️";
    const color = isLegit ? "green_background" : "red_background";
    
    const page = await this.notion.pages.create({
      parent: { page_id: researchSectionId },
      icon: { type: "emoji", emoji: emojiChar },
      properties: { title: { title: [{ text: { content: research.title } }] } },
    });

    const blocks: any[] = [
      { type: "callout", callout: { rich_text: [{ text: { content: research.verdict + " | Trust Score: " + research.trustScore + "%" } }], icon: { type: "emoji", emoji: emojiChar }, color } },
      { type: "heading_2", heading_2: { rich_text: [{ text: { content: "Analysis Summary" } }] } },
      { type: "paragraph", paragraph: { rich_text: [{ text: { content: "Company: " + research.company } }] } },
    ];

    if (research.redFlags.length > 0) {
      blocks.push(
        { type: "divider", divider: {} },
        { type: "callout", callout: { rich_text: [{ text: { content: "Red Flags Detected" } }], icon: { emoji: "warning" }, color: "red_background" } }
      );
      for (const flag of research.redFlags) {
        blocks.push({ type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: flag } }] } });
      }
    } else {
      blocks.push(
        { type: "divider", divider: {} },
        { type: "callout", callout: { rich_text: [{ text: { content: "No major red flags detected. Company appears legitimate." } }], icon: { emoji: "white_check_mark" }, color: "green_background" } }
      );
    }

    await this.notion.blocks.children.append({ block_id: page.id, children: blocks });
    return page.id;
  }

  async getFullInfrastructure(careerPageId: string): Promise<any> {
    const children = await this.notion.blocks.children.list({ block_id: careerPageId, page_size: 100 });
    const sections: any = {};

    for (const block of children.results as any) {
      if (block.type === "child_page") {
        const title = block.child_page?.title || "";
        if (title.includes("Jobs")) sections.jobs = block.id;
        else if (title.includes("Skills") || title.includes("DNA")) sections.skills = block.id;
        else if (title.includes("Roadmap")) sections.roadmaps = block.id;
        else if (title.includes("Research") || title.includes("Forensic")) sections.research = block.id;
        else if (title.includes("Profile")) sections.profile = block.id;
        else if (title.includes("Gamification") || title.includes("Achievement")) sections.gamification = block.id;
        else if (title.includes("Progress")) sections.progress = block.id;
      }
    }

    return sections;
  }

  async deleteInfrastructure(): Promise<void> {
    try {
      const search = await this.notion.search({
        query: "Forensic Career OS",
        filter: { property: "object", value: "page" },
        page_size: 10,
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

  async updateGamificationStats(pageId: string, stats: { xp?: number; badges?: string[]; level?: string }): Promise<void> {
    try {
      const blocks = await this.notion.blocks.children.list({ block_id: pageId, page_size: 50 });
      
      for (const block of blocks.results as any[]) {
        if (block.type === "bulleted_list_item") {
          const text = block.bulleted_list_item?.rich_text?.[0]?.plain_text || "";
          if (text.includes("XP:")) {
            await this.notion.blocks.update({
              block_id: block.id,
              bulleted_list_item: { rich_text: [{ text: { content: "XP: " + (stats.xp || 0) + " / 100" } }] }
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to update gamification:", err);
    }
  }
}
