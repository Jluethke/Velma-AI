# Anxiety Action Planner

Helps you figure out what's actually triggering your anxiety, build a personal coping toolkit that works for YOUR brain, and create grounding exercises you can use when things spiral. This isn't "just breathe" advice -- it's a structured approach to understanding your anxiety patterns, catching them early, and having specific tools ready before you need them. Designed for people who are tired of generic anxiety tips and want something they'll actually use. **Important: this is a self-help tool, not a substitute for professional mental health care. If you're in crisis, contact the 988 Suicide & Crisis Lifeline (call or text 988) or your local emergency services.**

## Execution Pattern: Phase Pipeline

```
PHASE 1: MAPPING       --> Identify your specific triggers, patterns, and anxiety signatures
PHASE 2: TOOLKIT       --> Build a personalized coping toolkit matched to your triggers
PHASE 3: GROUNDING     --> Create go-to grounding exercises for acute anxiety moments
PHASE 4: PREVENTION    --> Design daily habits that lower your baseline anxiety level
PHASE 5: EMERGENCY     --> Build a crisis protocol for when anxiety escalates beyond coping
```

## Inputs
- triggers: array -- What situations, thoughts, or environments tend to set off your anxiety (work deadlines, social events, health worries, uncertainty, conflict, etc.)
- symptoms: object -- How anxiety shows up for you physically (racing heart, tight chest, nausea, insomnia) and mentally (catastrophizing, rumination, avoidance, perfectionism paralysis)
- current_coping: array -- (Optional) What you've already tried -- what works, what doesn't, what you've abandoned
- severity: string -- (Optional) General sense of how much anxiety affects daily life: mild (annoying but manageable), moderate (regularly disrupts activities), severe (significantly limits daily functioning)
- preferences: object -- (Optional) What you're open to: breathing exercises, physical movement, journaling, meditation, cognitive techniques, sensory tools, social support

## Outputs
- trigger_map: object -- Your personal anxiety trigger inventory with patterns, early warning signs, and escalation timeline for each
- coping_toolkit: array -- 8-12 specific coping techniques matched to your triggers and preferences, organized by situation type
- grounding_exercises: array -- 5-7 grounding exercises you can do anywhere, with step-by-step instructions and when to use each
- daily_prevention_plan: object -- Morning and evening micro-routines (under 10 minutes each) to lower baseline anxiety
- crisis_protocol: object -- Step-by-step escalation plan for when anxiety spikes beyond normal coping

## Execution

### Phase 1: MAPPING
**Entry criteria:** At least 2-3 anxiety triggers or symptoms described.
**Actions:**
1. Build a trigger inventory. For each trigger, document: the situation or thought pattern, how often it occurs (daily, weekly, situational), the typical intensity (1-10), and what happens if you don't intervene. Most people have 3-7 primary triggers -- if the list is longer than 10, look for umbrella categories (e.g., "fear of judgment" covers multiple social situations).
2. Identify the anxiety signature for each trigger. Anxiety shows up differently depending on the trigger -- work deadline anxiety might be chest tightness and racing thoughts, while social anxiety might be nausea and avoidance. Map the physical and mental symptoms to each specific trigger.
3. Find the early warning signs. There's always a window between "first sign of anxiety" and "full spiral." Identify what happens in that window for each trigger: subtle body sensations (jaw clenching, shallow breathing, stomach flip), thought patterns (what-if loops, comparing yourself to others, mental rehearsal of worst case), and behavioral shifts (checking phone repeatedly, procrastinating, withdrawing).
4. Map the escalation timeline. How fast does each trigger go from "first sign" to "full anxiety"? Some are slow burns (health anxiety can build over days), others are flash floods (panic before public speaking). This determines which coping tools are realistic for each situation.
5. Identify any trigger chains -- situations where one trigger sets off another (e.g., work stress leads to insomnia, which leads to health anxiety, which leads to more work stress). These chains need to be interrupted at the earliest link.

**Output:** Personal anxiety trigger map with symptoms, early warning signs, escalation timelines, and trigger chains.
**Quality gate:** Each trigger has specific early warning signs identified. Escalation timelines are realistic. Trigger chains are documented.

### Phase 2: TOOLKIT
**Entry criteria:** Trigger map complete.
**Actions:**
1. Match coping techniques to trigger types. Different anxiety types respond to different interventions:
   - **Cognitive anxiety** (racing thoughts, catastrophizing, what-if loops): Cognitive defusion, thought records, worry scheduling, probability estimation
   - **Physical anxiety** (racing heart, tight chest, shaking): Breathing techniques, progressive muscle relaxation, cold exposure (cold water on wrists), bilateral stimulation
   - **Avoidance anxiety** (procrastination, escape urges): Exposure ladders, 5-minute commitments, behavioral activation, "opposite action"
   - **Social anxiety** (performance fear, judgment worry): Pre-event grounding, post-event processing (without rumination), attention refocusing outward
