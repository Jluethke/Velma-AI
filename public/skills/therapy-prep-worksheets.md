# Therapy Prep Worksheets

Makes every therapy session count by helping you prepare before, focus during, and follow through after. Therapy is expensive and time-limited -- most people walk in, spend 15 minutes catching up on the week, realize they forgot to mention the important thing, and leave. This skill gives you journal prompts to process between sessions, symptom tracking so you can show your therapist real data instead of vibes, and session goal-setting so you walk in with a plan. Designed for people who want to get more out of therapy without spending more on therapy. **Note: this is a preparation tool, not a substitute for professional mental health care. Always follow your therapist's guidance over any suggestions here.**

## Execution Pattern: Phase Pipeline

```
PHASE 1: ORIENTATION   --> Clarify what you want from therapy and what's not working
PHASE 2: TRACKING      --> Set up between-session symptom and mood tracking
PHASE 3: JOURNALING    --> Build a journal prompt system that surfaces the right material
PHASE 4: SESSION PREP  --> Create a pre-session worksheet for goal-setting and prioritization
PHASE 5: FOLLOW-THROUGH --> Design post-session action tracking and progress measurement
```

## Inputs
- therapy_type: string -- What kind of therapy: CBT, DBT, psychodynamic, EMDR, talk therapy, couples, don't know, or other
- frequency: string -- How often you see your therapist: weekly, biweekly, monthly
- current_goals: array -- (Optional) What you're working on in therapy: specific issues, diagnoses, life situations
- frustrations: array -- (Optional) What's not working: sessions feel unproductive, can't remember what to talk about, therapist doesn't know how bad things are, not making progress
- between_session_habits: object -- (Optional) What you currently do between sessions: nothing, journal sometimes, homework from therapist, overthink everything

## Outputs
- therapy_orientation: object -- Clear therapy goals, session structure preferences, and communication plan with therapist
- tracking_system: object -- Simple daily mood and symptom tracker customized to your specific issues
- journal_prompts: array -- 20-30 targeted prompts organized by theme, plus situational prompts triggered by specific events
- session_prep_worksheet: object -- One-page pre-session template with prioritized topics, evidence, and goals
- follow_through_system: object -- Post-session action items, homework tracking, and progress measurement over time

## Execution

### Phase 1: ORIENTATION
**Entry criteria:** Person is currently in therapy or about to start.
**Actions:**
1. Clarify therapy goals beyond "feel better." Get specific: what would be different in your life if therapy was working? Examples: "I'd be able to have a disagreement with my partner without shutting down," "I'd stop canceling plans because of anxiety," "I'd understand why I keep repeating the same relationship pattern." These become the yardsticks for measuring progress.
2. Assess current session effectiveness. How much of your session time is spent on:
   - Catching your therapist up on the week (should be under 10 minutes)
   - Processing specific events or emotions (the core work)
   - Learning or practicing new skills/techniques
   - Sitting in silence because you don't know what to say
   - Talking about things that feel safe but aren't really the issue
   Identify where time is being wasted and where it should be redirected.
3. Identify the "real topic avoidance" pattern. Most people in therapy have one thing they need to talk about but keep circling around. It's the thing that makes your chest tighten when you think about saying it out loud. Name it -- even if only to yourself for now. The prep system will help you build toward bringing it up.
4. Map your therapy communication style: do you over-explain to avoid silence, minimize problems ("it's not that bad"), intellectualize emotions (talk about feelings without feeling them), or people-please your therapist (telling them what you think they want to hear)? Knowing your pattern helps you catch it in session.
5. Draft a "therapy contract" for yourself: how you want to show up (honest, prepared, willing to be uncomfortable), what you need from your therapist (direct feedback, gentle approach, homework, no homework), and permission to say "that's not working for me" if a technique or topic feels wrong.

**Output:** Specific therapy goals, session time audit, avoidance pattern identified, communication style mapped, and personal therapy contract.
**Quality gate:** Goals are specific and measurable (not "feel better" but observable changes). At least one avoidance topic is named.

### Phase 2: TRACKING
**Entry criteria:** Therapy orientation complete.
**Actions:**
1. Build a daily mood and symptom tracker customized to the person's specific issues. Not a generic "rate your mood 1-10" -- instead, track the specific things that matter to therapy:
   - For anxiety: anxiety level, number of avoidance behaviors, panic symptoms, sleep quality
   - For depression: energy level, social contact, activities completed, appetite, sleep hours
   - For relationship issues: conflict frequency, communication quality, emotional reactivity level
   - For trauma: flashback/intrusion frequency, hypervigilance level, avoidance behaviors, dissociation episodes
