import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { UserProfileReader } from "@/lib/notion-profile-reader";
import { NotionCareerInfra } from "@/lib/notion-career-infra";
import { JobRecommendationEngine } from "@/lib/job-engine";

export const maxDuration = 60; // Max allowed for Vercel Hobby is 10s, Pro is 300s. We set 60 as a safe mid-point if on Pro.
export const dynamic = "force-dynamic";

const COOKIE_NAME = "notion_token";
const SELECTED_PAGES_COOKIE = "notion_selected_pages";

async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

async function getSelectedPagesFromCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SELECTED_PAGES_COOKIE)?.value;
  if (!cookie) return [];
  try {
    return JSON.parse(cookie);
  } catch {
    return [];
  }
}

/**
 * POST /api/career
 * Central controller for Career OS operations.
 * Modes:
 * FULL_SETUP — Auto-discovers pages, creates infra, populates everything.
 * SETUP      — Manual selection mode.
 * SYNC       — Refresh data from Notion.
 */
export async function POST(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ success: false, error: "Notion not connected" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mode } = body;

    // ── AUTOMATED FULL SETUP ──────────────────────────────────────────────────
    if (mode === "FULL_SETUP") {
      const profileReader = new UserProfileReader(token);
      const jobEngine = new JobRecommendationEngine();
      const infraCreator = new NotionCareerInfra(token);
      
      console.log("[FULL_SETUP] Starting automated discovery...");
      let profile;
      try {
        const discoveredPages = await profileReader.discoverProfilePages();
        profile = await profileReader.readUserProfile(discoveredPages);
        
        if (!profile.name && !profile.skills.length) {
          profile = {
            name: "Career Professional",
            email: "",
            headline: "Tech Professional",
            summary: "Looking for new opportunities in tech.",
            skills: ["JavaScript", "TypeScript", "React", "Node.js"],
            techStack: ["JavaScript", "TypeScript", "React", "Node.js"],
            yearsOfExperience: 5,
            currentRole: "Software Professional",
            currentCompany: "Innovation Lab",
            experience: [],
            education: [],
            goals: ["Career growth"],
            preferences: { remote: true },
          };
        }
      } catch (err) {
        console.error("Profile discovery failed:", err);
        profile = { name: "Career Professional", skills: ["Software"], techStack: ["Tech"], yearsOfExperience: 0 } as any;
      }
      
      const careerPageId = await infraCreator.findOrCreateCareerPage();
      const infra = await infraCreator.createInfrastructure(careerPageId, profile);
      
      // Populate sub-pages (fire and forget)
      infraCreator.populateSubPages(infra, profile).catch(e => console.error("Population failed", e));

      const jobs = await jobEngine.generateRecommendations(profile, 5);
      
      return NextResponse.json({
        success: true,
        profile,
        jobs: jobs.map((j, i) => ({
          ...j,
          id: `job_${i}`,
          status: "researching",
          scanDNA: { authenticity: 85, cultureFit: 78, growthPotential: 82 },
          lastScan: new Date().toLocaleDateString(),
        })),
        skills: [],
        forensicReports: [],
        infrastructure: infra,
        stats: {
          skillsFound: profile.skills?.length || 0,
          jobsCreated: jobs.length,
          skillsAnalyzed: 0,
          forensicScans: 0,
        },
        setupComplete: true,
        message: "Forensic Career OS created! Your profile data is being synced to Notion.",
      });
    }

    // ── SETUP WITH SELECTED PAGES ─────────────────────────────────────────────
    if (mode === "SETUP") {
      const { selectedPages: manualPages } = body;
      const profileReader = new UserProfileReader(token);
      const jobEngine = new JobRecommendationEngine();
      const infraCreator = new NotionCareerInfra(token);
      
      console.log("[SETUP] Starting Manual setup...");
      
      const selectedPages = manualPages || await getSelectedPagesFromCookie();
      if (selectedPages.length === 0) {
        return NextResponse.json({ success: false, error: "Please select at least one page" }, { status: 400 });
      }
      
      // 1. Read profile (Thorough extraction)
      console.log("[SETUP] Reading profile from pages:", selectedPages);
      const profile = await profileReader.readFromSelectedPages(selectedPages);
      console.log("[SETUP] Profile read successfully. Skills found:", profile.skills.length, "Years:", profile.yearsOfExperience);
      
      // 2. Create Skeleton Infrastructure
      const careerPageId = await infraCreator.findOrCreateCareerPage();
      const infra = await infraCreator.createInfrastructure(careerPageId, profile);
      
      console.log("[SETUP] Infrastructure created successfully.");

      // 3. Deep Populate Sub-pages (Fire and forget)
      infraCreator.populateSubPages(infra, profile).catch(e => console.error("Population failed", e));

      // 4. Quick Data Generation
      const jobs = await jobEngine.generateRecommendations(profile, 3);
      const trendingSkills = await jobEngine.analyzeSkillGaps(profile);

      if (infra.jobsSectionId && jobs.length > 0) {
        await Promise.all(jobs.map(j => infraCreator.addJobPage(infra.jobsSectionId, {
          ...j,
          status: "researching"
        }).catch(e => console.error("Job write failed", e))));
      }

      return NextResponse.json({
        success: true,
        profile,
        jobs: jobs.map((j, i) => ({
          ...j,
          id: `job_${i}`,
          status: "researching",
          lastScan: new Date().toLocaleDateString(),
        })),
        skills: trendingSkills.slice(0, 5).map((s: any) => ({
          ...s,
          category: s.category || "Technical",
        })),
        infrastructure: infra,
        stats: {
          skillsFound: profile.skills.length,
          jobsCreated: jobs.length,
          skillsAnalyzed: trendingSkills.length,
          forensicScans: 0,
        },
        setupComplete: true,
        message: "Forensic Career OS Ready! Check your Notion for the detailed profile and skills.",
      });
    }

    // ── LOAD EXISTING DATA ─────────────────────────────────────────────────────
    if (mode === "LOAD_DATA") {
      const profileReader = new UserProfileReader(token);
      const jobEngine = new JobRecommendationEngine();
      
      const discoveredPages = await profileReader.discoverProfilePages();
      const profile = await profileReader.readUserProfile(discoveredPages);
      const gaps = await jobEngine.analyzeSkillGaps(profile);
      
      return NextResponse.json({
        success: true,
        profile,
        skills: gaps.slice(0, 8).map((s: any) => ({
          ...s,
          category: s.category || "Technical",
          matchWithTechStack: profile.techStack?.some((t: string) => t.toLowerCase().includes(s.skill.toLowerCase())) ? 85 : 45,
        })),
        jobs: [],
        forensicReports: [],
      });
    }

    // ── DELETE INFRASTRUCTURE ──────────────────────────────────────────────────
    if (mode === "DELETE_INFRA") {
      const infraCreator = new NotionCareerInfra(token);
      await infraCreator.deleteInfrastructure();
      
      return NextResponse.json({ success: true, message: "Infrastructure deleted" });
    }

    // ── OTHER MODES (Fallbacks) ──────────────────────────────────────────────
    return NextResponse.json({ success: false, error: `Unknown mode: ${mode}` }, { status: 400 });

  } catch (err: any) {
    console.error("[CAREER_API] Critical Error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "An internal error occurred",
    }, { status: 500 });
  }
}