2. For each technique, provide: exact step-by-step instructions (not just "try deep breathing" -- which breathing pattern, for how long, when to use it), when it works best, when it doesn't work, and how long it takes to feel the effect.
3. Build a "first responder" list -- the 2-3 techniques that are fastest to deploy and work across the most triggers. These are the ones to memorize and practice first.
4. Create a "wrong tool" reference -- which techniques to NOT use for which situations. Example: deep breathing during a panic attack can sometimes increase hyperawareness and make it worse. Distraction techniques during chronic worry just delay the spiral.
5. Design a practice schedule. Coping techniques only work if practiced when you're NOT anxious. Set up a 2-week practice rotation: try each technique at least 3 times before deciding if it works for you.

**Output:** Personalized coping toolkit with 8-12 techniques, first responder list, wrong-tool warnings, and a 2-week practice schedule.
**Quality gate:** Every technique has specific step-by-step instructions. First responder list is limited to 2-3 techniques. Practice schedule is realistic (under 10 minutes per day).

### Phase 3: GROUNDING
**Entry criteria:** Coping toolkit built.
**Actions:**
1. Build a sensory grounding menu using the 5-4-3-2-1 technique as a foundation, then customize it. Standard version: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. Custom version: pick the senses that work best for you and go deeper (describe the texture, the specific shade of color, the pattern of the sound).
2. Create a physical grounding sequence for when you can't focus enough for cognitive techniques:
   - Press feet firmly into the floor and notice the pressure
   - Hold something cold (ice cube, cold drink) and focus on the temperature
   - Splash cold water on your face (activates the dive reflex, physically slows heart rate)
   - Do 10 wall push-ups or squeeze a stress ball as hard as you can for 10 seconds, then release
3. Design a "mental anchor" -- a specific detailed memory or image you can go to when overwhelmed. It should be a real, calm, multi-sensory memory (not just "a beach" but "the specific bench at the park where you sat on that Tuesday in October"). Practice recalling it in detail so it's easy to access under stress.
4. Build a portable grounding kit -- 3-5 physical items you can carry that engage different senses: a textured stone or fidget, a strong mint or ginger candy, a specific essential oil or scented hand lotion, a rubber band on the wrist for a gentle snap-and-release. Match items to the senses that ground you most effectively.
5. Create a verbal grounding script -- a series of self-talk phrases to use during acute anxiety. Not affirmations (those can feel fake during a spiral) but reality-anchoring statements: "I am in [location]. It is [time]. I am safe right now. This feeling is temporary. I have gotten through this before." Personalize the script to your specific anxiety lies.

**Output:** 5-7 grounding exercises with complete instructions, a portable grounding kit list, and a personalized verbal grounding script.
**Quality gate:** Every exercise can be done anywhere (including work meetings and public places). At least 2 exercises require no external tools. Verbal script addresses the person's specific anxious thoughts.

### Phase 4: PREVENTION
**Entry criteria:** Grounding exercises designed.
**Actions:**
1. Design a morning micro-routine (under 10 minutes) that lowers baseline anxiety for the day:
   - 2-minute body scan: check in with physical tension, consciously relax jaw, shoulders, hands
   - Quick anxiety forecast: what's on today's schedule that might trigger anxiety? Which tool will you use if it does?
   - One grounding exercise from Phase 3, practiced at low-anxiety to build muscle memory
2. Design an evening wind-down routine (under 10 minutes) to prevent anxiety from ruining sleep:
   - Brain dump: write down every unfinished thought, worry, or to-do onto paper (gets it out of the loop in your head)
   - Tomorrow's plan: pick the one most important thing for tomorrow so morning decision anxiety is lower
   - A physical relaxation technique (progressive muscle relaxation or body scan -- not screens)
