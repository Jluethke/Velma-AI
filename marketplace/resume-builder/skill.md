# Resume Builder

Takes your work history, education, and the job you're applying for, then builds a targeted resume that gets past ATS filters and catches a recruiter's eye. Rewrites bullet points as accomplishments (not duties), matches keywords from the job posting, handles employment gaps honestly, and formats for both digital and print. Covers career changers, returning-to-work parents, and people who haven't updated their resume in 10+ years.

## Execution Pattern: ORPA Loop

## Inputs
- work_history: array -- Jobs held with titles, companies, dates, and what you actually did (even rough descriptions are fine)
- education: array -- Degrees, certifications, courses, bootcamps, or self-taught skills with dates
- target_job: object -- The job you're applying for: title, company (if known), and the full job posting text (or a link to it)
- skills: array -- Technical and soft skills, tools you use, languages spoken
- situation: string -- (Optional) Special circumstances: career change, returning after a gap, military transition, first job out of school, haven't updated resume in years
- preferences: object -- (Optional) Format preferences: one page or two, include objective/summary or not, any sections to emphasize or downplay

## Outputs
- resume: object -- Complete resume with all sections formatted and ready to submit, in both ATS-friendly plain text and visually formatted versions
- keyword_analysis: object -- Keywords from the job posting matched against your resume, with a match percentage and suggestions for gaps
- bullet_rewrites: array -- Before/after comparison showing how duty-based bullets were rewritten as accomplishment-based bullets
- gap_strategy: object -- (If applicable) How employment gaps are addressed: what's on the resume, what to say if asked
- cover_letter_hooks: array -- 3-4 strongest talking points from your resume that could anchor a cover letter

## Execution

### OBSERVE: Gather and Analyze Raw Material
**Entry criteria:** At least work history and a target job description provided.
**Actions:**
1. Parse the job posting to extract: required qualifications, preferred qualifications, key responsibilities, technology/tool requirements, soft skill signals, and company culture cues.
2. Build a keyword list from the posting: exact terms the ATS will scan for. Rank by frequency and prominence (title keywords > body keywords).
3. Inventory the user's experience: total years, industries, progression trajectory (moving up, lateral, or scattered), and any patterns (leadership growth, technical deepening, industry expertise).
4. Identify the gap between what the job wants and what the user has. Flag: strong matches (highlight these), partial matches (need reframing), and missing qualifications (address honestly or omit).
5. Detect special situations: employment gaps longer than 6 months, career changes (different industry or role type), overqualification, underqualification, or very short tenures at multiple jobs.
6. Note any quantifiable achievements buried in the raw input ("I managed a team" becomes "How many people? What did the team accomplish?"). Flag questions to ask the user.

**Output:** Job requirement breakdown, keyword priority list, experience inventory, gap analysis, situation flags, follow-up questions for the user.
**Quality gate:** All required qualifications from the posting are mapped to user experience or flagged as gaps. Keyword list extracted.

### REASON: Design the Resume Strategy
**Entry criteria:** Raw material analyzed, follow-up questions answered.
**Actions:**
1. Choose the resume format based on the user's situation:
   - Reverse chronological: standard for linear career paths with clear progression.
   - Functional/skills-based: better for career changers or significant gaps.
   - Combination: strong skills section up top, followed by chronological work history. Best for most people.
2. Decide on length: one page for under 10 years of experience or entry-level, two pages for 10+ years or senior roles. Never three pages.
3. Plan the header: name, location (city/state only -- no full address), phone, email, LinkedIn. No photo, no age, no marital status.
4. Determine whether to include a summary statement: yes for career changers, senior roles, or when the connection between experience and target job isn't obvious. Skip for straightforward applications.
5. Prioritize sections: put the strongest matching content closest to the top. If education is more relevant than recent work (new grad, career change to a field where you have a relevant degree), education goes first.
6. Plan keyword integration: map each high-priority keyword to a specific bullet point or skills entry. Aim for 70%+ keyword match rate without keyword stuffing.
7. Develop the gap strategy if needed:
   - Short gaps (under 6 months): don't explain, just use years instead of months.
   - Longer gaps: include a brief honest entry (freelance consulting, family caregiver, professional development).
   - Career changes: reframe transferable skills with new language.

**Output:** Resume structure blueprint, format decision, section order, keyword placement plan, gap handling strategy.
**Quality gate:** Format matches situation. Keyword match rate projected above 65%. Gaps addressed. Length appropriate.

### PLAN: Write the Resume Content
**Entry criteria:** Strategy approved.
**Actions:**
1. Write bullet points as accomplishments using the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]."
   - Bad: "Responsible for managing social media accounts."
   - Good: "Grew Instagram following from 2K to 15K in 6 months by implementing a data-driven content calendar and engagement strategy."
