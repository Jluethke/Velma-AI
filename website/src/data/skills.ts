export interface Skill {
  name: string;
  domain: string;
  tags: string[];
  price: string;
  license: 'OPEN' | 'COMMERCIAL' | 'PROPRIETARY';
  description: string;
  successRate: number;
  validatorCount: number;
}

export const skills: Skill[] = [
  // --- Paid skills (COMMERCIAL) ---
  { name: "trading-system", domain: "trading", tags: ["signals", "regime", "probability"], price: "75", license: "COMMERCIAL", description: "5-agent trading pipeline with regime classification", successRate: 82, validatorCount: 11 },
  { name: "content-engine", domain: "content", tags: ["repurposing", "tfidf", "multi-platform"], price: "15", license: "COMMERCIAL", description: "TF-IDF content repurposing -- 1 piece to 25 variations", successRate: 87, validatorCount: 7 },
  { name: "social-automation", domain: "automation", tags: ["playwright", "browser", "twitter"], price: "10", license: "COMMERCIAL", description: "Playwright browser automation for social media management", successRate: 84, validatorCount: 5 },
  // --- Free seed content (OPEN) ---
  { name: "velma-voice", domain: "content", tags: ["personality", "voice", "social-media"], price: "0", license: "OPEN", description: "AI personality framework -- JARVIS raised on memes", successRate: 92, validatorCount: 8 },
  { name: "repo-health", domain: "devops", tags: ["git", "health-check", "maintenance"], price: "0", license: "OPEN", description: "Git repository health scoring and maintenance analysis", successRate: 94, validatorCount: 10 },
  { name: "mission-control-design", domain: "design", tags: ["cyberpunk", "dashboard", "react"], price: "0", license: "OPEN", description: "Cyberpunk dashboard design system -- 150+ components", successRate: 93, validatorCount: 6 },
  { name: "multi-agent-swarm", domain: "architecture", tags: ["swarm", "agents", "coordination"], price: "0", license: "OPEN", description: "Goal-driven swarm coordination with trust inheritance", successRate: 89, validatorCount: 8 },
  { name: "tick-engine", domain: "architecture", tags: ["event-loop", "governance", "periodic"], price: "0", license: "OPEN", description: "Discrete-time event loop with governance checkpoints", successRate: 90, validatorCount: 5 },
  { name: "event-bus", domain: "architecture", tags: ["pub-sub", "correlation", "typed-events"], price: "0", license: "OPEN", description: "Typed pub-sub with temporal event correlation", successRate: 88, validatorCount: 4 },
  { name: "task-decomposition", domain: "architecture", tags: ["orpa", "planning", "priority"], price: "0", license: "OPEN", description: "ORPA task decomposition with priority queuing", successRate: 91, validatorCount: 5 },
];

export const domains = [...new Set(skills.map(s => s.domain))];