2. Design the tracker to take under 2 minutes. If it takes longer, you won't do it. Three to five items, rated on a simple scale, at the same time each day (evening works best for most people). Use whatever format sticks: notes app, paper, spreadsheet, dedicated app.
3. Add a daily "notable events" one-liner -- not a journal entry, just a quick flag: "argument with mom," "good day at work," "didn't sleep," "avoided the grocery store." This gives your therapist context for the numbers.
4. Create a weekly pattern review template: at the end of each week, look at the data. What day was worst? What day was best? Is there a pattern (weekends are worse, Mondays spike anxiety, Thursdays are reliably okay)? These patterns are gold for therapy.
5. Build a "bring to session" summary that auto-generates from the tracking: highest and lowest days, average scores, notable events, and any patterns you noticed. This replaces the 15-minute "how was your week" recap with actual data.

**Output:** Custom daily tracker (3-5 items, under 2 minutes), weekly pattern review template, and session summary format.
**Quality gate:** Tracker takes under 2 minutes. Items are specific to this person's therapy goals. Weekly review takes under 5 minutes.

### Phase 3: JOURNALING
**Entry criteria:** Tracking system set up.
**Actions:**
1. Build a core prompt library of 20-30 journaling prompts organized by therapeutic theme:
   - **Self-awareness:** "What emotion am I avoiding right now and why?" / "What story am I telling myself about [situation] and is it the full truth?" / "When did I first learn to react this way?"
   - **Patterns:** "I noticed I did [behavior] again. What was I feeling right before?" / "This situation reminds me of ___" / "The last time I felt this way was ___"
   - **Growth:** "Something I handled differently this week than I would have 6 months ago" / "A boundary I held (or wish I'd held)" / "What would I tell a friend in this situation?"
   - **Hard stuff:** "The thing I haven't told my therapist yet is ___" / "I'm protecting myself from feeling ___" / "If I were completely honest, what I actually want is ___"
2. Create situational prompts -- not used on a schedule, but triggered by specific events:
   - After a conflict: "What was the trigger? What did I feel in my body? What did I do? What did I want to do instead?"
   - After avoidance: "What did I avoid? What was the feared outcome? How likely was that outcome really? What did avoidance cost me?"
   - After a good day: "What was different about today? What contributed to this feeling? How can I create more of this?"
   - After a therapy session: "What landed today? What am I sitting with? What do I want to explore next time?"
3. Set a sustainable journaling rhythm. Daily journaling burns out most people in 2 weeks. Better: 3-4 times per week, 10-15 minutes, using a prompt from the library or writing freely if something is alive. The night before therapy is non-negotiable -- this is the session prep journal entry.
4. Create a "therapy nuggets" capture system -- a quick way to save insights, quotes, or realizations that happen between sessions. These vanish if not captured. A running note on your phone, voice memos, or a dedicated section in your journal. Label each with the date so you can reference it in session.
5. Build a review protocol: before each session, scan the last week's journal entries and therapy nuggets. Highlight 2-3 things worth bringing up. This is the bridge between journaling and session prep.

**Output:** 20-30 prompt library organized by theme, situational prompt triggers, journaling schedule, therapy nuggets capture system, and pre-session review protocol.
**Quality gate:** Prompts are specific enough to generate real material (not "how do you feel?"). Schedule is sustainable (not daily). Pre-session review takes under 10 minutes.

### Phase 4: SESSION PREP
**Entry criteria:** Journaling system established.
**Actions:**
1. Design a one-page pre-session worksheet to complete the night before or morning of therapy:
   - **Top priority:** The one thing you most need to discuss today (be specific -- not "anxiety" but "the panic attack I had Wednesday at the grocery store")
   - **Supporting data:** Tracking summary for the period, relevant journal entries or nuggets, any specific examples or evidence
   - **Secondary topics:** 2-3 other things to mention if time allows, ranked by importance
   - **Homework check:** Did you complete any between-session assignments? What happened?
   - **The hard question:** Is there something you've been avoiding bringing up? (Just naming it on paper makes it easier to say out loud)
2. Create a "session opening" script -- the first 2-3 sentences you'll say when the session starts. This prevents the "so how are you" drift. Example: "This week I want to focus on [priority]. I tracked my [symptoms] and noticed [pattern]. The thing I've been avoiding talking about is [hard thing]."
3. Build a goal-setting framework for each session. Not every session needs a big goal. Three types:
   - **Processing session:** "I need to talk through [event/feeling] and understand it better"
   - **Skill-building session:** "I want to learn/practice a specific technique for [situation]"
   - **Exploration session:** "I don't know what I need -- I want to follow the thread on [vague feeling/pattern]"
   Naming the type helps both you and your therapist use the time well.
