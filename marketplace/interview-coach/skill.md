# Interview Coach

Prepares you for job interviews by generating likely questions based on the role and company, coaching you through the STAR method for behavioral questions, running mock interviews with feedback, and preparing smart questions to ask the interviewer. Covers phone screens, technical interviews, panel interviews, and "tell me about yourself." Designed for nervous interviewers and career changers.

## Execution Pattern: ORPA Loop

## Inputs
- role: object -- Job title, company name, and job posting text (or key responsibilities if no posting available)
- background: object -- Your resume or work history summary, relevant skills, and years of experience
- interview_type: string -- Type of interview: "phone screen", "hiring manager", "panel", "technical", "behavioral", "case study", "final round", or "unknown"
- concerns: array -- (Optional) What you're most nervous about: "I ramble", "I freeze on behavioral questions", "I have an employment gap", "I'm changing careers", "I haven't interviewed in years"
- company_context: string -- (Optional) Anything you know about the company culture, interviewer names, or team you'd be joining
- prep_time: string -- (Optional) How much time before the interview: "tomorrow", "this week", "two weeks", "just exploring"

## Outputs
- question_bank: object -- 20-30 likely interview questions organized by category (behavioral, technical, situational, role-specific, curveball) with difficulty ratings
- answer_frameworks: array -- Structured answer outlines for the 10 most critical questions, using STAR method for behavioral and direct-answer format for technical
- mock_interview: object -- A simulated interview with questions, space for your answers, and detailed feedback on each response
- questions_to_ask: array -- 8-10 thoughtful questions to ask the interviewer, organized by topic (role, team, growth, culture, company direction)
- interview_day_guide: object -- Logistics checklist, confidence-building tips, body language reminders, and what to do in the first 90 seconds

## Execution

### OBSERVE: Research and Profile
**Entry criteria:** Role and at least a summary of user's background provided.
**Actions:**
1. Analyze the job posting for interview signals: what will they test? Technical skills mentioned become technical questions. Leadership responsibilities become behavioral questions. "Fast-paced environment" signals stress-test questions.
2. Research the interview type norms:
   - Phone screen: 30 min, high-level fit check, salary expectations, availability.
   - Hiring manager: 45-60 min, deep dive on experience and team fit.
   - Panel: 60 min, multiple interviewers, broader range of questions.
   - Technical: varies wildly by field (coding challenge, case study, portfolio review, whiteboard).
   - Behavioral: almost entirely "Tell me about a time when..." questions.
3. Identify the user's vulnerability points: gaps in experience vs. job requirements, career changes that need explaining, short tenures, lack of specific certifications.
4. Assess the user's stated concerns and map them to coaching strategies:
   - Rambling: practice timed responses (2 minutes max per answer).
   - Freezing: prepare answer frameworks to fall back on.
   - Nervousness: build confidence through rehearsal and positive framing.
5. If company context is available, research the company's values, recent news, and Glassdoor interview reports to predict company-specific questions.

**Output:** Interview profile with predicted question categories, vulnerability map, coaching priorities, and company-specific intelligence.
**Quality gate:** At least 5 question categories identified. User's top 3 vulnerabilities have planned responses. Interview type norms documented.

### REASON: Build the Question Bank and Strategy
**Entry criteria:** Interview profile complete.
**Actions:**
1. Generate questions by category:
   - **Behavioral (8-10):** "Tell me about a time you..." questions mapped to the job's key competencies (leadership, problem-solving, conflict resolution, failure recovery, teamwork).
   - **Technical/Role-specific (5-8):** Direct questions about skills, tools, and domain knowledge listed in the posting.
   - **Situational (3-5):** "What would you do if..." scenarios drawn from the role's likely challenges.
   - **Curveball (3-5):** "Why should we hire you?", "What's your biggest weakness?", "Where do you see yourself in 5 years?", "Why are you leaving your current job?"
   - **Opening (2-3):** "Tell me about yourself", "Walk me through your resume", "Why this company?"
2. For each behavioral question, build a STAR framework:
   - **Situation:** Set the scene in 1-2 sentences (when, where, what was happening).
   - **Task:** What was your specific responsibility or challenge?
   - **Action:** What did YOU do? (Not the team -- you. Use "I," not "we.")
   - **Result:** What happened? Quantify if possible. What did you learn?
