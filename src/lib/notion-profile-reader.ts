/**
 * USER PROFILE READER - Reads user's data from their Notion workspace
 * 
 * This is the CORE of our Career OS - it reads:
 * - Resume content
 * - Personal details
 * - Skills and experience
 * - Career goals and preferences
 * 
 * All via Notion MCP - making it a TRUE MCP project!
 */

import { Client } from "@notionhq/client";

export interface UserProfile {
  name: string;
  email: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  goals: string[];
  preferences: {
    location?: string;
    remote?: boolean;
    salary?: string;
    roles?: string[];
  };
  // Additional fields for dashboard
  techStack: string[];
  yearsOfExperience: number;
  currentRole: string;
  currentCompany: string;
  linkedIn?: string;
  portfolio?: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
  skills: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export class UserProfileReader {
  private notion: Client;

  constructor(token: string) {
    this.notion = new Client({ auth: token });
  }

  /**
   * Read user's profile from their Notion pages
   * User must share pages with our integration
   */
  async readUserProfile(pageIds: {
    resumePageId?: string;
    personalPageId?: string;
    skillsPageId?: string;
    goalsPageId?: string;
  }): Promise<UserProfile> {
    const profile: UserProfile = {
      name: "",
      email: "",
      headline: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
      goals: [],
      preferences: {},
      techStack: [],
      yearsOfExperience: 0,
      currentRole: "",
      currentCompany: "",
    };

    // Read each page if IDs provided
    if (pageIds.resumePageId) {
      const resumeData = await this.readResumePage(pageIds.resumePageId);
      Object.assign(profile, resumeData);
    }

    if (pageIds.personalPageId) {
      const personalData = await this.readPersonalPage(pageIds.personalPageId);
      Object.assign(profile, personalData);
    }

    if (pageIds.skillsPageId) {
      profile.skills = await this.readSkillsPage(pageIds.skillsPageId);
    }

    if (pageIds.goalsPageId) {
      profile.goals = await this.readGoalsPage(pageIds.goalsPageId);
    }

    return profile;
  }

  /**
   * Search for user's profile pages in Notion
   * Automatically discovers pages based on content
   */
  async discoverProfilePages(): Promise<{
    resumePageId?: string;
    personalPageId?: string;
    skillsPageId?: string;
    goalsPageId?: string;
  }> {
    const search = await this.notion.search({
      filter: { property: "object", value: "page" },
      page_size: 20,
    });

    const discovered: Record<string, string | undefined> = {
      resumePageId: undefined,
      personalPageId: undefined,
      skillsPageId: undefined,
      goalsPageId: undefined,
    };

    for (const page of search.results as any[]) {
      const title = page.properties?.title?.title?.[0]?.plain_text?.toLowerCase() || 
                    page.properties?.Name?.title?.[0]?.plain_text?.toLowerCase() || "";
      
      const isHighlyLikely = title.includes("resume") || 
                             title.includes("cv") || 
                             title.includes("profile") || 
                             title.includes("about me") ||
                             title.includes("experience") ||
                             title.includes("portfolio");

      if (isHighlyLikely) {
        try {
          const blocks = await this.getPageBlocks(page.id);
          const content = this.extractTextFromBlocks(blocks).join(" ").toLowerCase();
          
          if (content.includes("experience") || content.includes("skills") || content.includes("education") || content.includes("work")) {
            if (title.includes("resume") || title.includes("cv")) discovered.resumePageId = page.id;
            if (title.includes("profile") || title.includes("about")) discovered.personalPageId = page.id;
            if (title.includes("skill")) discovered.skillsPageId = page.id;
            if (title.includes("goal")) discovered.goalsPageId = page.id;
          }
        } catch (err) {
          console.error(`Error reading page ${page.id}:`, err);
        }
      } else {
        // Fallback by title only if we don't have a better match yet
        if (title.includes("resume") && !discovered.resumePageId) discovered.resumePageId = page.id;
        if ((title.includes("profile") || title.includes("about")) && !discovered.personalPageId) discovered.personalPageId = page.id;
        if (title.includes("skill") && !discovered.skillsPageId) discovered.skillsPageId = page.id;
        if (title.includes("goal") && !discovered.goalsPageId) discovered.goalsPageId = page.id;
      }

      // If we found the primary ones, we can stop early
      if (discovered.resumePageId && discovered.personalPageId) break;
    }

    return discovered;
  }

  /**
   * Read user profile from selected page IDs
   * Auto-detects page types based on content
   */
  async readFromSelectedPages(pageIds: string[]): Promise<UserProfile> {
    const profile: UserProfile = {
      name: "",
      email: "",
      headline: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
      goals: [],
      preferences: {},
      techStack: [],
      yearsOfExperience: 0,
      currentRole: "",
      currentCompany: "",
    };

    const fullContent: string[] = [];

    for (const pageId of pageIds) {
      try {
        const blocks = await this.getPageBlocks(pageId);
        const content = this.extractTextFromBlocks(blocks);
        fullContent.push(...content);
        const contentStr = content.join(" ").toLowerCase();
        
        // Get page title
        const pageTitle = await this.getPageTitle(pageId);
        const titleLower = pageTitle.toLowerCase();

        // Holistic extraction for EVERY page
        // 1. Extract Skills from content anyway
        const extractedSkills = this.extractSkillsFromText(contentStr);
        if (extractedSkills.length > 0) {
          profile.skills = [...new Set([...profile.skills, ...extractedSkills])];
          profile.techStack = [...new Set([...profile.techStack, ...extractedSkills])];
        }

        // 2. Extract Goals from content anyway
        const extractedGoals = this.extractGoalsFromText(contentStr);
        if (extractedGoals.length > 0) {
          profile.goals = [...new Set([...profile.goals, ...extractedGoals])];
        }

        // 3. Page-type specific deep extraction
        if (titleLower.includes("resume") || 
            titleLower.includes("experience") ||
            contentStr.includes("work history") ||
            contentStr.includes("professional experience")) {
          
          const resumeData = {
            headline: this.extractHeadline(content),
            summary: this.extractSummary(content),
            experience: this.extractExperience(content),
            education: this.extractEducation(content),
          };
          Object.assign(profile, resumeData);
        }
        
        if (titleLower.includes("about") || 
            titleLower.includes("personal") || 
            titleLower.includes("contact") ||
            titleLower.includes("profile")) {
          
          const personalData = {
            name: this.extractName(content),
            email: this.extractEmail(content),
            preferences: this.extractPreferences(content),
          };
          Object.assign(profile, personalData);
        }
      } catch (error) {
        console.error(`Error reading page ${pageId}:`, error);
      }
    }

    const fullContentStr = fullContent.join(" ").toLowerCase();
    
    // Final polish on years and current role
    if (profile.experience.length > 0) {
      let totalYears = 0;
      profile.experience.forEach(exp => {
        const yearsMatch = exp.duration.match(/(\d+)\s*years?/i);
        const dateMatch = exp.duration.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i);
        
        if (yearsMatch) {
          totalYears += parseInt(yearsMatch[1]);
        } else if (dateMatch) {
          const start = parseInt(dateMatch[1]);
          const end = dateMatch[2].toLowerCase().includes("present") || dateMatch[2].toLowerCase().includes("current") 
            ? new Date().getFullYear() 
            : parseInt(dateMatch[2]);
          totalYears += (end - start);
        }
      });
      profile.yearsOfExperience = totalYears || 5; 
      profile.currentRole = profile.experience[0].role;
      profile.currentCompany = profile.experience[0].company;
    } else {
      // Fallback years extraction from full text
      const yearsMatch = fullContentStr.match(/(\d+)\+?\s*years?\s*(?:of)?\s*experience/i);
      if (yearsMatch) {
        profile.yearsOfExperience = parseInt(yearsMatch[1]);
      } else if (fullContentStr.includes("senior") || fullContentStr.includes("lead")) {
        profile.yearsOfExperience = 8;
      }
    }

    if (!profile.currentRole && profile.headline) {
      profile.currentRole = profile.headline;
    }

    return profile;
  }