4. Include a "courage rating" -- how willing are you to be uncomfortable today, on a scale of 1-5? This honest self-assessment helps you pace yourself. A courage-1 day is fine -- you can still make progress. A courage-5 day is when to tackle the hard thing.
5. Add a "what I need from my therapist today" line: direct feedback, gentle exploration, skill teaching, just listening, help connecting dots, reality check. Therapists aren't mind readers -- telling them what you need gets you better sessions.

**Output:** One-page pre-session worksheet template, session opening script framework, session type classifications, and therapist communication prompts.
**Quality gate:** Worksheet fits one page. Completion time is under 15 minutes. Hard question is always included. Opening script prevents session drift.

### Phase 5: FOLLOW-THROUGH
**Entry criteria:** Session prep system established.
**Actions:**
1. Create a post-session capture template to complete within 2 hours of your session (before the insights fade):
   - What was the most important thing discussed?
   - What insight or realization landed?
   - What homework or between-session practice was assigned?
   - What felt unfinished or needs more time next session?
   - How do you feel right now (sometimes sessions stir up difficult feelings -- naming them helps)?
2. Build a homework tracking system. Therapy homework only works if you actually do it (groundbreaking insight, I know). For each assignment:
   - What specifically am I supposed to do?
   - When and how often?
   - What's the point of this exercise? (Understanding the why dramatically increases follow-through)
   - What's my plan for when I don't feel like doing it? (Because you won't. Plan for that.)
3. Design a progress measurement system that goes beyond "do I feel better yet?" Track:
   - Therapy goals from Phase 1: are the specific observable changes happening?
   - Symptom tracking trends: are the numbers moving over months (not days)?
   - Behavioral changes: am I doing things differently than I was 3 months ago?
   - Insight accumulation: what do I understand now that I didn't before?
4. Create a "therapy relationship check" to do monthly: is this therapist still the right fit? Are you being honest with them? Do you feel heard? Are you making progress on your actual goals or getting sidetracked? If the answer to any of these is consistently "no," it's time for a conversation with your therapist about it -- or a referral.
5. Build a session-to-session continuity bridge: the last entry in each post-session capture becomes the first item reviewed in the next pre-session prep. This creates a continuous thread that prevents the "starting over every session" problem.

**Output:** Post-session capture template, homework tracking system, progress measurement framework, monthly therapy relationship check, and session continuity bridge.
**Quality gate:** Post-session capture takes under 10 minutes. Homework tracking includes the "when I don't feel like it" plan. Progress measurement includes specific behavioral indicators, not just feelings.

## Exit Criteria
Done when: (1) therapy goals are specific and measurable, (2) daily tracking system takes under 2 minutes, (3) journal prompt library has 20+ prompts organized by theme, (4) pre-session worksheet is one page and takes under 15 minutes, (5) post-session system captures insights, tracks homework, and measures progress.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ORIENTATION | Person isn't sure therapy is helping at all | Adjust -- build a 4-session evaluation period using the tracking system. If no measurable progress after 4 sessions with prep, discuss with therapist or consider a different therapist/modality. |
| ORIENTATION | Person is starting therapy for the first time and doesn't know what to expect | Adjust -- provide a "therapy 101" overview: what to expect in the first session, what types of therapy exist, how to evaluate if the therapist is a good fit. |
| TRACKING | Person finds tracking triggering or obsessive | Adjust -- reduce to 1 item tracked, or switch to qualitative only (one sentence per day). For people with OCD tendencies, tracking can become a compulsion -- monitor this. |
| JOURNALING | Person hates writing / can't journal | Adjust -- offer alternatives: voice memos, drawing, bullet points, or talking to yourself on a walk. The medium doesn't matter; the reflection does. |
| SESSION PREP | Person over-prepares and script-controls the session | Adjust -- limit prep to 3 bullet points max. Therapy needs room for the unexpected. The worksheet is a guide, not a rigid agenda. |
| FOLLOW-THROUGH | Person doesn't do homework between sessions | Adjust -- discuss with therapist. Either the homework isn't the right fit, the barriers weren't addressed, or the person needs accountability support. Don't add shame. |
| FOLLOW-THROUGH | Person is doing everything "right" but not improving | Escalate -- after 3+ months of consistent engagement with no improvement, flag for treatment review: medication evaluation, different therapy modality, assessment for conditions that mimic or complicate depression/anxiety. |

## State Persistence
- Therapy goal tracking with progress indicators over months
- Session prep worksheets archive (looking back shows patterns across sessions)
- Mood and symptom tracking trends with session dates overlaid
- Homework completion rates and which types of exercises actually help
- Journal entry themes over time (what keeps coming up)
- Therapist fit evaluations and any changes made

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
