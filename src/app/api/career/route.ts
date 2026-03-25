import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserProfileReader } from "@/lib/notion-profile-reader";
import { CareerInfrastructureCreator } from "@/lib/notion-career-infra";
import { JobRecommendationEngine } from "@/lib/job-engine";

const COOKIE_NAME = "notion_token";

async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/career/setup
 * Creates complete Career OS infrastructure in user's Notion workspace
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { mode } = body;

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Notion not connected" },
      { status: 401 }
    );
  }

  try {
    // ── SETUP: Create full infrastructure ──────────────────────────────────────
    if (mode === "SETUP") {
      const { parentPageId } = body;

      // First, read user profile from their Notion pages
      const profileReader = new UserProfileReader(token);
      
      // Auto-discover profile pages
      const discoveredPages = await profileReader.discoverProfilePages();
      
      // Read the profile
      const profile = await profileReader.readUserProfile(discoveredPages);

      if (!parentPageId) {
        return NextResponse.json({
          success: false,
          error: "parentPageId required for setup",
        }, { status: 400 });
      }

      // Create full infrastructure
      const infraCreator = new CareerInfrastructureCreator(token);
      const infra = await infraCreator.createInfrastructure(parentPageId, profile);

      // Generate job recommendations
      const jobEngine = new JobRecommendationEngine();
      const jobs = await jobEngine.generateRecommendations(profile, 5);
      
      // Add jobs to Notion database
      for (const job of jobs) {
        if (infra.jobsDatabaseId) {
          await infraCreator.addJobRecommendation(infra.jobsDatabaseId, {
            title: job.title,
            company: job.company,
            matchScore: job.matchScore,
            url: job.url,
            reason: job.reason,
            location: job.location,
            salary: job.salary,
          });
        }
      }

      // Analyze skill gaps and create recommendations
      const trendingSkills = await jobEngine.analyzeSkillGaps(profile);
      
      for (const skill of trendingSkills.slice(0, 5)) {
        if (infra.skillsDatabaseId) {
          await infraCreator.addSkillGap(infra.skillsDatabaseId, {
            skill: skill.skill,
            importance: skill.demand > 0.8 ? "high" : skill.demand > 0.5 ? "medium" : "low",
            trending: skill.growth === "hot",
            learningTime: skill.learningTime,
          });
        }
      }

      return NextResponse.json({
        success: true,
        profile,
        infrastructure: infra,
        stats: {
          skillsFound: profile.skills.length,
          jobsCreated: jobs.length,
          skillsAnalyzed: trendingSkills.length,
        },
        message: "Career OS infrastructure created successfully!",
      });
    }

    // ── READ PROFILE ──────────────────────────────────────────────────────────
    if (mode === "READ_PROFILE") {
      const { pageIds } = body;

      const profileReader = new UserProfileReader(token);
      
      if (pageIds) {
        const profile = await profileReader.readUserProfile(pageIds);
        return NextResponse.json({ success: true, profile });
      }

      // Auto-discover and read
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);

      return NextResponse.json({
        success: true,
        profile,
        discoveredPages,
      });
    }

    // ── GENERATE JOB RECOMMENDATIONS ───────────────────────────────────────────
    if (mode === "GENERATE_JOBS") {
      const { count = 10 } = body;

      const profileReader = new UserProfileReader(token);
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);

      const jobEngine = new JobRecommendationEngine();
      const jobs = await jobEngine.generateRecommendations(profile, count);

      return NextResponse.json({
        success: true,
        jobs,
        profileMatch: {
          skillsCount: profile.skills.length,
          experienceYears: profile.experience.length,
        },
      });
    }

    // ── ANALYZE SKILL GAPS ────────────────────────────────────────────────────
    if (mode === "ANALYZE_SKILLS") {
      const profileReader = new UserProfileReader(token);
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);

      const jobEngine = new JobRecommendationEngine();
      const gaps = await jobEngine.analyzeSkillGaps(profile);

      return NextResponse.json({
        success: true,
        gaps,
        userSkills: profile.skills,
      });
    }

    // ── GENERATE LEARNING ROADMAP ─────────────────────────────────────────────
    if (mode === "GENERATE_ROADMAP") {
      const { targetSkill } = body;

      if (!targetSkill) {
        return NextResponse.json({
          success: false,
          error: "targetSkill required",
        }, { status: 400 });
      }

      const profileReader = new UserProfileReader(token);
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);

      const jobEngine = new JobRecommendationEngine();
      const roadmap = await jobEngine.generateLearningRoadmap(profile, targetSkill);

      return NextResponse.json({
        success: true,
        roadmap,
        targetSkill,
      });
    }

    // ── GENERATE EMAIL PITCH (HITL) ───────────────────────────────────────────
    if (mode === "GENERATE_EMAIL") {
      const { targetCompany, targetRole, emailType = "cold" } = body;

      if (!targetCompany || !targetRole) {
        return NextResponse.json({
          success: false,
          error: "targetCompany and targetRole required",
        }, { status: 400 });
      }

      const profileReader = new UserProfileReader(token);
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);

      const jobEngine = new JobRecommendationEngine();
      const email = await jobEngine.generateEmailPitch(
        profile,
        targetCompany,
        targetRole,
        emailType
      );

      return NextResponse.json({
        success: true,
        email,
        status: "DRAFT",
        hitlNote: "Review and approve this email before sending",
      });
    }

    // ── FORENSIC JOB ANALYSIS ──────────────────────────────────────────────────
    if (mode === "FORENSIC_ANALYSIS") {
      const { url } = body;

      if (!url) {
        return NextResponse.json({
          success: false,
          error: "url required for forensic analysis",
        }, { status: 400 });
      }

      const jobEngine = new JobRecommendationEngine();
      const analysis = await jobEngine.forensicAnalysis(url);

      return NextResponse.json({
        success: true,
        analysis,
        url,
      });
    }

    return NextResponse.json({
      success: false,
      error: `Unknown mode: ${mode}`,
    }, { status: 400 });

  } catch (err: any) {
    console.error("[CAREER_API]", err);
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
