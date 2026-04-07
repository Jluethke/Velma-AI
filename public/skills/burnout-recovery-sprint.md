# Burnout Recovery Sprint

Helps you recognize what stage of burnout you're actually in, build a realistic recovery plan, renegotiate your workload without tanking your career, and rebuild the boundaries that got demolished along the way. This isn't "take a bubble bath" advice -- burnout is a systemic problem that requires systemic changes. You can't self-care your way out of a 60-hour work week with a toxic manager. This skill is honest about what you can change, what you need help changing, and what might require walking away. Designed for people who are running on fumes and know something has to give.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESSMENT    --> Identify your burnout stage and what's actually driving it
PHASE 2: TRIAGE        --> Stop the bleeding with immediate load reduction
PHASE 3: NEGOTIATE     --> Renegotiate workload, boundaries, and expectations with others
PHASE 4: REBUILD       --> Restore energy, motivation, and engagement sustainably
PHASE 5: FIREPROOFING  --> Build systems that prevent burnout from recurring
```

## Inputs
- work_situation: object -- Your job/role, hours, workload, relationship with manager/team, how long you've been feeling this way, any recent changes (new role, reorg, layoffs, increased demands)
- symptoms: object -- What you're experiencing: exhaustion (physical, emotional, mental), cynicism or detachment, reduced performance, health impacts (sleep, appetite, getting sick more), emotional changes (irritability, apathy, dread)
- life_context: object -- (Optional) What else is going on: caregiving, relationship stress, financial pressure, health issues. Burnout rarely exists in a work vacuum.
- boundaries_status: object -- (Optional) Current boundary situation: saying yes to everything, working evenings/weekends, checking email 24/7, unable to delegate, taking on others' work
- recovery_constraints: object -- (Optional) What's realistic: can you take time off, can you change roles, can you afford to quit, do you have support, is the job itself salvageable

## Outputs
- burnout_assessment: object -- Your burnout stage with specific symptoms mapped to causes
- triage_plan: object -- Immediate actions (this week) to stop the worst energy drains
- negotiation_playbook: object -- Scripts and strategies for workload conversations with managers, colleagues, and clients
- recovery_plan: object -- 4-8 week graduated recovery plan with specific energy restoration activities
- fireproofing_system: object -- Boundary frameworks, workload monitoring, and early warning systems

## Execution

### Phase 1: ASSESSMENT
**Entry criteria:** Person describes burnout symptoms or work exhaustion.
**Actions:**
1. Identify the burnout stage using the Maslach framework (the actual research, not the Instagram version):
   - **Stage 1 - Honeymoon stress:** Still engaged but working unsustainably. Sleep starts slipping, you're "just pushing through this busy period" (that never ends). Energy is still there but it's forced.
   - **Stage 2 - Onset:** Performance requires more effort. Cynicism creeps in. You start avoiding certain tasks or people. Physical symptoms appear: headaches, stomach issues, getting sick more often. Social life shrinks because you "don't have the energy."
   - **Stage 3 - Chronic:** Exhaustion is constant. Apathy about work you used to care about. Increased errors. Emotional numbness or explosiveness. Using more caffeine, alcohol, food, or screens to cope. Feeling trapped.
   - **Stage 4 - Crisis:** Can't function normally. Depression and anxiety overlap. Physical health deteriorating. Thinking about quitting daily. Dread about Monday starts on Friday. May have panic attacks or emotional breakdowns.
   - **Stage 5 - Enmeshment:** Burnout has become your normal. You've forgotten what not-burned-out feels like. Identity is fused with the exhaustion. This stage often requires professional help and possibly leave/job change.
2. Map the specific burnout drivers. Burnout has three components, and different drivers hit different ones:
   - **Exhaustion drivers:** Overwork, insufficient recovery time, poor sleep, physical demands, emotional labor
   - **Cynicism drivers:** Lack of autonomy, unfair treatment, values mismatch, toxic culture, feeling invisible
   - **Inefficacy drivers:** Unclear expectations, impossible standards, no feedback, skills mismatch, moving goalposts
3. Separate what's organizational from what's personal. Some burnout is caused by a broken workplace (understaffing, bad management, toxic culture). Some is caused by personal patterns (perfectionism, inability to delegate, people-pleasing, tying identity to productivity). Usually it's both. The distinction matters because the solutions are different.
4. Calculate the "sustainability gap" -- the difference between what's being demanded of you (or what you're demanding of yourself) and what's actually sustainable. Be specific: hours per week, number of projects, emotional labor load, recovery time available vs. needed.
5. Assess the recovery constraints honestly: can you take time off (and will you actually rest or just worry)? Is the job salvageable with changes or is the structure inherently burnout-producing? Can you afford a transition period? Do you have support? This determines whether the plan is "fix this job" or "survive while planning an exit."

**Output:** Burnout stage classification, specific driver mapping across exhaustion/cynicism/inefficacy, organizational vs. personal pattern breakdown, sustainability gap calculation, and recovery constraint assessment.
**Quality gate:** Stage is specifically identified with evidence. Drivers are mapped to the three burnout components. Sustainability gap is quantified (hours, projects, etc.).

### Phase 2: TRIAGE
**Entry criteria:** Burnout assessment complete.
**Actions:**
1. Identify the top 3 energy drains that can be reduced THIS WEEK. Not next quarter, not after the big project -- this week. Examples:
   - Stop checking email after 7pm (set an auto-responder if needed)
   - Cancel or delegate one meeting per day
   - Say no to one new request (use the scripts from Phase 3)
   - Take your actual lunch break away from your desk
   - Leave on time twice this week (not every day -- start with twice)
2. Create an "energy audit" of your current weekly schedule. For every major time block, rate it: energy-giving (+), energy-neutral (0), or energy-draining (-). The goal is to see the ratio. Most burned-out people have 80%+ draining activities. Even small shifts toward balance help.
3. Implement emergency recovery basics -- the non-negotiable physical foundations that burnout has probably destroyed:
   - Sleep: set a non-negotiable bedtime that allows 7+ hours. Everything else adjusts around this.
   - Movement: 15-20 minutes of any physical activity daily. Not training for a marathon -- a walk counts.
   - Food: eat real meals at regular times. Burnout survivors live on coffee, takeout, and snacks at their desk.
   - One thing that isn't work or recovery: 20 minutes of something you used to enjoy. Even if you don't enjoy it right now. This is behavioral activation for burnout.
4. Identify what can be dropped, delegated, or delayed RIGHT NOW without catastrophe:
   - **Drop:** Things you're doing that literally no one asked for or that don't matter as much as you think they do
   - **Delegate:** Tasks someone else could do at 80% of your quality (and 80% is fine)
   - **Delay:** Deadlines that are artificial urgency, not actual urgency
5. Set a one-week "burnout circuit breaker": for the next 7 days, you're in recovery mode. This means minimum viable work output, maximum recovery. It's not sustainable forever, but it stops the freefall. Give yourself explicit permission.

**Output:** Top 3 immediate energy drain reductions, weekly energy audit, emergency recovery basics, drop/delegate/delay list, and one-week circuit breaker plan.
**Quality gate:** Triage actions are implementable this week. Recovery basics are specific (not "get more sleep" but "in bed by 10:30pm"). Drop/delegate/delay list has specific items, not categories.

### Phase 3: NEGOTIATE
**Entry criteria:** Triage implemented.
**Actions:**
1. Prepare for the workload conversation with your manager (or whoever controls your workload). Frame it as a sustainability and quality issue, not a complaint:
   - **Script:** "I want to keep doing good work here, and I need to be honest that the current workload isn't sustainable. I'd like to talk about priorities so I can focus on what matters most and deliver quality on those things, rather than spreading thin across everything."
   - Do NOT say: "I'm burned out" (sounds like weakness), "I can't handle it" (sounds like incompetence), or "this isn't fair" (sounds like complaining). Fair or not, frame it as problem-solving.
2. Come to the conversation with a prioritized list:
   - Here's everything on my plate (most managers don't actually know your full workload)
   - Here's what I recommend as top priority (shows judgment, not just complaining)
   - Here's what I suggest delaying or reassigning (with reasoning)
   - Here's what I need to deliver quality: realistic timelines, clearer expectations, resources, or coverage
3. Set new boundaries with specific language:
   - Email: "I'll be responsive during work hours. For evening/weekend emergencies, text me -- otherwise I'll respond the next business day."
   - Meetings: "I need to block [time period] for focused work. I can attend meetings outside that window."
   - New requests: "I can take that on if we deprioritize [other thing]. Which would you prefer?"
   - Scope creep: "That's outside the original scope. I want to make sure we're aligned on priorities before I add it to my plate."
4. Handle the "everyone is stretched" pushback. If the response is "we're all busy, just push through":
   - Option 1: Escalate with data: "I understand. Here's my capacity vs. current demands. Something will drop -- I'd rather we choose what than have it be random."
   - Option 2: Protect yourself unilaterally: implement boundaries anyway without announcing them. Just start leaving on time. Just stop answering weekend emails. Many managers won't even notice.
   - Option 3: If the culture is genuinely toxic and change is impossible, start planning your exit while protecting your health in the meantime.
5. Negotiate recovery time. If you're in Stage 3+, you may need actual time off, not just better boundaries:
   - PTO: even 3-4 days of genuine rest (not staycation-errands) can interrupt the burnout cycle
   - Reduced schedule temporarily: some companies allow 4-day weeks or partial remote for recovery
   - Mental health leave: if you're in Stage 4-5, this may be medically appropriate. Talk to your doctor.

**Output:** Manager conversation script with framing, prioritized workload list template, boundary language for specific situations, pushback response strategies, and recovery time negotiation approaches.
**Quality gate:** Scripts are realistic for professional settings. Framing is solution-oriented, not victim-oriented. Pushback scenarios are addressed. Exit planning is acknowledged if needed.

### Phase 4: REBUILD
**Entry criteria:** Workload negotiated or boundaries implemented.
**Actions:**
1. Design a 4-8 week graduated recovery plan. Burnout recovery is not a weekend -- it takes weeks to months. The plan has three phases:
   - **Weeks 1-2:** Stabilize. Focus on sleep, food, movement, and minimum viable work. Energy will still be low. This is the "stop digging" phase.
   - **Weeks 3-5:** Rebuild. Gradually reintroduce one enjoyable activity per week. Increase social connection. Start noticing moments of engagement or interest -- they're the green shoots of recovery.
   - **Weeks 6-8:** Reengage. Selectively increase workload (within new boundaries). Experiment with what parts of work still interest you. If nothing does, this is diagnostic information.
2. Rebuild motivation from the ground up using the Self-Determination Theory framework:
   - **Autonomy:** Where in your life do you have choice? Start there. Even small choices (what to eat for lunch, which task to do first) rebuild agency that burnout destroyed.
   - **Competence:** Do one thing you're good at, purely for the satisfaction of doing it well. Not for work, not for productivity -- just because mastery feels good. Cook a perfect meal. Fix something. Solve a puzzle.
   - **Connection:** Reconnect with one person who energizes you (not drains you). Have one conversation that isn't about work or how tired you are.
3. Address the identity piece. If your self-worth is entirely tied to productivity, burnout recovery feels like an identity crisis. Explore: who are you when you're not producing? What did you care about before this job consumed you? This isn't fluff -- it's the difference between recovering and just recharging before the next burnout.
4. Monitor for depression overlap. Burnout and depression share symptoms (exhaustion, apathy, social withdrawal, concentration problems). If recovery behaviors aren't moving the needle after 3-4 weeks, depression may be a factor -- and depression needs professional treatment, not just boundary-setting.
5. Rebuild physical resilience that burnout depleted. Chronic stress damages the body: cortisol dysregulation, inflammation, immune suppression. Recovery includes: consistent sleep schedule, regular moderate exercise (not intense -- stress hormones are already elevated), reducing alcohol and caffeine, and if possible, getting bloodwork done (check thyroid, vitamin D, B12, iron -- burnout masks deficiency symptoms).

**Output:** 4-8 week graduated recovery plan, motivation rebuilding activities organized by autonomy/competence/connection, identity exploration prompts, depression screening criteria, and physical resilience rebuilding checklist.
**Quality gate:** Recovery plan is graduated (not everything at once). Identity work is included. Depression overlap is flagged with professional referral criteria.

### Phase 5: FIREPROOFING
**Entry criteria:** Recovery plan in progress.
**Actions:**
1. Build a workload monitoring system -- a simple weekly check that catches overcommitment before it becomes burnout:
   - Count current active projects/commitments every Friday
   - Rate energy level (1-10) and compare to last week
   - Track hours worked (actual hours, not official hours)
   - Set a hard ceiling: "I will not regularly exceed [X] hours or [Y] active projects"
2. Create boundary maintenance rules that are specific and enforceable:
   - The "one in, one out" rule: you can't add a new commitment without removing or completing one
   - The "72-hour rule": no saying yes to new requests for 72 hours (say "let me check my capacity and get back to you")
   - The "calendar audit": one Sunday a month, review the coming month. Is it sustainable? What needs to move?
   - The "body check": if you start getting headaches, stomach issues, or your sleep slides, that's your body's warning light -- don't ignore it this time
3. Develop a personal burnout early warning system with three alert levels:
   - **Green:** Manageable stress, recovering well, enjoying some work, maintaining boundaries
   - **Yellow:** Starting to slip: working late more, canceling personal plans, sleep worsening, irritability increasing. Action: implement triage plan from Phase 2 immediately.
   - **Red:** Full burnout symptoms returning. Action: activate complete recovery protocol, have the workload conversation again, and consider whether this environment is chronically incompatible with your health.
4. Address the personal patterns that contributed:
   - **Perfectionism:** Define "good enough" for each type of work. Write it down. Reference it when the urge to over-deliver hits.
   - **People-pleasing:** Practice the "I can't, but here's what I can do" response. No is a complete sentence, but offering an alternative feels easier at first.
   - **Identity fusion with work:** Deliberately invest in non-work identity: hobbies, relationships, community, physical practice. These need to exist independently of your job.
5. Plan for the inevitable high-demand periods. Crunch time happens. The difference between sustainable crunch and burnout: sustainable crunch has a defined end date, recovery time is scheduled afterward, and it doesn't happen more than 2-3 times per year. If "crunch" is the normal state, the workload is wrong, not your resilience.

**Output:** Weekly workload monitoring template, boundary maintenance rules, three-level early warning system, personal pattern intervention strategies, and high-demand period protocol.
**Quality gate:** Monitoring system takes under 5 minutes per week. Warning system has specific symptoms at each level with specific actions. Personal patterns are addressed with specific behavioral strategies, not just awareness.

## Exit Criteria
Done when: (1) burnout stage and drivers are identified, (2) immediate triage stops the worst energy drains this week, (3) workload negotiation scripts and boundary language are ready, (4) graduated recovery plan spans 4-8 weeks with specific activities, (5) fireproofing system monitors workload and catches early warning signs.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESSMENT | Person is in Stage 5 (enmeshed burnout with depression) | Escalate -- recommend professional support (therapist, psychiatrist, doctor). This level typically requires medical leave and/or medication. Self-help alone is insufficient. |
| TRIAGE | Person literally cannot reduce anything ("I'll get fired") | Adjust -- focus exclusively on recovery basics (sleep, food, movement) and micro-boundaries that are invisible to management. Simultaneously start exit planning. |
| NEGOTIATE | Manager is the primary cause of burnout | Adjust -- skip the collaborative conversation. Implement boundaries unilaterally. Document everything. Explore internal transfer or external options. |
| NEGOTIATE | Person is self-employed or a caregiver (no manager to negotiate with) | Adjust -- the negotiation is with yourself and your clients/responsibilities. Use the same frameworks but adapted: which clients to fire, which tasks to outsource, where to ask for help. |
| REBUILD | No motivation returns after 4+ weeks of recovery behaviors | Escalate -- screen for clinical depression. Burnout and depression overlap but depression requires different treatment. Recommend professional assessment. |
| FIREPROOFING | Person recovers but returns to the same patterns within 3 months | Adjust -- the personal patterns section needs deeper work, likely with a therapist or coach. Awareness alone doesn't change deeply ingrained patterns like perfectionism or people-pleasing. |

## State Persistence
- Burnout stage assessment over time (tracking movement between stages)
- Weekly energy levels and hours worked (trending toward sustainability or away from it)
- Boundary adherence tracking (which boundaries hold, which keep getting crossed)
- Recovery plan compliance and energy restoration progress
- Workload monitoring data (projects, hours, energy trajectory)
- Warning system activations and what interventions were used

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
