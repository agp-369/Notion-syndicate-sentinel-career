/**
 * CAREER INFRASTRUCTURE CREATOR
 * 
 * Creates complete career OS infrastructure in user's Notion workspace via MCP:
 * 
 * 1. Career Dashboard (visual overview)
 * 2. Job Recommendations (profile-based)
 * 3. Skill Gap Analysis
 * 4. Learning Roadmaps
 * 5. Forensic Job Research
 * 6. Email/Pitch Templates (HITL)
 */

import { Client } from "@notionhq/client";
import type { UserProfile } from "./notion-profile-reader";

export interface CareerInfrastructure {
  dashboardPageId?: string;
  jobsDatabaseId?: string;
  skillsDatabaseId?: string;
  roadmapDatabaseId?: string;
  researchDatabaseId?: string;
  templatesDatabaseId?: string;
}

export interface JobRecommendation {
  title: string;
  company: string;
  matchScore: number;
  url?: string;
  reason: string;
  location?: string;
  salary?: string;
}

export interface SkillGap {
  skill: string;
  importance: "high" | "medium" | "low";
  trending: boolean;
  learningTime: string;
}

export interface LearningPhase {
  week: string;
  focus: string;
  resources: string[];
  milestones: string[];
}

export class CareerInfrastructureCreator {
  private notion: Client;

  constructor(token: string) {
    this.notion = new Client({ auth: token });
  }

  /**
   * Create the complete Career OS infrastructure
   */
  async createInfrastructure(
    parentPageId: string,
    profile: UserProfile
  ): Promise<CareerInfrastructure> {
    const infra: CareerInfrastructure = {};

    // 1. Create Career Dashboard (main page)
    infra.dashboardPageId = await this.createDashboard(parentPageId, profile);

    // 2. Create Jobs Database
    infra.jobsDatabaseId = await this.createJobsDatabase(infra.dashboardPageId, profile);

    // 3. Create Skills Database
    infra.skillsDatabaseId = await this.createSkillsDatabase(infra.dashboardPageId, profile);

    // 4. Create Learning Roadmap Database
    infra.roadmapDatabaseId = await this.createRoadmapDatabase(infra.dashboardPageId);

    // 5. Create Forensic Research Database
    infra.researchDatabaseId = await this.createResearchDatabase(infra.dashboardPageId);

    // 6. Create Email Templates Database
    infra.templatesDatabaseId = await this.createTemplatesDatabase(infra.dashboardPageId);

    return infra;
  }