3. Identify and reduce anxiety amplifiers in daily life:
   - Caffeine timing (no caffeine after 2pm; if anxiety is severe, reduce total intake gradually -- withdrawal makes anxiety worse, so don't quit cold turkey)
   - News and social media consumption patterns (set specific times, not infinite scroll)
   - Sleep debt (every hour of sleep debt increases anxiety sensitivity -- not optional, not a luxury)
   - Blood sugar crashes (eating irregularly makes anxiety physically worse)
4. Build in "worry windows" -- a specific 15-minute block each day where you're allowed to worry intentionally. Outside that window, write the worry down and save it for the window. Sounds weird, works surprisingly well -- it breaks the cycle of constant low-grade worry by giving it a container.
5. Set up weekly check-ins: rate overall anxiety for the week (1-10), note which triggers fired, which tools worked, and adjust the plan. Anxiety management is iterative -- what works in month 1 may need updating by month 3.

**Output:** Daily prevention plan with morning and evening routines, anxiety amplifier reduction list, worry window protocol, and weekly check-in template.
**Quality gate:** Routines are under 10 minutes each. Amplifier list is specific to this person's life. Weekly check-in is simple enough to actually do.

### Phase 5: EMERGENCY
**Entry criteria:** Prevention plan built.
**Actions:**
1. Define your personal escalation levels:
   - **Level 1 (Manageable):** Anxiety is present but you can function. Use toolkit techniques from Phase 2.
   - **Level 2 (Escalating):** Anxiety is disrupting focus or activities. Deploy grounding exercises from Phase 3 immediately. Remove yourself from triggering situation if possible.
   - **Level 3 (Overwhelm):** Can't think clearly, physical symptoms are intense, approaching or in panic. Use physical grounding only (cold water, pressure, movement). Don't try cognitive techniques -- your prefrontal cortex is offline.
   - **Level 4 (Crisis):** Persistent severe anxiety, panic attacks, inability to function, thoughts of self-harm. Contact support immediately -- therapist, crisis line, trusted person.
2. Build a support contact list: therapist (if applicable), 2-3 trusted people you can text or call when anxiety escalates, crisis line numbers (988 Lifeline, Crisis Text Line -- text HOME to 741741). Store these in your phone under "ICE" or a favorites group.
3. Create a panic attack protocol specifically for your symptoms: what to do in the first 30 seconds (stop fighting it -- resistance makes it worse), the next 2 minutes (physical grounding, slow exhale breathing -- 4 counts in, 7 counts out), and the next 10 minutes (ride the wave, it WILL pass, remind yourself this is adrenaline and not danger).
4. Write a post-episode recovery plan: what to do in the hour after a major anxiety episode to prevent the "anxiety about anxiety" cycle. Include: gentle movement, water, a safe activity (not screens), and explicit permission to rest without guilt.
5. Set a professional help threshold: define specific conditions that mean it's time to seek (or return to) professional support. Examples: anxiety prevents you from doing a specific activity 3+ times, sleep is disrupted more than 3 nights a week, you're using alcohol or substances to manage anxiety, or your toolkit isn't working after 4 weeks of consistent use.

**Output:** Personal escalation protocol with levels, support contact list template, panic attack protocol, post-episode recovery plan, and professional help threshold.
**Quality gate:** Escalation levels match the person's actual anxiety experience. Crisis resources are included. Professional help threshold is specific and measurable.

## Exit Criteria
Done when: (1) trigger map identifies specific triggers with early warning signs, (2) coping toolkit has 8-12 techniques with step-by-step instructions, (3) grounding exercises are portable and practiced, (4) daily prevention routines are under 10 minutes each, (5) emergency protocol covers all escalation levels including professional help thresholds.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| MAPPING | Person can't identify specific triggers ("I'm just always anxious") | Adjust -- start with a 1-week anxiety log: rate anxiety 3x daily and note what you were doing, thinking, and feeling. Patterns will emerge. |
| MAPPING | Triggers are trauma-related or deeply rooted | Escalate -- flag that trigger work on trauma should happen with a therapist (EMDR, CPT). Provide stabilization techniques only. |
| TOOLKIT | Person has tried "everything" and nothing works | Adjust -- audit what was actually tried vs. what was practiced consistently. Most techniques need 2-3 weeks of regular practice before they show results. |
| TOOLKIT | Anxiety is too severe for self-management techniques | Escalate -- recommend professional assessment. Severe anxiety often needs medication as a foundation before coping techniques can work. |
| GROUNDING | Person dissociates instead of feeling anxious | Adjust -- use activating grounding (cold water, strong tastes, movement) rather than calming grounding. Dissociation needs alertness, not relaxation. |
| PREVENTION | Person can't maintain daily routines | Adjust -- shrink to one 3-minute practice (body scan only). Consistency matters more than duration. Build up after 2 weeks. |
| EMERGENCY | Person is in crisis right now | Escalate immediately -- provide crisis resources (988, Crisis Text Line, local emergency services). Stabilize first, plan later. |

## State Persistence
- Trigger inventory with frequency and intensity trends over time
- Coping technique effectiveness ratings (what works, what doesn't, what's situational)
- Daily anxiety level tracking (1-10 ratings over weeks and months to spot trends)
- Grounding exercise usage log (which ones are used most and in which situations)
- Escalation history (how often Level 3+ episodes occur and what preceded them)
- Professional support timeline (when professional help was recommended or accessed)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