2. Quantify everything possible. If the user doesn't have exact numbers, use honest approximations: "approximately," "over," or ranges.
3. Front-load each bullet with a strong action verb. Vary the verbs -- don't start every bullet with "Managed" or "Led." Use: spearheaded, launched, reduced, negotiated, designed, built, streamlined, transformed, delivered, secured.
4. Integrate keywords naturally. The keyword should appear in context, not jammed into a skills list. "Managed Salesforce CRM migration" beats "Skills: Salesforce."
5. Write the skills section with a mix of hard skills (tools, technologies, certifications) and soft skills reframed as capabilities ("cross-functional team leadership" not "good communicator").
6. Craft the summary statement (if included): 2-3 sentences max. Lead with years of experience and domain, highlight the single most impressive achievement, and connect to the target role.
7. Format for ATS compatibility: no tables, no columns, no headers/footers, no graphics. Use standard section titles (Experience, Education, Skills). Save as .docx or plain text -- not PDF unless specifically requested.
8. Create a second visually polished version for human readers: clean typography, subtle section dividers, consistent spacing, readable at a glance.

**Output:** Complete resume in both ATS-plain and human-readable formats, with all sections written and formatted.
**Quality gate:** Every bullet starts with an action verb. At least 60% of bullets include a quantified result. Keywords integrated naturally. Passes ATS parsing test (no formatting that would break extraction).

### ACT: Deliver and Optimize
**Entry criteria:** Resume content complete and formatted.
**Actions:**
1. Present the resume with a section-by-section walkthrough explaining key decisions: "I put your project management experience first because the job posting mentions it three times."
2. Deliver the keyword analysis: show which job posting keywords are in the resume, which are missing, and whether the missing ones can be added or are genuinely not in the user's background.
3. Show the before/after bullet rewrites so the user understands the transformation and can apply the same technique to future updates.
4. Provide the gap strategy explanation: what's on the resume and what to say if asked about gaps in an interview.
5. Offer the cover letter hooks: "Your three strongest talking points for a cover letter are..."
6. Suggest tailoring notes: "If you apply to a similar role at a different company, here's what to adjust: swap these keywords, update the summary to mention their industry."

**Output:** Final resume (both formats), keyword match report, bullet transformation examples, interview prep notes for gaps, and cover letter starting points.
**Quality gate:** Resume is ready to submit. Keyword match rate is above 65%. User understands how to tailor for similar roles.

## Exit Criteria
Done when: (1) resume is complete in ATS-friendly and human-readable formats, (2) keyword match rate against job posting is above 65%, (3) all bullets are accomplishment-based with action verbs, (4) employment gaps are addressed (if applicable), (5) user has cover letter hooks and tailoring guidance for future applications.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Job posting not provided (just a job title) | Adjust -- use typical requirements for that role and seniority level, note that a specific posting would improve keyword matching |
| OBSERVE | User can't remember job details or dates | Adjust -- use approximations, suggest checking LinkedIn or old tax returns for dates, write bullets from general role descriptions |
| REASON | User is dramatically underqualified for target job | Escalate -- be honest: "This role asks for 8 years of experience and you have 2. Here's a resume for this job, but also consider these more realistic target roles that match your background" |
| REASON | Career history is non-linear or unusual | Adjust -- use a functional or combination format that leads with transferable skills rather than chronological history |
| PLAN | Cannot quantify any achievements | Adjust -- use scope indicators instead: team size, budget range, project count, client count, geographic reach |
| ACT | User wants to include something inadvisable (photo, age, salary history, references on resume) | Advise -- explain why it hurts more than helps, but respect the user's final decision |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (bullet rewrites, keyword matching, summary statement, or gap strategy) and rerun only that section. Do not rebuild the full resume. |

## State Persistence
- Master experience inventory (all jobs, skills, and achievements -- not just what's on the current resume)
- Job posting keyword patterns (common keywords by industry and role for faster future matching)
- Bullet point library (reusable accomplishment bullets organized by skill category)
- Resume versions (track which version was sent to which company)
- What worked (if user reports getting interviews, note which resume elements were present)

---

## Reference

### XYZ Bullet Formula

"Accomplished [X] as measured by [Y] by doing [Z]."

Example: "Reduced customer onboarding time by 40% (from 5 days to 3) by redesigning the intake form and automating document collection."

### ATS Keyword Match Rate Benchmarks

| Match Rate | Outcome |
|---|---|
| < 50% | Likely filtered out before human review |
| 50-65% | Marginal; may pass with strong format |
| 65-80% | Good; typically clears ATS filters |
| 80%+ | Excellent; prioritized in results |

### Resume Format Decision Matrix

| Situation | Recommended Format |
|---|---|
| Linear career, clear progression | Reverse chronological |
| Career change, significant gaps | Functional / skills-based |
| Strong skills + chronological history | Combination |
| New grad, limited experience | Reverse chronological (1 page) |

### Employment Gap Handling Rules

| Gap Duration | Strategy |
|---|---|
| Under 6 months | Use years only (not months); no explanation needed |
| 6-12 months | Brief entry: "Freelance consulting" or "Family leave" |
| Over 12 months | Short entry with honest description + relevant activities |

### Strong Action Verb Bank

Built, launched, reduced, grew, negotiated, streamlined, delivered, secured, transformed, spearheaded, scaled, designed, led, directed, generated, saved, recovered, exceeded, developed, implemented.

### Summary Statement Formula

"[Years] of experience in [domain]. [Single most impressive achievement]. Seeking [target role] to [how you'll contribute]." (Target: 2-3 sentences, under 60 words.)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.