  /**
   * Create the main Career Dashboard page
   */
  private async createDashboard(parentPageId: string, profile: UserProfile): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "🎯" },
      properties: {
        title: {
          title: [{ text: { content: `🎯 Career OS - ${profile.name || "My Career"}` } }],
        },
      },
      children: [
        // Welcome Callout
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{
              type: "text",
              text: { content: `Career OS initialized for ${profile.name || "you"}! This dashboard is your personal career intelligence center powered by AI.` }
            }],
            icon: { emoji: "🚀" },
            color: "blue_background",
          },
        },
        // Profile Summary
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "📋 Your Profile Summary" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{
              type: "text",
              text: { content: profile.headline || profile.summary || "Professional with diverse tech experience" }
            }],
          },
        },
        // Skills Overview
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "🛠️ Your Skills" } }] },
        },
        ...this.createSkillTags(profile.skills),
        // Goals
        ...(profile.goals.length > 0 ? [
          {
            object: "block" as const,
            type: "heading_2" as const,
            heading_2: { rich_text: [{ type: "text" as const, text: { content: "🎯 Career Goals" } }] },
          },
          ...profile.goals.map(goal => ({
            object: "block" as const,
            type: "bulleted_list_item" as const,
            bulleted_list_item: { rich_text: [{ type: "text" as const, text: { content: goal } }] },
          })),
        ] : []),
        // Database Links
        {
          object: "block",
          type: "divider",
          divider: {},
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "📊 Your Career Databases" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{
              type: "text",
              text: { content: "Navigate to each section below to manage your career intelligence:" }
            }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "💼 Job Recommendations - AI-matched jobs based on your profile" } }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "📈 Skill Gap Analysis - Trending skills you should learn" } }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "🗺️ Learning Roadmaps - Personalized learning plans" } }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "🔬 Forensic Research - Deep job analysis with proof" } }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "✉️ Email Templates - HITL generated outreach" } }],
          },
        },
      ],
    });

    return page.id;
  }

  /**
   * Create Jobs Recommendation Database
   */
  private async createJobsDatabase(parentPageId: string, profile: UserProfile): Promise<string> {
    const db = await this.notion.databases.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "💼" },
      title: [{ text: { content: "💼 Job Recommendations" } }],
      properties: {
        "Job Title": { title: {} },
        "Company": { rich_text: {} },
        "Match Score": { number: { format: "percent" } },
        "Status": {
          select: {
            options: [
              { name: "🔍 Researching", color: "blue" },
              { name: "📝 Applying", color: "yellow" },
              { name: "✅ Applied", color: "green" },
              { name: "💬 Interview", color: "purple" },
              { name: "❌ Passed", color: "gray" },
            ],
          },
        },
        "Match Reasons": { rich_text: {} },
        "Location": { rich_text: {} },
        "Salary Range": { rich_text: {} },
        "Job URL": { url: {} },
        "Applied Date": { date: {} },
      },
    });

    // Add intro content
    await this.notion.blocks.children.append({
      block_id: parentPageId,
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{
              type: "text",
              text: { content: `Based on your profile as ${profile.headline || "a tech professional"}, we've identified ${profile.skills.length} skills in your toolkit. Job matches are ranked by relevance to your experience.` }
            }],
          },
        },
        {
          object: "block",
          type: "quote",
          quote: {
            rich_text: [{
              type: "text",
              text: { content: "💡 Tip: Jobs with 80%+ match scores are your best targets. Lower scores indicate skill gaps you might need to address." }
            }],
          },
        },
      ],
    });

    return db.id;
  }

  /**
   * Create Skills Gap Analysis Database
   */
  private async createSkillsDatabase(parentPageId: string, profile: UserProfile): Promise<string> {
    const db = await this.notion.databases.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "📈" },
      title: [{ text: { content: "📈 Skill Gap Analysis" } }],
      properties: {
        "Skill": { title: {} },
        "Category": {
          select: {
            options: [
              { name: "Frontend", color: "blue" },
              { name: "Backend", color: "green" },
              { name: "DevOps", color: "orange" },
              { name: "AI/ML", color: "purple" },
              { name: "Mobile", color: "pink" },
              { name: "Soft Skill", color: "yellow" },
            ],
          },
        },
        "Importance": {
          select: {
            options: [
              { name: "🔴 High", color: "red" },
              { name: "🟡 Medium", color: "yellow" },
              { name: "🟢 Low", color: "green" },
            ],
          },
        },
        "Trending": {
          select: {
            options: [
              { name: "🔥 Yes", color: "red" },
              { name: "📊 Stable", color: "blue" },
              { name: "📉 Declining", color: "gray" },
            ],
          },
        },
        "Demand Score": { number: { format: "percent" } },
        "Learning Time": { rich_text: {} },
        "Your Level": {
          select: {
            options: [
              { name: " Expert", color: "green" },
              { name: " Proficient", color: "blue" },
              { name: " Learning", color: "yellow" },
              { name: " None", color: "gray" },
            ],
          },
        },
        "Priority": { number: { format: "number" } },
      },
    });

    return db.id;
  }

  /**
   * Create Learning Roadmap Database
   */
  private async createRoadmapDatabase(parentPageId: string): Promise<string> {
    const db = await this.notion.databases.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "🗺️" },
      title: [{ text: { content: "🗺️ Learning Roadmaps" } }],
      properties: {
        "Skill": { title: {} },
        "Phase": {
          select: {
            options: [
              { name: "📚 Foundation", color: "blue" },
              { name: "🚀 Growth", color: "yellow" },
              { name: "💪 Mastery", color: "green" },
            ],
          },
        },
        "Target Date": { date: {} },
        "Progress": { number: { format: "percent" } },
        "Status": {
          select: {
            options: [
              { name: "⏳ Not Started", color: "gray" },
              { name: "📖 In Progress", color: "blue" },
              { name: "✅ Completed", color: "green" },
            ],
          },
        },
        "Resources": { rich_text: {} },
        "Weekly Goal": { rich_text: {} },
      },
    });

    return db.id;
  }

  /**
   * Create Forensic Job Research Database
   */
  private async createResearchDatabase(parentPageId: string): Promise<string> {
    const db = await this.notion.databases.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "🔬" },
      title: [{ text: { content: "🔬 Forensic Job Research" } }],
      properties: {
        "Job Title": { title: {} },
        "Company": { rich_text: {} },
        "Verdict": {
          select: {
            options: [
              { name: "🟢 LEGITIMATE", color: "green" },
              { name: "🟡 REVIEW", color: "yellow" },
              { name: "🔴 SCAM", color: "red" },
            ],
          },
        },
        "Trust Score": { number: { format: "percent" } },
        "Red Flags": { multi_select: {} },
        "Culture Match": { rich_text: {} },
        "Salary Verified": { checkbox: {} },
        "Benefits": { rich_text: {} },
        "Research Date": { date: {} },
        "Job URL": { url: {} },
        "Research Notes": { rich_text: {} },
      },
    });

    // Add forensic methodology
    await this.notion.blocks.children.append({
      block_id: parentPageId,
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "🔍 Research Methodology" } }] },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Company domain cross-reference and reputation check" } }] },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Job posting authenticity analysis" } }] },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Salary and benefits verification" } }] },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Culture and values alignment check" } }] },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Ghost job and scam detection" } }] },
        },
      ],
    });

    return db.id;
  }

  /**
   * Create Email Templates Database
   */
  private async createTemplatesDatabase(parentPageId: string): Promise<string> {
    const db = await this.notion.databases.create({
      parent: { page_id: parentPageId },
      icon: { emoji: "✉️" },
      title: [{ text: { content: "✉️ Email & Pitch Templates (HITL)" } }],
      properties: {
        "Template Name": { title: {} },
        "Type": {
          select: {
            options: [
              { name: "📧 Cold Email", color: "blue" },
              { name: "💼 Pitch", color: "green" },
              { name: "📤 Follow-up", color: "yellow" },
              { name: "🎯 Cover Letter", color: "purple" },
            ],
          },
        },
        "Target": { rich_text: {} },
        "Status": {
          select: {
            options: [
              { name: "📝 Draft", color: "gray" },
              { name: "👀 Review", color: "yellow" },
              { name: "✅ Approved", color: "green" },
              { name: "📤 Sent", color: "blue" },
            ],
          },
        },
        "Created Date": { date: {} },
        "Preview": { rich_text: {} },
      },
    });

    // Add HITL explanation
    await this.notion.blocks.children.append({
      block_id: parentPageId,
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{
              type: "text",
              text: { content: "Human-in-the-Loop (HITL) Active: All generated emails require your approval before use. This ensures quality and prevents AI hallucinations from reaching recruiters." }
            }],
            icon: { emoji: "⚠️" },
            color: "yellow_background",
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "How to Generate Templates" } }] },
        },
        {
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: { rich_text: [{ type: "text", text: { content: "Generate a template from the dashboard" } }] },
        },
        {
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: { rich_text: [{ type: "text", text: { content: "Review the AI-generated content" } }] },
        },
        {
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: { rich_text: [{ type: "text", text: { content: "Edit and personalize as needed" } }] },
        },
        {
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: { rich_text: [{ type: "text", text: { content: "Approve to use or discard" } }] },
        },
      ],
    });

    return db.id;
  }

  /**
   * Add jobs to the Jobs Database
   */
  async addJobRecommendation(
    jobsDbId: string,
    job: JobRecommendation
  ): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { database_id: jobsDbId },
      properties: {
        "Job Title": { title: [{ text: { content: job.title } }] },
        "Company": { rich_text: [{ text: { content: job.company } }] },
        "Match Score": { number: job.matchScore / 100 },
        "Match Reasons": { rich_text: [{ text: { content: job.reason } }] },
        "Status": { select: { name: "🔍 Researching" } },
        ...(job.location && { "Location": { rich_text: [{ text: { content: job.location } }] } }),
        ...(job.salary && { "Salary Range": { rich_text: [{ text: { content: job.salary } }] } }),
        ...(job.url && { "Job URL": { url: job.url } }),
      },
    });

    return page.id;
  }

  /**
   * Add skill gap analysis to the Skills Database
   */
  async addSkillGap(
    skillsDbId: string,
    skill: SkillGap
  ): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { database_id: skillsDbId },
      properties: {
        "Skill": { title: [{ text: { content: skill.skill } }] },
        "Importance": { select: { name: `🔴 ${skill.importance.charAt(0).toUpperCase() + skill.importance.slice(1)}` } },
        "Trending": { select: { name: skill.trending ? "🔥 Yes" : "📊 Stable" } },
        "Demand Score": { number: 0.8 },
        "Learning Time": { rich_text: [{ text: { content: skill.learningTime } }] },
        "Priority": { number: skill.importance === "high" ? 1 : skill.importance === "medium" ? 2 : 3 },
      },
    });

    return page.id;
  }

  /**
   * Add learning roadmap to the Roadmap Database
   */
  async addLearningRoadmap(
    roadmapDbId: string,
    skill: string,
    phases: LearningPhase[]
  ): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { database_id: roadmapDbId },
      properties: {
        "Skill": { title: [{ text: { content: `Learn ${skill}` } }] },
        "Phase": { select: { name: "📚 Foundation" } },
        "Status": { select: { name: "⏳ Not Started" } },
        "Progress": { number: 0 },
      },
      children: phases.map((phase, i) => ({
        object: "block" as const,
        type: "heading_3" as const,
        heading_3: {
          rich_text: [{ type: "text" as const, text: { content: phase.week } }],
        },
        children: [
          {
            object: "block" as const,
            type: "paragraph" as const,
            paragraph: { rich_text: [{ type: "text" as const, text: { content: phase.focus } }] },
          },
          ...phase.milestones.map(m => ({
            object: "block" as const,
            type: "to_do" as const,
            to_do: { rich_text: [{ type: "text" as const, text: { content: m } }], checked: false },
          })),
          {
            object: "block" as const,
            type: "callout" as const,
            callout: {
              rich_text: [{ type: "text" as const, text: { content: `Resources: ${phase.resources.join(", ")}` } }],
              icon: { emoji: "📚" },
              color: "blue_background" as const,
            },
          },
        ],
      })),
    });

    return page.id;
  }

  /**
   * Add forensic research to the Research Database
   */
  async addForensicResearch(
    researchDbId: string,
    research: {
      title: string;
      company: string;
      verdict: "🟢 LEGITIMATE" | "🟡 REVIEW" | "🔴 SCAM";
      trustScore: number;
      redFlags: string[];
      notes: string;
      url?: string;
    }
  ): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { database_id: researchDbId },
      properties: {
        "Job Title": { title: [{ text: { content: research.title } }] },
        "Company": { rich_text: [{ text: { content: research.company } }] },
        "Verdict": { select: { name: research.verdict } },
        "Trust Score": { number: research.trustScore / 100 },
        "Red Flags": { multi_select: research.redFlags.map(f => ({ name: f })) },
        "Research Notes": { rich_text: [{ text: { content: research.notes } }] },
        "Research Date": { date: { start: new Date().toISOString().split("T")[0] } },
        ...(research.url && { "Job URL": { url: research.url } }),
      },
    });

    return page.id;
  }

  /**
   * Add email template to the Templates Database
   */
  async addEmailTemplate(
    templatesDbId: string,
    template: {
      name: string;
      type: "📧 Cold Email" | "💼 Pitch" | "📤 Follow-up" | "🎯 Cover Letter";
      target: string;
      preview: string;
      content: string;
    }
  ): Promise<string> {
    const page = await this.notion.pages.create({
      parent: { database_id: templatesDbId },
      properties: {
        "Template Name": { title: [{ text: { content: template.name } }] },
        "Type": { select: { name: template.type } },
        "Target": { rich_text: [{ text: { content: template.target } }] },
        "Preview": { rich_text: [{ text: { content: template.preview } }] },
        "Status": { select: { name: "📝 Draft" } },
        "Created Date": { date: { start: new Date().toISOString().split("T")[0] } },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "Email Content" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: template.content } }] },
        },
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{
              type: "text",
              text: { content: "Review this template carefully. Edit any inaccurate information before sending." }
            }],
            icon: { emoji: "⚠️" },
            color: "yellow_background",
          },
        },
      ],
    });

    return page.id;
  }

  /**
   * Create skill tags (paragraph with inline styling)
   */
  private createSkillTags(skills: string[]): any[] {
    return [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: skills.map(skill => ({
            type: "text" as const,
            text: { content: skill },
            annotations: {
              background_color: "blue_background" as const,
              color: "blue" as const,
            },
          })),
        },
      },
    ];
  }
}
