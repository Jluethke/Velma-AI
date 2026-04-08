/**
 * Chain Matcher — matches plain English queries to skill chains.
 * Port of sdk/chain_matcher.py
 */

export interface ChainMatch {
  chain_name: string;
  description: string;
  category: string;
  score: number;
  match_reason: string;
  skills: string[];
  step_count: number;
}

interface ChainDef {
  name: string;
  description?: string;
  category?: string;
  steps?: Array<{ skill_name: string; alias?: string }>;
  [key: string]: unknown;
}

const STOPWORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
  "them", "this", "that", "is", "am", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare",
  "a", "an", "the", "and", "but", "or", "nor", "not", "no", "so", "yet",
  "at", "by", "for", "from", "in", "into", "of", "on", "to", "up", "with",
  "as", "if", "then", "than", "too", "very", "just", "about", "above",
  "after", "before", "between", "through", "during", "without", "again",
  "further", "once", "here", "there", "when", "where", "why", "how", "all",
  "each", "every", "both", "few", "more", "most", "other", "some", "such",
  "only", "own", "same", "what", "which", "who", "whom",
  "want", "help", "get", "make", "like", "know", "think", "going",
  "really", "thing", "something", "anything", "everything",
]);

// Maps user intent keywords to chain categories/names
export const INTENT_MAP: Record<string, string[]> = {
  // Emotions / feelings
  "hate": ["career-pivot", "am-i-okay", "burnout-recovery"],
  "stuck": ["am-i-okay", "career-pivot", "before-you-leap"],
  "scared": ["tech-confidence-builder", "am-i-okay", "before-you-leap"],
  "afraid": ["tech-confidence-builder", "am-i-okay"],
  "anxious": ["am-i-okay", "burnout-recovery"],
  "stressed": ["am-i-okay", "burnout-recovery", "weekly-ops"],
  "overwhelmed": ["am-i-okay", "burnout-recovery", "weekly-ops"],
  "bored": ["career-pivot", "side-hustle-launch", "learn-anything"],
  "lost": ["am-i-okay", "career-pivot", "big-decision"],
  "confused": ["am-i-okay", "learn-anything", "big-decision"],
  "frustrated": ["am-i-okay", "burnout-recovery", "debug-and-fix"],
  "tired": ["burnout-recovery", "am-i-okay"],
  "burned": ["burnout-recovery", "am-i-okay"],
  "burnout": ["burnout-recovery", "am-i-okay"],
  "depressed": ["am-i-okay", "burnout-recovery"],
  "lonely": ["am-i-okay", "networking-blitz"],

  // Career
  "job": ["career-pivot", "interview-ready", "resume"],
  "career": ["career-pivot", "interview-ready"],
  "interview": ["interview-ready", "career-pivot"],
  "resume": ["career-pivot", "interview-ready"],
  "fired": ["career-pivot", "am-i-okay", "interview-ready"],
  "layoff": ["career-pivot", "am-i-okay", "interview-ready"],
  "laid off": ["career-pivot", "am-i-okay"],
  "promotion": ["career-pivot", "networking-blitz"],
  "raise": ["career-pivot", "salary-negotiation"],
  "salary": ["career-pivot", "salary-negotiation"],
  "quit": ["before-you-leap", "career-pivot", "side-hustle-launch"],
  "leave": ["before-you-leap", "career-pivot"],

  // Business
  "business": ["side-hustle-launch", "business-in-a-box", "startup-validation"],
  "startup": ["startup-validation", "side-hustle-launch"],
  "freelance": ["side-hustle-launch", "freelance-setup"],
  "side hustle": ["side-hustle-launch"],
  "money": ["budget-builder", "side-hustle-launch"],
  "budget": ["budget-builder", "financial-checkup"],
  "save": ["budget-builder", "financial-checkup"],
  "invest": ["financial-checkup"],
  "debt": ["budget-builder", "financial-checkup"],
  "broke": ["budget-builder", "side-hustle-launch"],
  "income": ["side-hustle-launch", "budget-builder"],
  "client": ["client-onboarding", "cold-outreach-optimizer"],
  "customers": ["customer-research", "content-to-customers"],
  "marketing": ["content-machine", "content-to-customers"],
  "sales": ["cold-outreach-optimizer", "content-to-customers"],
  "pricing": ["pricing-strategy", "side-hustle-launch"],

  // Learning / tech
  "learn": ["learn-anything", "tech-confidence-builder"],
  "study": ["learn-anything", "study-planner"],
  "technology": ["tech-confidence-builder", "learn-anything"],
  "tech": ["tech-confidence-builder", "learn-anything"],
  "ai": ["tech-confidence-builder", "ai-agent-builder"],
  "code": ["debug-and-fix", "code-quality", "api-build"],
  "coding": ["debug-and-fix", "code-quality", "learn-anything"],
  "programming": ["debug-and-fix", "code-quality"],
  "debug": ["debug-and-fix"],
  "bug": ["debug-and-fix"],
  "api": ["api-build", "api-to-production"],
  "build": ["api-build", "ai-agent-builder", "side-hustle-launch"],

  // Life
  "health": ["am-i-okay", "burnout-recovery"],
  "sleep": ["burnout-recovery", "am-i-okay"],
  "relationship": ["am-i-okay", "big-decision"],
  "family": ["am-i-okay", "big-decision"],
  "move": ["big-decision", "before-you-leap"],
  "decision": ["big-decision", "decision-deep-dive"],
  "decide": ["big-decision", "decision-deep-dive"],
  "plan": ["weekly-ops", "big-decision"],
  "organize": ["weekly-ops", "checklist-builder"],
  "productive": ["weekly-ops", "burnout-recovery"],
  "goal": ["before-you-leap", "weekly-ops"],
  "purpose": ["am-i-okay", "before-you-leap"],
  "meaning": ["am-i-okay", "before-you-leap"],
  "confidence": ["tech-confidence-builder", "am-i-okay", "interview-ready"],
  "imposter": ["am-i-okay", "tech-confidence-builder"],

  // Content
  "write": ["content-machine", "learn-anything"],
  "content": ["content-machine", "content-to-customers"],
  "blog": ["content-machine"],
  "social media": ["content-machine", "content-to-customers"],
  "video": ["content-machine"],

  // Real estate / deals
  "real estate": ["deal-underwriting"],
  "property": ["deal-underwriting"],
  "deal": ["deal-underwriting", "big-decision"],
  "investment": ["deal-underwriting", "financial-checkup"],
  "loan": ["deal-underwriting"],

  // Complaint / legal
  "complaint": ["complaint-escalation"],
  "unfair": ["complaint-escalation"],
  "scam": ["complaint-escalation"],
  "refund": ["complaint-escalation"],
};

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g)?.filter(w => !STOPWORDS.has(w)) ?? [];
}

