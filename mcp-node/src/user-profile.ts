/**
 * User Profile Manager — profile persistence, recommendations.
 * Port of sdk/user_profile.py
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface UserProfile {
  display_name: string;
  role: string;
  industry: string;
  stage: string;
  team_size: string;
  experience_level: string;
  tech_stack: string[];
  goals: string[];
  preferred_output_style: string;
  preferred_tone: string;
  favorite_domains: string[];
  skills_used: string[];
  chains_used: string[];
  created_at: string;
  updated_at: string;
}

export interface SkillRecommendation {
  skill_name: string;
  reason: string;
  priority: number;
  installed: boolean;
}

export interface ChainRecommendation {
  chain_name: string;
  description: string;
  skills: string[];
  match_reason: string;
}

const ROLE_SKILL_MAP: Record<string, Record<string, string[]>> = {
  founder: {
    essential: ["startup-validator", "business-model-canvas", "financial-forecast", "pitch-practice"],
    recommended: ["competitive-analysis", "market-research", "pricing-strategy", "investor-deck"],
    useful: ["cold-outreach-optimizer", "content-machine", "weekly-ops"],
  },
  developer: {
    essential: ["debug-and-fix", "code-review", "api-design", "test-generator"],
    recommended: ["codebase-mapper", "ci-cd-pipelines", "security-audit", "performance-profiler"],
    useful: ["documentation-generator", "refactoring-guide", "microservice-planner"],
  },
  marketer: {
    essential: ["content-machine", "seo-optimizer", "social-media-planner", "customer-research"],
    recommended: ["brand-voice", "content-calendar", "copywriter", "competitor-teardown"],
    useful: ["cold-outreach-optimizer", "testimonial-collector", "content-repurposer"],
  },
  freelancer: {
    essential: ["proposal-writer", "pricing-strategy", "client-onboarding", "invoice-tracker"],
    recommended: ["cold-outreach-optimizer", "portfolio-builder", "time-audit"],
    useful: ["content-machine", "networking-strategy", "weekly-ops"],
  },
  student: {
    essential: ["learn-anything", "study-planner", "resume-builder", "explain-anything"],
    recommended: ["flashcard-maker", "research-assistant", "writing-coach"],
    useful: ["interview-prep", "career-pivot", "budget-builder"],
  },
};

const GOAL_SKILL_MAP: Record<string, string[]> = {
  "start a business": ["startup-validator", "business-model-canvas", "side-hustle-launch"],
  "get a job": ["resume-builder", "interview-prep", "linkedin-optimizer", "career-pivot"],
  "learn to code": ["learn-anything", "debug-and-fix", "api-design"],
  "save money": ["budget-builder", "financial-checkup", "debt-payoff-planner"],
  "be healthier": ["fitness-planner", "meal-planner", "sleep-optimizer"],
  "grow my business": ["market-research", "content-machine", "cold-outreach-optimizer"],
  "get organized": ["weekly-ops", "checklist-builder", "priority-matrix"],
};

const ROLE_CHAIN_MAP: Record<string, Array<{ name: string; description: string; skills: string[] }>> = {
  founder: [
    { name: "startup-validation", description: "Validate your startup idea end-to-end", skills: ["startup-validator", "market-research", "competitive-analysis"] },
    { name: "side-hustle-launch", description: "Launch a side business from scratch", skills: ["business-model-canvas", "pricing-strategy", "launch-checklist"] },
  ],
  developer: [
    { name: "debug-and-fix", description: "Find and fix bugs systematically", skills: ["bug-root-cause", "debug-and-fix", "test-generator"] },
    { name: "api-build", description: "Design and build a production API", skills: ["api-design", "api-integration-planner", "security-audit"] },
  ],
  student: [
    { name: "learn-anything", description: "Master any topic with structured learning", skills: ["learn-anything", "study-planner", "flashcard-maker"] },
    { name: "career-pivot", description: "Transition into your target career", skills: ["career-pivot", "resume-builder", "interview-prep"] },
  ],
};

const SKILL_DOMAIN_MAP: Record<string, string[]> = {
  "startup-validator": ["business"], "business-model-canvas": ["business"],
  "debug-and-fix": ["engineering"], "code-review": ["engineering"],
  "content-machine": ["marketing"], "seo-optimizer": ["marketing"],
  "budget-builder": ["finance"], "financial-checkup": ["finance"],
  "learn-anything": ["education"], "study-planner": ["education"],
  "am-i-okay": ["life"], "burnout-recovery": ["life"],
  "resume-builder": ["career"], "interview-prep": ["career"],
};

export class ProfileManager {
  private profilePath: string;

  constructor(baseDir?: string) {
    const dir = baseDir ?? join(homedir(), ".skillchain");
    mkdirSync(dir, { recursive: true });
    this.profilePath = join(dir, "profile.json");
  }

  load(): UserProfile {
    if (existsSync(this.profilePath)) {
      try {
        return JSON.parse(readFileSync(this.profilePath, "utf-8"));
      } catch { /* fall through */ }
    }
    return {
      display_name: "", role: "", industry: "", stage: "", team_size: "",
      experience_level: "", tech_stack: [], goals: [],
      preferred_output_style: "structured", preferred_tone: "friendly",
      favorite_domains: [], skills_used: [], chains_used: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  }

  save(profile: UserProfile): void {
    profile.updated_at = new Date().toISOString();
    writeFileSync(this.profilePath, JSON.stringify(profile, null, 2), "utf-8");
  }

  updateUsage(skillName: string): void {
    const profile = this.load();
    if (!profile.skills_used.includes(skillName)) {
      profile.skills_used.push(skillName);
    }
    // Recompute favorite domains
    const domainCounts: Record<string, number> = {};
    for (const sk of profile.skills_used) {
      const domains = SKILL_DOMAIN_MAP[sk] ?? [];
      for (const d of domains) domainCounts[d] = (domainCounts[d] ?? 0) + 1;
    }
    profile.favorite_domains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([d]) => d);
    this.save(profile);
  }

  updateChainUsage(chainName: string): void {
    const profile = this.load();
    if (!profile.chains_used.includes(chainName)) {
      profile.chains_used.push(chainName);
    }
    this.save(profile);
  }

  suggestSkills(installedSkills: string[]): SkillRecommendation[] {
    const profile = this.load();
    const recs: SkillRecommendation[] = [];
    const seen = new Set<string>();

    // Role-based
    const roleSkills = ROLE_SKILL_MAP[profile.role] ?? {};
    for (const [tier, skills] of Object.entries(roleSkills)) {
      const priority = tier === "essential" ? 1 : tier === "recommended" ? 2 : 3;
      for (const sk of skills) {
        if (!seen.has(sk)) {
          seen.add(sk);
          recs.push({
            skill_name: sk,
            reason: `${tier} for ${profile.role}`,
            priority,
            installed: installedSkills.includes(sk),
          });
        }
      }
    }

    // Goal-based
    for (const goal of profile.goals) {
      const skills = GOAL_SKILL_MAP[goal] ?? [];
      for (const sk of skills) {
        if (!seen.has(sk)) {
          seen.add(sk);
          recs.push({
            skill_name: sk,
            reason: `supports goal: ${goal}`,
            priority: 2,
            installed: installedSkills.includes(sk),
          });
        }
      }
    }

    return recs.sort((a, b) => a.priority - b.priority);
  }

  suggestChains(): ChainRecommendation[] {
    const profile = this.load();
    const chains = ROLE_CHAIN_MAP[profile.role] ?? [];
    return chains.map(c => ({
      chain_name: c.name,
      description: c.description,
      skills: c.skills,
      match_reason: `recommended for ${profile.role}`,
    }));
  }
}