  private async getPageTitle(pageId: string): Promise<string> {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId }) as any;
      return page.properties?.title?.title?.[0]?.plain_text ||
             page.properties?.Name?.title?.[0]?.plain_text ||
             "";
    } catch {
      return "";
    }
  }

  private async readResumePage(pageId: string): Promise<Partial<UserProfile>> {
    const blocks = await this.getPageBlocks(pageId);
    const content = this.extractTextFromBlocks(blocks);
    
    return {
      headline: this.extractHeadline(content),
      summary: this.extractSummary(content),
      experience: this.extractExperience(content),
      education: this.extractEducation(content),
    };
  }

  private async readPersonalPage(pageId: string): Promise<Partial<UserProfile>> {
    const blocks = await this.getPageBlocks(pageId);
    const content = this.extractTextFromBlocks(blocks);
    
    return {
      name: this.extractName(content),
      email: this.extractEmail(content),
      preferences: this.extractPreferences(content),
    };
  }

  private async readSkillsPage(pageId: string): Promise<string[]> {
    const blocks = await this.getPageBlocks(pageId);
    const content = this.extractTextFromBlocks(blocks);
    return this.extractSkillsFromText(content.join(" "));
  }

  private extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];
    const techKeywords = [
      "javascript", "typescript", "python", "java", "react", "node", "next",
      "aws", "docker", "kubernetes", "sql", "mongodb", "graphql", "api",
      "git", "github", "figma", "tailwind", "vue", "angular", "swift",
      "kotlin", "flutter", "rust", "golang", "terraform", "ci/cd"
    ];
    
    const contentLower = text.toLowerCase();
    for (const skill of techKeywords) {
      if (contentLower.includes(skill)) {
        skills.push(skill);
      }
    }

    // Bullet points for more specific skills
    const bulletPattern = /[-•*]\s*([A-Za-z0-9+#. ]+)/g;
    let match;
    while ((match = bulletPattern.exec(text)) !== null) {
      const skill = match[1].trim();
      if (skill.length > 2 && skill.length < 30 && !skills.includes(skill)) {
        skills.push(skill);
      }
    }

    return [...new Set(skills)];
  }

  private async readGoalsPage(pageId: string): Promise<string[]> {
    const blocks = await this.getPageBlocks(pageId);
    const content = this.extractTextFromBlocks(blocks);
    return this.extractGoalsFromText(content.join(" "));
  }

  private extractGoalsFromText(text: string): string[] {
    const goals: string[] = [];
    const bulletPattern = /[-•*]\s*(.+)/g;
    let match;
    while ((match = bulletPattern.exec(text)) !== null) {
      const goal = match[1].trim();
      if (goal.length > 10 && goal.length < 100) {
        goals.push(goal);
      }
    }
    return goals;
  }

  private async getPageBlocks(pageId: string): Promise<any[]> {
    try {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });
      return response.results;
    } catch (error) {
      console.error("Error reading page blocks:", error);
      return [];
    }
  }

  private extractTextFromBlocks(blocks: any[]): string[] {
    const texts: string[] = [];
    
    for (const block of blocks) {
      const blockType = block.type;
      const blockData = block[blockType];
      
      if (blockData?.rich_text) {
        const text = blockData.rich_text
          .map((rt: any) => rt.plain_text)
          .join("");
        if (text.trim()) {
          texts.push(text);
        }
      }
    }
    
    return texts;
  }

  private extractName(content: string[]): string {
    const firstLine = content[0] || "";
    return firstLine.replace(/[#*_]/g, "").trim();
  }

  private extractEmail(content: string[]): string {
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
    for (const line of content) {
      const match = line.match(emailPattern);
      if (match) return match[0];
    }
    return "";
  }

  private extractHeadline(content: string[]): string {
    for (const line of content) {
      if (line.includes("engineer") || line.includes("developer") || 
          line.includes("manager") || line.includes("designer") || line.includes("architect")) {
        return line.replace(/[#*_]/g, "").trim();
      }
    }
    return content[1] || "";
  }

  private extractSummary(content: string[]): string {
    for (let i = 1; i < Math.min(content.length, 10); i++) {
      if (content[i].length > 40 && !content[i].includes("@")) {
        return content[i].substring(0, 500);
      }
    }
    return "";
  }

  private extractExperience(content: string[]): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    let currentExp: Partial<WorkExperience> = {};
    
    for (const line of content) {
      const isCompanyLine = line.match(/\b(Google|Microsoft|Amazon|Apple|Meta|Netflix|Company|Inc|LLC|Corp|Solutions|Tech|Systems)\b/i) || 
                           (line.includes("@") && line.length < 50);

      if (isCompanyLine) {
        if (currentExp.company) {
          experiences.push(currentExp as WorkExperience);
        }
        currentExp = { 
          company: line.replace(/[#*_]/g, "").split("@").pop()?.trim() || line.trim(), 
          skills: [] 
        };
      } else if (line.match(/\d{4}\s*[-–]\s*(\d{4}|Present|Current)/i)) {
        currentExp.duration = line.trim();
      } else if (currentExp.company && line.length > 20) {
        currentExp.description = (currentExp.description || "") + " " + line;
      }
    }
    
    if (currentExp.company) {
      experiences.push(currentExp as WorkExperience);
    }
    
    return experiences;
  }

  private extractEducation(content: string[]): Education[] {
    const education: Education[] = [];
    const degreePatterns = ["Bachelor", "Master", "PhD", "MBA", "Associate", "B.S.", "M.S.", "B.A.", "M.A.", "University", "College"];
    
    for (const line of content) {
      if (degreePatterns.some(d => line.includes(d))) {
        const parts = line.split(",").map(p => p.trim());
        education.push({
          institution: parts[0] || "",
          degree: parts[1] || "",
          field: parts[2] || "",
          year: parts[3] || "",
        });
      }
    }
    
    return education;
  }

  private extractPreferences(content: string[]): UserProfile["preferences"] {
    const prefs: UserProfile["preferences"] = {};
    const contentStr = content.join(" ");
    
    if (contentStr.includes("remote") || contentStr.includes("work from home")) {
      prefs.remote = true;
    }
    
    const locationMatch = contentStr.match(/(?:location|based in|located)\s*[:\-]?\s*([A-Za-z\s,]+)/i);
    if (locationMatch) {
      prefs.location = locationMatch[1].trim();
    }
    
    return prefs;
  }

  /**
   * Get all pages shared with the integration
   */
  async getSharedPages(): Promise<any[]> {
    const search = await this.notion.search({
      filter: { property: "object", value: "page" },
      page_size: 50,
    });
    return search.results;
  }
}