3. For curveball questions, prepare honest-but-strategic answers:
   - "Biggest weakness" -- pick a real weakness you're actively improving, with evidence of improvement.
   - "Why are you leaving?" -- focus on what you're moving toward, not what you're running from.
   - "Salary expectations" -- defer if possible ("I'd like to learn more about the role first"), or provide a researched range.
4. Prepare 8-10 questions for the user to ask the interviewer:
   - Role clarity: "What does success look like in the first 90 days?"
   - Team dynamics: "How would you describe the team I'd be working with?"
   - Growth: "What growth opportunities exist for someone in this role?"
   - Culture: "What's something about working here that surprised you?"
   - Avoid: salary (too early), anything easily Googled, "Did I get the job?"
5. Rate each question by likelihood (high/medium/low) and difficulty (easy/moderate/hard).

**Output:** Complete question bank with STAR frameworks, curveball strategies, and interviewer questions.
**Quality gate:** At least 20 questions generated. Every behavioral question has a STAR outline. Curveball answers are honest and strategic. Interviewer questions demonstrate genuine interest.

### PLAN: Build Mock Interview and Coaching Materials
**Entry criteria:** Question bank complete.
**Actions:**
1. Design a mock interview sequence: select 8-10 questions that simulate the real interview flow (opening, behavioral, technical, situational, closing). Order them as a real interviewer would.
2. For each mock question, provide:
   - The question itself.
   - Why this question is asked (what the interviewer is really evaluating).
   - A strong answer framework specific to the user's background.
   - A weak answer example (what to avoid).
   - Time target (most answers should be 1-2 minutes; "tell me about yourself" should be 60-90 seconds).
3. Address each stated concern with specific coaching:
   - Rambling: "After your STAR result, stop talking. Silence is okay. The interviewer will ask a follow-up if they want more."
   - Freezing: "If you blank, say 'That's a great question, let me think about that for a moment.' Take 5 seconds. It feels like an eternity to you but it's normal to them."
   - Employment gaps: script exact wording -- brief, honest, forward-looking.
   - Career change: prepare the "bridge story" connecting old career to new target.
