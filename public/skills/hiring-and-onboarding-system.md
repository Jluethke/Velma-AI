# Hiring and Onboarding System

Helps you hire the right person and set them up to succeed -- not just fill a seat. Covers the full cycle: writing job descriptions that attract the people you actually want, building interview scorecards so you're evaluating candidates consistently (not just picking whoever you vibed with), running background checks without getting sued, and creating 30/60/90 day onboarding plans that prevent the "thrown to the wolves" experience that makes 20% of new hires quit within 45 days. Built for small business owners, hiring managers, and team leads who don't have an HR department doing this for them.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DEFINE      --> Clarify exactly what you need before posting anything
PHASE 2: ATTRACT     --> Write the job posting and put it where the right people will see it
PHASE 3: EVALUATE    --> Screen, interview, and score candidates consistently
PHASE 4: SELECT      --> Make the offer, run checks, close the deal
PHASE 5: ONBOARD     --> 30/60/90 day plan that turns a new hire into a contributor
```

## Inputs
- role_info: object -- Job title, department/team, reporting structure, key responsibilities, required vs. nice-to-have qualifications, salary range, full-time/part-time/contract, remote/hybrid/onsite
- team_context: object -- Team size, current team strengths and gaps, management style, team culture (fast-paced vs. methodical, collaborative vs. independent, formal vs. casual), why the position is open (growth, replacement, new role)
- company_info: object -- Company size, industry, stage (startup, growing, established), benefits offered, unique selling points for candidates, any challenges to acknowledge (below-market pay, demanding schedule, remote-only)
- hiring_capacity: object -- Who's involved in the hiring process, interview availability, desired start date, budget for job posting and recruitment
- past_experience: object -- (Optional) Past hiring mistakes to avoid, what's worked and hasn't, turnover patterns, interview red flags you've learned the hard way

## Outputs
- job_description: string -- Complete, compelling job posting ready to publish
- interview_scorecard: object -- Structured evaluation framework with questions, competency ratings, and red flag indicators
- hiring_checklist: object -- Step-by-step process from posting to signed offer, with timeline
- offer_package: object -- Offer letter template, negotiation boundaries, and closing strategy
- onboarding_plan: object -- 30/60/90 day structured plan with milestones, check-ins, and success metrics

## Execution

### Phase 1: DEFINE
**Entry criteria:** Someone needs to be hired.
**Actions:**
1. Before writing anything, answer: "What problem does this hire solve?" This sounds obvious but most bad hires start here. A job description copied from last time (or from a competitor's posting) often describes a role that no longer matches what you actually need. Start from scratch: what work isn't getting done? What skill is missing from the team? What would change in 6 months if this hire works out?
2. Separate the must-haves from the nice-to-haves. Be honest and specific:
   - **Must-haves:** Skills and experience the person cannot do the job without. Limit to 3-5. If your must-have list is 12 items long, you're describing a unicorn who doesn't exist (or who's too expensive for you). Each must-have should be testable: not "strong communication skills" but "can write clear customer-facing documentation" or "can present project status to executives."
   - **Nice-to-haves:** Things that would make someone exceptional but aren't required to start. This is where industry experience, specific tool knowledge, and certifications usually belong. Many of these can be learned in the first 90 days.
3. Define success for this role. Write 3-5 specific outcomes you expect in the first year. Examples: "Process payroll accurately for 200 employees twice monthly with zero corrections needed after month 3" or "Generate 15 qualified leads per month by month 6." These become your onboarding milestones and your performance evaluation framework. If you can't define success, you're not ready to hire.
4. Set the compensation range honestly. Research market rates for the role, location (remote roles compete with national/global markets), and experience level. Use: Glassdoor, Levels.fyi (for tech), PayScale, Bureau of Labor Statistics, or simply asking people in your network what they'd expect. If your budget is below market, acknowledge it and identify what else you offer (flexibility, growth, mission, equity, interesting work). Don't post "competitive salary" when it's not -- you'll waste everyone's time.
5. Identify the hiring team. Who screens resumes? Who interviews? Who makes the final decision? Define roles clearly to prevent: too many cooks (candidates interviewed by 8 people over 6 weeks lose interest), conflicting evaluations (one interviewer loves them, another hates them, nobody knows whose opinion matters), and decision paralysis (everyone waits for everyone else to decide). Ideal: one person screens resumes, 2-3 people interview, one person makes the final call with input from the others.

**Output:** Role definition document with problem statement, must-haves/nice-to-haves, success metrics, compensation range, and hiring team assignments.
**Quality gate:** Must-haves are limited to 5 or fewer. Each must-have is testable in an interview or work sample. Success metrics are specific and measurable. Compensation range is market-informed. Decision-making authority is clear.

### Phase 2: ATTRACT
**Entry criteria:** Role is defined.
**Actions:**
1. Write the job description in a human voice. Structure:
   - **Opening hook (2-3 sentences):** What the job is about and why it matters. Not "We are a leading provider of synergistic solutions." Instead: "We need someone to run our customer support team -- 8 people handling 500 tickets a week for a product our customers actually love. The team is good but growing fast and needs a leader who can build systems without killing the culture."
   - **What you'll do (5-8 bullet points):** Specific responsibilities, not vague corporate-speak. "Manage the weekly content calendar and publish 3-4 blog posts" not "Drive content strategy across multiple channels."
   - **What you bring (must-haves and nice-to-haves, clearly separated):** Be specific. "3+ years managing a B2B sales pipeline of $1M+" not "Proven track record in sales."
   - **What we offer:** Salary range (yes, include it -- states increasingly require it and candidates skip postings without it), benefits, schedule, remote/onsite, growth opportunities, and the honest answer to "why should someone want this job?"
   - **How to apply:** Clear instructions. If you want a cover letter, say what you want it to cover. If you want a portfolio or work sample, specify what.
2. Remove bias from the posting. Research shows: job postings with heavily masculine-coded words ("aggressive," "dominant," "ninja," "rock star") reduce female applicants by 30%+. Postings requiring unnecessary credentials (degree requirements for roles that don't need them, years of experience in tools that haven't existed that long) exclude qualified candidates. Remove: unnecessary degree requirements, experience requirements beyond what the role genuinely needs, and coded language.
3. Post strategically. Where depends on the role:
   - **General roles:** Indeed, LinkedIn, your company website. These are the highest-volume channels.
   - **Specialized roles:** Industry-specific job boards, professional association boards, relevant Slack/Discord communities, niche subreddits.
   - **Referrals:** Ask your team and network first. Referred candidates are hired faster, stay longer, and perform better on average. Offer a referral bonus if budget allows ($500-$2,000 is typical).
   - **Don't post everywhere.** Focus on 2-3 channels and do them well. A posting on 15 sites with no follow-up is less effective than a posting on 2 sites with active engagement.
4. Set a timeline and stick to it. Typical hiring timeline: post for 2 weeks, screen resumes in week 3, first interviews in weeks 3-4, final interviews in week 4-5, offer by week 5-6. Every week you delay, your best candidates accept other offers. The #1 reason companies lose good candidates isn't compensation -- it's slow processes.
5. Prepare an auto-response for applicants. Acknowledge receipt of applications within 24 hours (automated is fine). Set expectations: "We'll review applications over the next 2 weeks and contact candidates we'd like to interview by [date]. If you don't hear from us by [date], the position has been filled." This is basic respect that most companies fail at.

**Output:** Final job posting ready to publish, posting channel strategy, hiring timeline with milestones, and applicant communication templates.
**Quality gate:** Job description uses specific, inclusive language. Salary range is included. Posting channels are matched to the role. Timeline is realistic and committed to. Auto-response is set up.

### Phase 3: EVALUATE
**Entry criteria:** Applications are coming in.
**Actions:**
1. Build the resume screening rubric. Create a simple scoring grid based on your must-haves. For each must-have, score 0 (doesn't meet), 1 (partially meets), or 2 (fully meets). Set a threshold: candidates scoring below X don't move forward. This prevents: gut-feeling screening (biased toward people who remind you of yourself), inconsistent standards (accepting one candidate's weakness while rejecting another's identical weakness), and "I'll know it when I see it" (you won't -- not fairly).
2. Design the interview scorecard. For each interview, define:
   - **Competencies to evaluate (3-5):** Directly mapped to must-haves and success metrics. Example: "Can prioritize competing demands" not "Is organized."
   - **Questions for each competency:** Use behavioral questions ("Tell me about a time when...") for experience and situational questions ("How would you handle...") for judgment. Avoid hypothetical questions that test presentation skills, not job skills.
   - **Rating scale:** 1-4 for each competency (avoid 1-5 -- people default to 3 and it becomes meaningless). Define what each number means: 1 = does not meet standard, 2 = partially meets, 3 = meets standard, 4 = exceeds standard.
   - **Red flag indicators:** Specific things that should cause concern regardless of scores: can't give specific examples of claimed experience, badmouths every previous employer, can't explain why they want this role, asks nothing about the actual work.
3. Structure the interview process. Recommended for most roles:
   - **Phone screen (20-30 minutes):** Confirm basics -- interest level, salary expectations, availability, deal-breakers on either side. This saves hours of in-person interview time.
   - **Skills assessment (30-60 minutes):** A work sample or practical test related to the actual job. For a writer: write something. For an analyst: analyze data. For a manager: walk through how you'd handle a specific management scenario. Work samples predict job performance better than any interview question.
   - **Team interview (45-60 minutes):** 2-3 people from the team evaluate competencies using the scorecard. Each interviewer owns different competencies to prevent redundant questions.
   - **Final conversation (30 minutes):** Hiring manager, culture fit, questions from the candidate, logistics. This is as much about selling the candidate as evaluating them.
4. Ask the same core questions to every candidate for the same role. This is non-negotiable for fair evaluation. You can have follow-up conversations that go different directions, but the core questions must be consistent. Document answers immediately after the interview (not at the end of the day when you've forgotten details and are relying on impressions).
5. Debrief within 24 hours of the final interview. Each interviewer shares their scorecard independently BEFORE group discussion (prevents anchoring bias -- the loudest voice shaping everyone's opinion). Then discuss: where scores align, where they diverge, and any red flags. Make the decision based on evidence, not consensus vibes.

**Output:** Resume screening rubric, interview scorecard with competencies and questions, work sample/assessment design, interview process flow, and debrief protocol.
**Quality gate:** Every candidate is evaluated on the same criteria. Questions map to specific competencies. Scores are documented before group discussion. At least one work sample or practical assessment is included. Red flag indicators are defined.

### Phase 4: SELECT
**Entry criteria:** Interviews complete and top candidate identified.
**Actions:**
1. Run background checks appropriately. What to check depends on the role:
   - **Standard for most roles:** Employment verification (did they work where they said?), education verification (if a specific degree is required), criminal background check (follow EEOC guidelines -- consider the nature of the offense, time elapsed, and relevance to the job).
   - **For roles with financial responsibility:** Credit check (requires written consent and a legitimate business reason).
   - **For roles involving children, elderly, or vulnerable populations:** More extensive background screening.
   - **Legal requirements:** You MUST get written consent before running background checks. You MUST follow the Fair Credit Reporting Act (FCRA) process: provide a standalone disclosure, get signed authorization, and if you decide not to hire based on the check, provide a pre-adverse action notice, wait a reasonable period, then provide an adverse action notice. Skipping these steps exposes you to lawsuits.
   - **What you cannot check or consider in most states:** Arrest records (only convictions), salary history (in many states), and social media activity unrelated to the job (risky territory -- avoid unless there's a specific, documented business reason).
2. Build the offer package. Components:
   - **Base salary:** Within your posted range. If the candidate is at the top of the range, have a justification.
   - **Benefits summary:** Health insurance, retirement, PTO, and any non-standard perks -- in writing.
   - **Start date:** Typically 2-4 weeks out to allow for notice period at current job.
   - **Contingencies:** "This offer is contingent upon satisfactory completion of background check and reference verification."
   - **Expiration date:** Give the candidate 3-5 business days to decide. Longer invites counter-offers and decision paralysis.
3. Prepare for negotiation. Know your boundaries:
   - **Salary:** What's your maximum? What justifies going above the range? (Usually: candidate exceeds qualifications, market has shifted, you've been searching for months.)
   - **Non-salary levers:** Remote days, flexible hours, signing bonus, earlier review date for raise consideration, professional development budget, title adjustment, extra PTO. These often cost the company less than salary increases but matter a lot to candidates.
   - **Walk-away point:** What's the offer below which you'd rather restart the search? Know this before the conversation.
4. Make the offer by phone first, then follow up in writing. Phone call: "We'd like to offer you the position. The base salary is [$X]. We're excited about what you'd bring to the team." Gauge reaction. If they need to negotiate, listen and respond within 24 hours. Written offer: formal letter or email with all terms, signature line, and return deadline.
5. Handle the "almost" candidates. Anyone who made it to final interviews deserves a personal rejection -- not a form email. Call or send a personal email: "We really appreciated your time and were impressed by [specific thing]. We went with another candidate whose [specific experience] was a closer match for this particular role. We'd love to stay in touch for future opportunities." This costs you 5 minutes and preserves the relationship -- you may want to hire them next time.

**Output:** Background check protocol with legal compliance steps, offer letter template, negotiation boundaries, and candidate communication templates (offer and rejection).
**Quality gate:** Background check follows FCRA requirements. Offer letter includes all material terms. Negotiation boundaries are defined before the conversation. All final-round candidates receive personal communication regardless of outcome.

### Phase 5: ONBOARD
**Entry criteria:** Offer accepted, start date set.
**Actions:**
1. Prepare before Day 1. The new hire's first impression forms before they walk in the door:
   - **Admin:** Employment paperwork ready (W-4, I-9, benefits enrollment, direct deposit), equipment ordered and set up (laptop, phone, badge, software access), email and accounts created, workspace or home office setup confirmed.
   - **Team:** Announce the new hire to the team with a brief introduction (name, role, start date, fun fact if the person is comfortable sharing). Assign a buddy -- someone on the team who isn't the manager, who answers the "stupid questions" and provides social connection.
   - **Manager prep:** Block time on the calendar for Day 1, Week 1, and key check-ins. Prepare the onboarding plan document (below). Nothing says "we don't care" like a new hire showing up to an empty desk and a manager in back-to-back meetings.
2. Build the Day 1 and Week 1 experience:
   - **Day 1:** Welcome and office/team tour (virtual for remote), complete paperwork, set up equipment, meet the team (individually or group lunch), review the 30/60/90 day plan together, and assign the first easy win -- a small, completable task that lets them contribute immediately and feel useful.
   - **Week 1:** Deep dive on the team's work, processes, and tools. Shadow key team members. Read core documentation. Start attending regular meetings as an observer. Daily 15-minute check-in with manager ("What did you learn? What are you confused about? What do you need?"). End of week 1: have the new hire tell you what they understand the job to be -- this reveals misalignment early.
3. Build the 30/60/90 day plan:
   - **First 30 days (LEARN):** Goals: understand the team, the product/service, the customers, and the processes. Metrics: can explain the team's function, has met all key stakeholders, can navigate core tools independently, has completed 2-3 defined learning tasks. Check-in: weekly with manager, daily with buddy.
   - **Days 31-60 (CONTRIBUTE):** Goals: begin doing the job with support. Take ownership of defined tasks. Start identifying inefficiencies or opportunities (fresh eyes see things the team is blind to). Metrics: handling X% of workload independently, meeting quality standards, asking good questions (not the same questions). Check-in: weekly with manager.
   - **Days 61-90 (OWN):** Goals: fully performing core responsibilities. Contributing ideas and improvements. Building relationships across the organization. Metrics: handling full workload at expected quality, managing priorities independently, hitting the success metrics defined in Phase 1. Check-in: biweekly, shifting to regular performance management cadence.
4. Schedule the critical check-ins and don't cancel them:
   - **End of Week 1:** How's it going? What's confusing? Are we meeting your expectations?
   - **End of Week 2:** What's clicking? Where do you need more support?
   - **30-day review:** Formal review against 30-day goals. Adjust the plan if needed. Ask: "Is this what you expected? Is there anything that would make you want to leave?" This is when to catch problems.
   - **60-day review:** Formal review against 60-day goals. Discuss trajectory toward full independence.
   - **90-day review:** Full performance assessment against the success metrics. Confirm mutual fit. If there are serious concerns, address them now -- don't wait until the 6-month review. If it's going well, say so clearly.
5. Address the integration, not just the information. Most onboarding fails not because people don't learn the job, but because they don't feel like they belong. Actions that build belonging: introduce them personally (not just an all-hands announcement), include them in social activities, ask for their opinion in meetings (even early on -- "what would you have done at your last company?"), celebrate their first wins publicly, and connect them with people outside their immediate team.

**Output:** Pre-Day 1 checklist, Day 1 and Week 1 schedules, 30/60/90 day plan with specific goals and metrics, check-in schedule, and integration activities.
**Quality gate:** Equipment and access are ready before Day 1. The 30/60/90 plan has specific, measurable goals for each phase. Check-ins are scheduled and on the calendar. A buddy is assigned. The new hire has a clear first task on Day 1.

## Exit Criteria
Done when: (1) role is clearly defined with testable must-haves and success metrics, (2) job posting is published on targeted channels, (3) interview process uses consistent scorecards and work samples, (4) offer is extended with proper background checks and legal compliance, (5) 30/60/90 day onboarding plan is prepared with check-in schedule.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| DEFINE | Hiring manager can't articulate what they need | Adjust -- have them describe: what does a great day look like for this person? What's the first project they'd work on? What does the team complain about that this hire would fix? Work backwards from outcomes to requirements |
| ATTRACT | No qualified applicants after 2 weeks | Adjust -- review the posting: are requirements too narrow? Is the salary range visible and competitive? Are you posting where the right people look? Consider: reducing must-haves, adjusting salary, expanding to new channels, or activating referral network |
| EVALUATE | All candidates are "okay" but none are great | Adjust -- check your expectations against reality. If every candidate falls short on the same requirement, that requirement might be unrealistic for the compensation offered. Either adjust the requirement, raise the compensation, or invest in training the best available candidate |
| EVALUATE | Interviewers disagree strongly on the top candidate | Adjust -- go back to the scorecard data. Where specifically do scores diverge? Is the disagreement about evidence (one interviewer saw something the other didn't) or about values (they prioritize different things)? If values, the hiring manager's priorities break the tie |
| SELECT | Top candidate declines the offer | Adjust -- ask why (genuinely -- the answer helps). If it's salary, decide whether to increase. If it's the role, that's useful information. Move to the second candidate quickly -- if they were a strong finalist, don't make them feel like a consolation prize. If no strong backup, reopen the search |
| ONBOARD | New hire is struggling at the 30-day check-in | Adjust -- distinguish between "learning curve" (normal, provide more support and training) and "wrong hire" (concerning, have a direct conversation about expectations). Extend the learning phase if the person is engaged and improving. If they're not improving and not trying, cut quickly -- a bad hire gets worse, not better |

## State Persistence
- Role definition and success metrics (baseline for performance evaluation)
- Job posting versions and channel performance (which sources produced the best candidates)
- Candidate pipeline (who applied, where they are in the process, scores, notes)
- Interview scorecards (individual evaluator scores and debrief notes)
- Offer details and negotiation history
- Onboarding plan with milestone completion tracking
- Check-in notes and feedback
- Time-to-hire and cost-per-hire metrics (for improving the process next time)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
