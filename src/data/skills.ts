export interface Skill {
  name: string;
  domain: string;
  tags: string[];
  price: string;
  license: 'OPEN' | 'COMMERCIAL' | 'PROPRIETARY';
  description: string;
  successRate: number;
  validatorCount: number;
  free: boolean;
}

export const skills: Skill[] = [
  // ── ALL SKILLS FREE ───────────────────────────────────────────────
  { name: "budget-builder", domain: "money", tags: ["budget", "savings", "expenses"], price: "0", license: "OPEN", description: "Build a personalized monthly budget — income, expenses, savings goals, and spending categories", successRate: 94, validatorCount: 14, free: true },
  { name: "resume-builder", domain: "career", tags: ["resume", "cv", "job-search"], price: "0", license: "OPEN", description: "Generate a professional resume from your experience — ATS-optimized formatting and bullet points", successRate: 91, validatorCount: 12, free: true },
  { name: "meal-planner", domain: "health", tags: ["meals", "nutrition", "grocery"], price: "0", license: "OPEN", description: "Weekly meal plan with grocery list — customized for dietary preferences and budget", successRate: 89, validatorCount: 8, free: true },
  { name: "daily-planner", domain: "life", tags: ["productivity", "schedule", "time-management"], price: "0", license: "OPEN", description: "Structure your day — time blocks, priorities, energy management, and realistic scheduling", successRate: 92, validatorCount: 10, free: true },

  { name: "interview-coach", domain: "career", tags: ["interview", "preparation", "salary"], price: "0", license: "OPEN", description: "Full interview prep — common questions, STAR answers, salary negotiation scripts", successRate: 88, validatorCount: 11, free: true },
  { name: "retirement-planner", domain: "money", tags: ["investing", "retirement", "compound-interest"], price: "0", license: "OPEN", description: "Retirement projection — savings rate, compound growth, target date, and contribution plan", successRate: 86, validatorCount: 7, free: true },
  { name: "complaint-letter-writer", domain: "life", tags: ["letter", "dispute", "consumer-rights"], price: "0", license: "OPEN", description: "Professional complaint letters — refunds, disputes, landlord issues, billing errors", successRate: 90, validatorCount: 6, free: true },
  { name: "code-review", domain: "developer", tags: ["review", "quality", "security"], price: "0", license: "OPEN", description: "Full code review pipeline — lint, security scan, style check, and actionable summary", successRate: 93, validatorCount: 15, free: true },
  { name: "trading-system", domain: "trading", tags: ["signals", "regime", "probability"], price: "0", license: "OPEN", description: "5-agent trading pipeline with regime classification and probability scoring", successRate: 82, validatorCount: 11, free: true },
  { name: "content-engine", domain: "content", tags: ["repurposing", "tfidf", "multi-platform"], price: "0", license: "OPEN", description: "TF-IDF content repurposing — 1 piece of content to 25 platform variations", successRate: 87, validatorCount: 7, free: true },
  { name: "expense-optimizer", domain: "money", tags: ["subscriptions", "bills", "savings"], price: "0", license: "OPEN", description: "Audit subscriptions, recurring bills, and spending — find $200+/month in savings", successRate: 91, validatorCount: 9, free: true },
  { name: "workout-planner", domain: "health", tags: ["fitness", "exercise", "routine"], price: "0", license: "OPEN", description: "Personalized workout plan — equipment, time, goals, progressive overload schedule", successRate: 88, validatorCount: 8, free: true },
  { name: "travel-planner", domain: "life", tags: ["travel", "itinerary", "budget-travel"], price: "0", license: "OPEN", description: "Complete trip plan — flights, hotels, itinerary, budget, and packing checklist", successRate: 90, validatorCount: 7, free: true },
  { name: "energy-audit", domain: "home", tags: ["energy", "bills", "sustainability"], price: "0", license: "OPEN", description: "Home energy audit — identify waste, estimate savings, prioritize upgrades by ROI", successRate: 87, validatorCount: 5, free: true },
];

export const domains = [...new Set(skills.map(s => s.domain))];