4. Build the interview-day guide:
   - Night before: lay out clothes, print resume copies, charge phone, set two alarms.
   - Morning of: eat breakfast, review your top 3 talking points (not the whole prep -- you'll overwhelm yourself), arrive 10 minutes early.
   - First 90 seconds: firm handshake (or confident video-call greeting), smile, use their name, mirror their energy level.
   - Body language: sit up straight, maintain eye contact 60-70% of the time, don't cross arms, nod when listening.
   - After the interview: send a thank-you email within 24 hours referencing something specific from the conversation.
5. Create a one-page "cheat sheet" the user can review in the parking lot or waiting room: their 3 strongest talking points, their "tell me about yourself" script, and their top 3 questions for the interviewer.

**Output:** Mock interview script, coaching notes per concern, interview-day logistics guide, and parking-lot cheat sheet.
**Quality gate:** Mock interview simulates realistic timing and flow. Every user concern has a specific coaching strategy. Cheat sheet fits on one page.

### ACT: Deliver and Rehearse
**Entry criteria:** All coaching materials ready.
**Actions:**
1. Present the question bank organized by category with likelihood and difficulty ratings.
2. Walk through the STAR frameworks for the top 5 most likely behavioral questions, explaining the strategy behind each.
3. Run the mock interview: present questions one at a time, let the user respond, then provide feedback on structure (did they use STAR?), content (did they answer what was actually asked?), and delivery (too long? too vague? strong or weak close?).
4. Deliver the curveball answers with coaching notes on tone and delivery.
5. Present the questions to ask the interviewer with notes on when to use each one (e.g., "Save the growth question for the hiring manager, not the phone screen").
6. Hand off the interview-day guide and parking-lot cheat sheet.
7. Offer to re-run the mock interview with different questions or tougher follow-ups.

**Output:** Complete interview prep package: question bank, answer frameworks, mock interview with feedback, interviewer questions, day-of guide, and cheat sheet.
**Quality gate:** User has practiced at least 5 questions aloud. STAR method is understood. User has 3+ questions ready to ask. Day-of logistics are clear.

## Exit Criteria
Done when: (1) question bank covers all likely categories for the interview type, (2) STAR frameworks exist for the top behavioral questions, (3) curveball questions have prepared answers, (4) user has 8+ smart questions to ask the interviewer, (5) mock interview has been offered or completed, (6) interview-day guide and cheat sheet are delivered.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No job posting available, just a job title | Adjust -- generate questions based on typical interviews for that role and seniority level, note that a specific posting would improve accuracy |
| OBSERVE | User has never worked before (first job) | Adjust -- draw STAR stories from school projects, volunteer work, sports teams, part-time jobs, or personal projects. Everyone has examples of problem-solving and teamwork |
| REASON | User can't think of STAR examples for a key competency | Adjust -- prompt with scenarios: "Have you ever had to meet a tight deadline? Resolve a disagreement? Fix something that was broken? Learn something new quickly?" |
| REASON | Interview is tomorrow with no prep time | Adjust -- skip the full prep, deliver only: "tell me about yourself" script, top 5 likely questions with quick frameworks, 3 questions to ask, and the parking-lot cheat sheet |
| PLAN | User has extreme interview anxiety | Adjust -- add grounding techniques (box breathing, power posing), reframe the interview as a conversation not an interrogation, emphasize that they're also evaluating the company |
| ACT | User gives weak answers in mock interview | Coach -- never say "that was bad." Instead: "Good start -- here's how to make it stronger: lead with the result, then explain how you got there" |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (question bank, STAR frameworks for specific questions, mock interview feedback, or the cheat sheet) and rerun only that section. Do not regenerate the full prep package. |

## State Persistence
- Interview history (roles applied for, questions encountered, outcomes)
- STAR story library (user's best examples organized by competency -- reusable across interviews)
- Company research cache (culture notes, Glassdoor insights, interview process details by company)
- Coaching progress (which weaknesses have improved, which need more practice)
- Thank-you email templates (personalized per interview, tracked for follow-up timing)

## Reference

### STAR Method Template

| Component | Prompt | Length Target |
|---|---|---|
| Situation | Set the scene: when, where, what was happening | 1-2 sentences |
| Task | Your specific responsibility or challenge | 1 sentence |
| Action | What YOU did (use "I", not "we") | 3-5 sentences; most detail here |
| Result | What happened? Quantify if possible. What did you learn? | 1-3 sentences |

Total answer target: 90-120 seconds (about 200-250 words spoken)

### Common Behavioral Question Bank by Competency

| Competency | Example Question |
|---|---|
| Leadership | "Tell me about a time you led a team through a difficult situation." |
| Problem-solving | "Describe a time you solved a problem with limited resources." |
| Conflict resolution | "Tell me about a time you disagreed with a colleague or manager." |
| Failure recovery | "Tell me about your biggest professional failure and what you learned." |
| Teamwork | "Describe a time you had to work with someone very different from you." |
| Initiative | "Give me an example of a time you went beyond your job description." |
| Time management | "Tell me about a time you had to manage multiple competing priorities." |
| Adaptability | "Describe a time when your plans changed unexpectedly and how you responded." |

### Curveball Question Scripts

| Question | Strategy |
|---|---|
| "What's your biggest weakness?" | Real weakness + active improvement + evidence of progress |
| "Why are you leaving?" | Move toward opportunity, not away from frustration |
| "Where do you see yourself in 5 years?" | Growth within this field; ambition without claiming the interviewer's job |
| "Why should we hire you?" | 3 specific strengths tied to 3 specific job requirements |
| Salary expectations | "I'd like to learn more about the full scope first -- can you share the budgeted range?" |

### Smart Questions to Ask Interviewers

| Category | Question |
|---|---|
| Role clarity | "What does success look like in the first 90 days?" |
| Team dynamics | "How would you describe the team I'd be working with?" |
| Growth | "What growth opportunities exist for someone in this role?" |
| Culture | "What's something about working here that surprised you?" |
| Decision | "What are the next steps in your process?" |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.