export class ChainMatcher {
  private chains: ChainDef[];
  private index: Map<string, Set<number>> = new Map();

  constructor(chains: ChainDef[]) {
    this.chains = chains;
    this.buildIndex();
  }

  private buildIndex(): void {
    for (let i = 0; i < this.chains.length; i++) {
      const c = this.chains[i];
      const text = [
        c.name ?? "",
        c.description ?? "",
        c.category ?? "",
        ...(c.steps ?? []).map(s => `${s.skill_name} ${s.alias ?? ""}`),
      ].join(" ");

      for (const token of tokenize(text)) {
        if (!this.index.has(token)) this.index.set(token, new Set());
        this.index.get(token)!.add(i);
      }
    }
  }

  match(query: string, topK: number = 5): ChainMatch[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = new Map<number, number>();
    const reasons = new Map<number, string[]>();

    // 1. Intent mapping — strongest signal
    const lowerQuery = query.toLowerCase();
    for (const [keyword, chainNames] of Object.entries(INTENT_MAP)) {
      if (lowerQuery.includes(keyword)) {
        for (const chainName of chainNames) {
          const idx = this.chains.findIndex(c => c.name === chainName);
          if (idx >= 0) {
            const bonus = chainNames.indexOf(chainName) === 0 ? 50 : 30;
            scores.set(idx, (scores.get(idx) ?? 0) + bonus);
            if (!reasons.has(idx)) reasons.set(idx, []);
            reasons.get(idx)!.push(`intent:"${keyword}"`);
          }
        }
      }
    }

    // 2. Token matching against index
    for (const token of queryTokens) {
      const matches = this.index.get(token);
      if (matches) {
        for (const idx of matches) {
          scores.set(idx, (scores.get(idx) ?? 0) + 10);
          if (!reasons.has(idx)) reasons.set(idx, []);
          reasons.get(idx)!.push(`token:"${token}"`);
        }
      }
    }

    // 3. Category boost
    for (const token of queryTokens) {
      for (let i = 0; i < this.chains.length; i++) {
        const cat = (this.chains[i].category ?? "").toLowerCase();
        if (cat === token || cat.includes(token)) {
          scores.set(i, (scores.get(i) ?? 0) + 15);
        }
      }
    }

    // Sort by score descending
    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK);

    return ranked.map(([idx, score]) => {
      const c = this.chains[idx];
      const skills = (c.steps ?? []).map(s => s.skill_name);
      return {
        chain_name: c.name ?? "",
        description: (c.description as string) ?? "",
        category: (c.category as string) ?? "",
        score,
        match_reason: (reasons.get(idx) ?? []).slice(0, 3).join(", "),
        skills,
        step_count: skills.length,
      };
    });
  }
}
