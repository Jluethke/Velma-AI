# Portfolio Showcase System

Turns your scattered work samples into a portfolio that actually gets you hired or wins clients. Covers which projects to include (and which to cut), how to write case studies that show your thinking and not just your output, presentation flow that holds attention, and how to tailor the whole thing to the person reviewing it. Not about making things pretty -- it's about making your work impossible to ignore. Works for designers, developers, writers, marketers, consultants, or anyone whose work needs to speak for them.

## Execution Pattern: Phase Pipeline

```
PHASE 1: AUDIT        --> Inventory all your work and identify what's portfolio-worthy
PHASE 2: TARGETING    --> Define who's reviewing this and what they need to see
PHASE 3: CASE STUDIES --> Write compelling stories about your best work
PHASE 4: FLOW         --> Arrange everything into a presentation that builds momentum
PHASE 5: DELIVERY     --> Optimize for the actual formats and contexts where people will see it
```

## Inputs
- work_samples: array -- All potential portfolio pieces: projects, campaigns, deliverables, results, roles played. Include both professional and personal/side projects. More is better at this stage -- we'll cut later
- professional_context: object -- Your field, specialization, experience level, and what kind of work you want to get more of (this matters more than what you've done)
- target_audience: object -- Who will review this: hiring managers, clients, agencies, VCs, creative directors. Their industry, seniority, and what they're evaluating you for
- constraints: object -- (Optional) Platform requirements (Behance, personal site, PDF, Notion), page/time limits, NDA-restricted work, deadline for completion
- career_direction: object -- (Optional) Where you're heading vs. where you've been. If you're pivoting, what transferable work bridges the gap

## Outputs
- portfolio_selection: array -- Final curated list of 4-8 pieces with justification for each inclusion
- case_studies: array -- Complete case study write-ups for each selected piece with problem/process/result structure
- presentation_flow: object -- Ordered sequence with opening, body, and closing strategy, including transitions between pieces
- targeting_matrix: object -- Variations for different audiences: which pieces to lead with, which to skip, what to emphasize
- delivery_package: object -- Platform-optimized versions with format specs, file sizes, and sharing strategies

## Execution

### Phase 1: AUDIT
**Entry criteria:** Person has at least 3 pieces of work they could potentially show.
**Actions:**
1. Create a complete inventory of all work. Include everything -- professional projects, freelance gigs, side projects, school work (if recent), volunteer work, personal experiments. Don't judge yet. The goal is to see the full landscape.
2. For each piece, capture: what you did (your specific role and contributions), the outcome (numbers if possible -- revenue, users, engagement, time saved), tools/skills used, timeline, and who the work was for.
3. Score each piece on three dimensions:
   - **Impact:** Did it produce measurable results? Did it matter to someone?
   - **Craft:** Does it demonstrate skill and quality in your discipline?
   - **Story:** Is there an interesting problem, process, or insight to talk about?
   Each dimension gets a 1-5 score. Pieces scoring below 9 total are candidates for cutting.
4. Identify gaps: are there skills or capabilities your target audience expects to see that aren't represented? If you want UX research roles but have no research case studies, that's a problem to solve (even if it means creating a spec project).
5. Handle NDA-restricted work: you can often show process without showing the final deliverable. Anonymize the client, blur sensitive data, describe the approach and results without revealing specifics. Check your NDA language -- many are less restrictive than people assume.

**Output:** Complete work inventory with scores, gap analysis, and NDA workaround strategies.
**Quality gate:** Every piece has specific role, outcome, and skill tags. Scoring is honest (not everything is a 5). Gaps between current portfolio and target role are identified.

### Phase 2: TARGETING
**Entry criteria:** Work inventory complete.
**Actions:**
1. Profile the primary reviewer. Not a generic persona -- the actual person or type of person who'll see this. A hiring manager at a tech company scans portfolios in 30-90 seconds before deciding to look deeper. A potential client might spend 5 minutes. A creative director looks at craft first, strategy second. Know your reviewer's behavior.
2. Map what the reviewer is evaluating. For hiring: can this person do the job, do they think like us, will they fit the team. For clients: can they solve my specific problem, have they worked with companies like mine, are they worth the price. For agencies: what's their range, speed, and style.
3. Build a targeting matrix: for each audience type, rank your portfolio pieces by relevance. Your strongest piece for a startup founder might be irrelevant to a corporate recruiter. The goal isn't one perfect portfolio -- it's a modular system you can adapt.
4. Identify the "proof points" each audience needs:
   - Results-driven audiences: revenue, growth, engagement metrics
   - Process-driven audiences: methodology, research, iteration, collaboration
   - Craft-driven audiences: polish, detail, technical skill, aesthetic judgment
   Your case studies will emphasize different things for different audiences.
5. Determine the "no more than" rule: most portfolios should have 4-8 pieces. More than that and you're diluting your strongest work. For the primary target audience, select the final pieces -- this is the hardest part. Kill your darlings.

**Output:** Reviewer profiles, evaluation criteria map, targeting matrix, proof point requirements, and final piece selection per audience.
**Quality gate:** Final selection is 4-8 pieces maximum. Every selected piece maps to at least one audience proof point. At least one piece demonstrates results, one demonstrates process, and one demonstrates craft.

### Phase 3: CASE STUDIES
**Entry criteria:** Final pieces selected and targeting matrix complete.
**Actions:**
1. Write each case study using the Problem-Process-Result (PPR) framework:
   - **Problem (20%):** What was broken, missing, or needed? Why did it matter? Set the stakes. If the reader doesn't understand why this project mattered, they won't care about your solution.
   - **Process (50%):** What did YOU do? Walk through your thinking, decisions, pivots, and rationale. This is where you demonstrate how you work, not just what you produced. Include dead ends and wrong turns -- they show judgment.
   - **Result (30%):** What happened? Quantify everything you can. "Increased sign-ups by 34%" beats "improved the sign-up flow." If you don't have hard numbers, use qualitative results: "client renewed for a second year," "shipped on time for the first time in the team's history."
2. Write the one-sentence hook for each case study. This is what appears in the thumbnail, the portfolio grid, the conversation starter. Make it specific: "Redesigned the onboarding flow that was losing 60% of new users before they reached the dashboard" beats "UX redesign for a SaaS product."
3. Curate visuals for each case study: before/after screenshots, process artifacts (sketches, wireframes, drafts, research notes), final deliverables. Show the messy middle, not just the polished end. Process photos build trust.
4. Write your role clearly and honestly. "Led a team of 4 designers" is different from "Contributed to a team project." Don't inflate, but don't undersell. If you did the work, own it. If you contributed to a team, specify what you contributed.
5. Add a "what I learned" or "what I'd do differently" note to at least 2 case studies. This shows self-awareness and growth -- qualities that matter more than perfection to most reviewers.
6. Keep each case study readable in under 3 minutes. If it needs to be longer, add an executive summary at the top (problem + result in 2 sentences) so skimmers get the key points.

**Output:** Complete case studies for each selected piece with PPR structure, one-sentence hooks, curated visuals, role descriptions, and reflection notes.
**Quality gate:** Every case study has at least one quantified result (or a clear qualitative outcome). Process section shows thinking, not just doing. Each is readable in under 3 minutes. Role is stated explicitly.

### Phase 4: FLOW
**Entry criteria:** All case studies written.
**Actions:**
1. Design the opening. The first thing someone sees determines whether they keep looking. Lead with your strongest piece -- not your most recent or most prestigious, but the one that best demonstrates what you want to do next. The opener should be the work you're most proud of AND most relevant to your target.
2. Sequence the remaining pieces using one of these patterns:
   - **Range pattern:** Alternate between different types of work to show breadth (research piece, then visual piece, then strategy piece)
   - **Depth pattern:** Group similar work together to show specialization (three e-commerce redesigns that each show different challenges)
   - **Growth pattern:** Chronological with visible skill progression (good for early-career portfolios)
   Choose the pattern that matches your career narrative and audience expectations.
3. Build transitions between pieces. The portfolio should feel like a journey, not a random collection. Use brief intro text between case studies: "While that project was about simplifying complexity, this next one was about building something from nothing."
4. Design the closing. The last piece should be memorable and forward-looking. End with work that shows where you're heading, not where you've been. If you're pivoting, the closer should be the work most aligned with your new direction.
5. Create a "quick scan" version: the version someone sees in 30 seconds. Thumbnail images, one-sentence hooks, and clear visual hierarchy. If someone only sees the grid view, they should still understand what you do and how well you do it.

**Output:** Ordered presentation sequence, opening and closing strategy, transition text, quick-scan layout, and narrative arc description.
**Quality gate:** Opening piece is the strongest for the target audience. Sequence has intentional logic (not random order). Quick-scan version communicates value in under 30 seconds. Closing piece points forward.

### Phase 5: DELIVERY
**Entry criteria:** Flow designed.
**Actions:**
1. Optimize for the primary delivery platform:
   - **Personal website:** Responsive layout, fast loading (compress images to under 500KB each), SEO for your name and specialty, clear navigation, contact info on every page
   - **PDF/deck:** Under 15 pages, under 10MB, designed for screen viewing (not print). Include clickable links. Test on both Mac and Windows
   - **Behance/Dribbble:** Platform-specific image dimensions, project cover optimization, tag strategy for discoverability
   - **Notion/Google Sites:** Template structure, embed capabilities, sharing permissions
2. Build the "send" version: a lightweight package you can email or message. This is NOT the full portfolio -- it's 3-4 pages with your best hooks, thumbnail case studies, and a link to the full version. Think of it as the trailer, not the movie.
3. Create audience-specific entry points. Instead of one portfolio link, build 2-3 filtered views: "See my UX work," "See my brand work," "See my strategy work." Let the reviewer self-select into the work most relevant to them.
4. Test the portfolio with a "cold eyes" check: someone who doesn't know you reviews it in real-time while you watch (or they screen-record). Note where they pause, what they skip, where they get confused. Fix those spots.
5. Set up a review and refresh schedule. Portfolios go stale. Every 3 months, swap out the weakest piece for new work. Every 6 months, reassess the targeting matrix. Every time you land a great new project, evaluate whether it replaces something in the current lineup.

**Output:** Platform-optimized portfolio, send-ready lightweight version, audience-specific entry points, cold-eyes test findings, and refresh schedule.
**Quality gate:** Primary platform loads in under 3 seconds. Send version is under 5MB. At least 2 audience-specific entry points exist. Refresh schedule is on the calendar.

## Exit Criteria
Done when: (1) 4-8 portfolio pieces selected with clear justification, (2) each piece has a complete PPR case study with quantified results, (3) presentation flow has intentional sequence with strong opening and closing, (4) portfolio is optimized for primary delivery platform, (5) send-ready version exists for quick sharing.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| AUDIT | Person has fewer than 3 pieces of work to show | Adjust -- create 1-2 spec projects or documented personal projects. A well-done spec project beats a mediocre real one in a portfolio |
| AUDIT | All work is under NDA | Adjust -- create anonymized case studies focusing on process and methodology. Use placeholder visuals. Many hirers accept this -- the thinking matters more than the pixels |
| TARGETING | Person is targeting multiple very different audiences | Adjust -- build the modular system with shared core pieces and audience-specific additions. Maximum 3 audience variations to maintain |
| CASE STUDIES | No metrics or measurable results available | Adjust -- use process metrics (timeline, scope, team size), stakeholder quotes, or before/after comparisons. "Shipped in 4 weeks with zero defects" is a result even without revenue numbers |
| CASE STUDIES | Person struggles to articulate their process | Adjust -- use the "explain it to a friend" method. Record a casual walkthrough of the project, then transcribe and edit. Speaking is easier than writing for most people |
| FLOW | Portfolio pieces feel disconnected with no coherent narrative | Adjust -- find the thread. Usually it's a way of thinking or a type of problem you're drawn to. Make that thread explicit in the intro and transitions |
| DELIVERY | Person has no website and no budget for one | Adjust -- use Notion, Google Sites, or a single-page Carrd site (free tier). A simple, clean free site beats a cluttered expensive one |

## State Persistence
- Work inventory with scores and metadata (add new projects as completed)
- Target audience profiles and evaluation criteria
- Case study drafts and final versions
- Presentation flow and sequence decisions
- Platform analytics (if available -- page views, time on page, click-through)
- Refresh log (what was swapped, when, and why)
- Feedback from cold-eyes tests and actual reviewer reactions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
