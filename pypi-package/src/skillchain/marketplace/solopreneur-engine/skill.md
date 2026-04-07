# Solopreneur Engine

> Tell me your idea. Get a running business back.

## What It Does

The Solopreneur Engine is a complete business launch pipeline. A solo founder provides their idea, target audience, skills, and budget -- and the engine produces everything needed to launch and run the business.

## Pipeline Stages

### 1. VALIDATE (Idea Scoring)
Scores the idea on 5 dimensions using the Mom Test framework:
- **Problem clarity** (0-10): Is the problem specific and painful?
- **Audience definition** (0-10): Who exactly has this problem?
- **Willingness to pay** (0-10): Would they pay to solve it?
- **Competition level** (0-10): Crowded or open market?
- **Founder fit** (0-10): Does the founder have relevant skills?

Produces a go/no-go recommendation: STRONG GO, GO WITH CAVEATS, PIVOT, or NO GO.

### 2. SCAN (Market Analysis)
- TAM/SAM/SOM estimation (bottom-up)
- Competitor mapping with strengths/weaknesses
- Market gaps and underserved niches
- 3 positioning angles (Specialist, Simplifier, Premium)
- Pricing benchmarks by business type
- Distribution channel identification

### 3. STRATEGIZE (Tournament Selection)
Generates 3 strategy candidates and scores each:
- **LEAN**: Smallest MVP, manual processes first, fastest to revenue
- **PREMIUM**: Quality-first, higher prices, fewer customers
- **GROWTH**: Aggressive acquisition, optimize for speed and scale

Scoring dimensions (weighted):
- Time to first revenue (30%)
- Capital required (20%)
- Risk level (20%)
- Scalability potential (15%)
- Founder fit (15%)

### 4. PLAN (Business Plan)
Using the winning strategy:
- One-liner elevator pitch (max 15 words)
- Value proposition
- MVP scope (must-have vs cut-for-later)
- Pricing tiers (2-3 tiers)
- Revenue model template
- Week-by-week 90-day timeline
- Budget breakdown
- 5 key milestones with success metrics
- Top 5 risks with mitigations
- First-10-customers playbook

### 5. OUTREACH (Content Generation)
- 5 cold email variants (AIDA, PAS, BAB, DIRECT, STORY frameworks)
- 5 LinkedIn outreach sequences (3 messages each)
- 10 social media posts (70% value, 20% story, 10% promo)
- Complete landing page copy (hero, features, pricing, FAQ, CTA)
- 30-second elevator pitch

### 6. OPS (Operating System)
- Time-blocked daily schedule
- Weekly rhythm (Monday-Sunday)
- KPI dashboard (5-7 key metrics by business type)
- Automation opportunities with tool recommendations
- Full tool stack (free/cheap tier)
- 13-week sprint plan with success metrics
- Review cadence (daily/weekly/monthly)

## Supported Business Types

- **SaaS** -- subscription software (8-week MVP)
- **Service** -- freelance/done-for-you (2-week MVP)
- **Ecommerce** -- physical/digital product sales (4-week MVP)
- **Marketplace** -- two-sided platform (12-week MVP)
- **Content** -- newsletter, course, membership (1-week MVP)
- **Agency** -- client services at scale (2-week MVP)
- **Consulting** -- expert advisory (1-week MVP)

## Usage

```python
from skillchain.solopreneur import SolopreneurEngine

engine = SolopreneurEngine()
result = engine.run(
    idea="AI-powered invoice processing for freelancers",
    target_audience="freelancers doing $50K-200K/year with 10+ clients",
    founder_skills=["python", "ML", "was a freelancer for 5 years"],
    budget="$500/month",
    business_type="saas",
)

# Summary report
print(result.report)

# Full detailed report with all content
print(result.full_report)
```

### CLI

```bash
# Full pipeline
skillchain launch "AI invoice processing for freelancers" \
    --audience "freelancers doing $50K-200K/year" \
    --skills "python,ML,freelancing" \
    --budget "$500/month" \
    --type saas \
    --output launch_report.txt

# Quick validation only
skillchain launch "my idea" --audience "my audience" --validate-only

# Outreach content only
skillchain launch "my idea" --audience "my audience" --outreach-only
```

## Key Design Decisions

1. **Template-based, not LLM-dependent**: Every stage runs deterministically from structured templates and scoring rubrics. No API calls needed. Instant results.

2. **Tournament selection**: Like Verified Fix Mode's candidate approach, we don't just generate one strategy -- we generate three and pick the best using weighted scoring.

3. **Ready-to-use output**: Cold emails are ready to personalize and send. Landing page copy is ready to paste into Carrd. The 90-day sprint is ready to execute.

4. **Founder-fit aware**: Scoring accounts for the founder's actual skills, not just the idea's market potential.

5. **Business-type specialized**: Every output (KPIs, pricing, tools, channels, risks) is tailored to the specific business type.
