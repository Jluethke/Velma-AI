# Sleep Recovery Protocol

Fixes your broken sleep by combining sleep hygiene fundamentals, circadian rhythm resetting, and honest guidance on supplements and medications -- without the usual "just put your phone down" lecture. Insomnia is a beast with multiple heads: sometimes it's behavioral, sometimes it's anxiety, sometimes it's your body clock is wrecked, and sometimes it's all three. This skill figures out WHY you can't sleep and builds a protocol targeted at your specific sleep problem. Designed for people who've already tried "just relax" and need an actual system. **Note: persistent insomnia can have medical causes (sleep apnea, thyroid issues, medication side effects). If you've had sleep problems for more than 3 months, see a doctor. This is not medical advice.**

## Execution Pattern: Phase Pipeline

```
PHASE 1: DIAGNOSIS     --> Figure out what kind of sleep problem you actually have
PHASE 2: ENVIRONMENT   --> Optimize your physical sleep environment and pre-sleep routine
PHASE 3: RHYTHM        --> Reset your circadian clock with light, timing, and consistency
PHASE 4: MIND          --> Address the racing thoughts, anxiety, and hyperarousal that keep you up
PHASE 5: SUPPLEMENTS   --> Honest guide to what helps, what's placebo, and when to talk to a doctor
```

## Inputs
- sleep_problem: object -- What's happening: can't fall asleep, can't stay asleep, wake up too early, sleep but don't feel rested, all of the above. How long this has been going on. What time you go to bed and wake up.
- sleep_environment: object -- (Optional) Bedroom setup: temperature, light levels, noise, who/what else is in the bed (partner, pets, kids), screen situation
- lifestyle_factors: object -- (Optional) Caffeine intake (amount and timing), alcohol use, exercise habits, work schedule (shift work, travel, irregular hours), stress level
- current_attempts: array -- (Optional) What you've tried: melatonin, sleep apps, blackout curtains, medication, nothing, everything
- medical_context: object -- (Optional) Relevant medical info: medications that affect sleep, mental health conditions, chronic pain, sleep apnea diagnosis/suspicion, pregnancy

## Outputs
- sleep_diagnosis: object -- Your specific sleep problem type with likely contributing factors ranked by impact
- environment_protocol: object -- Room-by-room changes, pre-sleep routine, and environment optimization checklist
- circadian_reset_plan: object -- Light exposure schedule, sleep-wake timing protocol, and adjustment timeline
- mind_protocol: object -- Specific techniques for racing thoughts, sleep anxiety, and hyperarousal with step-by-step instructions
- supplement_guide: object -- Evidence-based supplement and medication guidance with dosing, timing, and honest efficacy ratings

## Execution

### Phase 1: DIAGNOSIS
**Entry criteria:** Person has described their sleep problem.
**Actions:**
1. Classify the sleep problem type:
   - **Sleep onset insomnia:** Can't fall asleep (lying awake 30+ minutes). Usually anxiety-driven, circadian-driven, or hyperarousal.
   - **Sleep maintenance insomnia:** Fall asleep fine, wake up at 2-4am and can't get back to sleep. Often stress, alcohol, blood sugar, or age-related.
   - **Early morning awakening:** Wake up hours before the alarm, alert but exhausted. Can signal depression, cortisol issues, or circadian phase advance.
   - **Non-restorative sleep:** Sleeping enough hours but waking up exhausted. Possible sleep apnea, poor sleep architecture, or chronic stress.
   - **Delayed sleep phase:** Can sleep fine, just not at normal hours. Body clock is shifted late. Common in younger adults.
   - **Mixed:** Multiple types. Very common. Treat in order of severity.
2. Identify the top contributing factors by reviewing lifestyle and medical context:
   - Caffeine (half-life is 5-7 hours -- a 3pm coffee is still half-active at 10pm)
   - Alcohol (helps you fall asleep, destroys sleep quality in the second half of the night)
   - Screen light exposure within 2 hours of bed
   - Irregular sleep schedule (different bed/wake times daily)
   - Exercise timing (too close to bed revs up the nervous system)
   - Medications (SSRIs, steroids, beta-blockers, decongestants all affect sleep)
   - Mental health (anxiety and depression are the most common causes of chronic insomnia)
   - Environment (too hot, too bright, too noisy, uncomfortable mattress)
3. Assess how much of this is behavioral vs. physiological. Behavioral insomnia (bad habits, poor timing, screen use) responds well to sleep hygiene changes. Physiological insomnia (anxiety-driven hyperarousal, circadian disorder, sleep apnea) needs more targeted intervention.
4. Check for "conditioned insomnia" -- when your brain has learned to associate bed with being awake. If you spend significant time in bed not sleeping (reading, scrolling, worrying, watching TV), your brain now treats bed as a waking environment. This is the #1 maintainer of chronic insomnia.
5. Establish a sleep baseline: average time to fall asleep, average number of wake-ups, average total sleep hours, sleep quality rating (1-10), and the latest time you feel fully alert during the day. This baseline measures progress.

**Output:** Sleep problem classification, ranked contributing factors, behavioral vs. physiological assessment, conditioned insomnia check, and sleep baseline metrics.
**Quality gate:** Sleep type is specifically identified. Contributing factors are ranked, not just listed. Conditioned insomnia is assessed.

### Phase 2: ENVIRONMENT
**Entry criteria:** Sleep diagnosis complete.
**Actions:**
1. Optimize the bedroom for sleep and nothing else (or sleep and sex -- that's the only exception):
   - **Temperature:** 65-68°F (18-20°C) is the physiological sweet spot. Your body needs to drop 2-3°F core temperature to initiate sleep. If you can't control room temperature, use a fan, light blankets, or wear socks (warm feet help the body dump core heat faster -- counterintuitive but true).
   - **Light:** Total darkness matters more than people think. Even dim light through eyelids suppresses melatonin. Blackout curtains or a sleep mask. Cover LED indicator lights on electronics with black tape.
   - **Sound:** Consistent background noise (fan, white noise machine) is better than silence in most environments because it masks disruptions. If partner snores, address this -- it's a sleep environment problem, not just an annoyance.
   - **Bed association:** If you've been using your bed for work, scrolling, or lying awake worrying, the association is broken. You may need to temporarily do the "get up after 20 minutes" rule (see Phase 4).
2. Build a pre-sleep wind-down routine -- 30-60 minutes before target bedtime:
   - Hard stop on screens (or at minimum, blue light filters + brightness at lowest setting + no stimulating content)
   - Dim all house lights. Bright bathroom lights during teeth brushing can suppress melatonin -- use a nightlight or hall light instead.
   - Choose a specific sequence of calming activities: stretch, read a physical book, listen to a podcast, light hygiene routine. The same sequence each night builds a Pavlovian sleep cue.
3. Address the partner/pet/kid situation honestly:
   - Partner has different sleep schedule: consider different bedtimes (you don't have to go to bed at the same time)
   - Pet in bed: if the pet wakes you up, the pet needs to sleep elsewhere (controversial, I know, but sleep is not optional)
   - Kid co-sleeping: if it works for everyone, fine. If it destroys your sleep, a gradual transition plan is needed.
4. Audit stimulants and substances by timing:
   - Caffeine: last intake 8-10 hours before bed (yes, really. 6 hours isn't enough for many people)
   - Alcohol: if used, finish 3+ hours before bed. Even then, sleep quality suffers.
   - Nicotine: stimulant. Avoid within 2 hours of bed.
   - Cannabis: may help fall asleep but reduces REM sleep and can create dependency for sleep onset
   - Heavy meals: finish 2-3 hours before bed. Light snack is fine.
5. Create a bedroom checklist to complete each night: temperature set, lights blocked, phone on charger outside arm's reach (or in another room), white noise on, wind-down routine complete. Make it automatic.

**Output:** Environment optimization checklist, pre-sleep wind-down routine, partner/pet/kid situation plan, substance timing guide, and nightly bedroom checklist.
**Quality gate:** Temperature recommendation is specific. Light blocking is addressed. Substance timing accounts for individual half-lives. Wind-down routine is a specific sequence, not vague suggestions.

### Phase 3: RHYTHM
**Entry criteria:** Environment optimized.
**Actions:**
1. Set a consistent wake time -- this is THE most important sleep variable. Not bedtime. Wake time. Pick a wake time and stick to it 7 days a week, including weekends. Yes, even if you slept terribly. Even if it's Saturday. The circadian clock resets from the wake side, not the sleep side. Allow a 30-minute weekend buffer maximum.
2. Use strategic light exposure to reset the circadian clock:
   - **Morning (within 30 minutes of waking):** Get bright light. Sunlight is best (10-15 minutes outside, even on cloudy days -- outdoor light is 10-100x brighter than indoor). If sunlight isn't available (winter, night shift), use a 10,000 lux light therapy lamp for 20-30 minutes.
   - **Evening (2 hours before bed):** Minimize bright light and blue light. Dim screens, use warm-toned lighting, avoid overhead fluorescent lights.
   - **Middle of the night:** If you wake up and use the bathroom, keep eyes mostly closed and use the dimmest light possible. Bright light during the night tells your clock it's morning.
3. Calculate your sleep window using sleep restriction (the most effective non-medication insomnia treatment, part of CBT-I):
   - If you're currently getting 5 hours of actual sleep but spending 8 hours in bed, your sleep efficiency is 62% (terrible).
   - Set your initial sleep window to your average actual sleep time + 30 minutes. If you sleep 5 hours, your window is 5.5 hours.
   - Using your fixed wake time, count backward to set bedtime. Wake at 6:30am with 5.5-hour window = bedtime at 1:00am.
   - This feels brutal at first but it consolidates sleep and breaks conditioned insomnia. When sleep efficiency reaches 85%+, expand the window by 15 minutes. Repeat until you reach your target sleep amount.
4. Handle the adjustment period honestly: the first 1-2 weeks of circadian resetting are rough. You'll be tired. This is expected and temporary. Do NOT nap during this period (or if you absolutely must, set an alarm for 20 minutes max, before 2pm). Napping relieves pressure but undermines the reset.
5. For delayed sleep phase (night owls who can't fall asleep before 2-3am): advance bedtime by 15 minutes every 3 days. Combine with morning bright light. Don't try to shift more than 15 minutes at a time -- the circadian clock doesn't jump.

**Output:** Fixed wake time, strategic light exposure schedule, sleep restriction window with adjustment protocol, nap rules, and phase advance plan if applicable.
**Quality gate:** Wake time is consistent 7 days/week. Sleep window is calculated from actual sleep data. Light exposure timing is specific.

### Phase 4: MIND
**Entry criteria:** Circadian plan set.
**Actions:**
1. Address racing thoughts at bedtime with a structured "brain dump" -- 15-20 minutes before getting into bed, write down everything that's in your head: tomorrow's to-do list, worries, unresolved conversations, random thoughts. The goal is externalization. Your brain keeps thoughts spinning because it's afraid you'll forget them. Writing them down gives it permission to let go.
2. Implement the "constructive worry" technique for chronic worriers:
   - Earlier in the evening (not at bedtime), spend 15 minutes deliberately worrying on paper.
   - For each worry, write: what am I worried about, what's the worst case, what's the most likely case, and what (if anything) can I do about it tomorrow.
   - If the worry returns at bedtime, you can tell yourself: "I already dealt with that. It's on the list. Tomorrow."
3. Use cognitive shuffling for the mind that won't stop thinking. Pick a random letter. Think of a word starting with that letter. Visualize the object. Then another word with the same letter. Then another. When you run out of words, pick a new letter. This works because it gives the brain just enough activity to prevent thought loops but not enough to maintain alertness. It mimics the random imagery of pre-sleep.
4. Address sleep performance anxiety -- the anxiety about not being able to sleep, which itself prevents sleep. Counter it with paradoxical intention: instead of trying to fall asleep, try to stay awake (while lying in bed with eyes closed and no stimulation). The effort to stay awake removes the performance pressure, and sleep tends to come faster. Research backs this up.
5. Implement the 20-minute rule for conditioned insomnia: if you've been lying in bed for roughly 20 minutes and are clearly not falling asleep (don't clock-watch -- estimate), get up. Go to another room. Do something boring in dim light (not your phone). Return to bed only when you feel sleepy. Repeat as needed. This reconditioning is uncomfortable but it's the gold standard treatment for learned insomnia.

**Output:** Brain dump protocol, constructive worry technique, cognitive shuffling instructions, paradoxical intention method, and 20-minute rule with reconditioning guidelines.
**Quality gate:** Each technique has specific step-by-step instructions. Brain dump happens before getting into bed, not in bed. 20-minute rule is properly explained (not just "get up if you can't sleep").

### Phase 5: SUPPLEMENTS
**Entry criteria:** Behavioral interventions established.
**Actions:**
1. Provide an honest, evidence-based supplement guide:
   - **Melatonin:** Works for circadian timing, not as a sedative. Dose: 0.3-1mg (most people take WAY too much -- 5-10mg causes grogginess and can worsen sleep). Take 1-2 hours before target bedtime. Best for jet lag, delayed sleep phase, and shift work. Less effective for general insomnia.
   - **Magnesium glycinate:** Mild calming effect, helps muscle tension. 200-400mg before bed. Generally safe. The glycinate form matters -- magnesium oxide just gives you diarrhea.
   - **L-theanine:** Reduces mental alertness without sedation. 200mg before bed. Especially useful for racing-thoughts insomnia. Safe, low side effect profile.
   - **Valerian root:** Mixed evidence. Some people swear by it, studies are inconsistent. 300-600mg, 30 minutes before bed. Takes 2-4 weeks of consistent use to evaluate. Smells terrible.
   - **CBD:** Limited evidence for sleep specifically. May help indirectly by reducing anxiety. Quality and dosing are all over the place because regulation is minimal.
2. What doesn't work (or has serious downsides):
   - **Diphenhydramine (Benadryl/ZzzQuil):** Works short-term but builds tolerance fast. Associated with cognitive impairment in long-term use. Not recommended for regular sleep use.
   - **Alcohol as a sleep aid:** Hard no. See Phase 2.
   - **High-dose melatonin (5-10mg+):** Oversaturates receptors, causes morning grogginess, and can actually shift your circadian rhythm the wrong direction.
3. When to talk to a doctor about prescription options:
   - Insomnia has lasted more than 3 months despite behavioral changes
   - Sleep problems are significantly impairing daily functioning
   - You suspect sleep apnea (snoring, gasping, waking with headaches, excessive daytime sleepiness)
   - Mental health conditions (anxiety, depression, PTSD) are driving the insomnia
   - Current prescription options include: CBT-I (first-line treatment), low-dose trazodone, gabapentin, orexin receptor antagonists (Quviviq, Belsomra), and Z-drugs (zolpidem -- short-term only). Ask specifically about CBT-I before medication.
4. Create a supplement trial protocol: try one thing at a time for at least 2 weeks before evaluating. Track sleep metrics during the trial. Don't stack 5 supplements at once -- you won't know what's working.
5. Build a long-term sleep maintenance plan: once sleep improves, which elements to keep (consistent wake time, environment optimization, brain dump) and which to phase out (sleep restriction can relax once sleep efficiency is consistently above 85%, supplements can be tapered to as-needed).

**Output:** Evidence-based supplement guide with dosing, timing, and honest efficacy ratings; red-flag list for doctor visit; supplement trial protocol; and long-term maintenance plan.
**Quality gate:** Every supplement recommendation includes dose, timing, and evidence quality. Prescription medication discussion defers to doctor. Long-term plan includes maintenance behaviors, not just supplements.

## Exit Criteria
Done when: (1) sleep problem type is specifically diagnosed with contributing factors, (2) environment is optimized with a specific nightly routine, (3) circadian rhythm reset plan includes consistent wake time and light exposure, (4) at least 3 mind-calming techniques are provided with full instructions, (5) supplement guide is evidence-based with honest efficacy ratings, (6) criteria for seeking medical help are clearly stated.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| DIAGNOSIS | Person suspects sleep apnea (snoring, gasping, extreme fatigue despite sleeping) | Escalate -- recommend sleep study before behavioral interventions. Sleep apnea requires medical treatment (CPAP, oral appliance, or surgery). |
| DIAGNOSIS | Insomnia is medication-induced | Adjust -- identify the medication and discuss timing changes with their doctor. Don't recommend stopping medication. |
| ENVIRONMENT | Person can't control their environment (dorm, shared housing, noisy neighborhood) | Adjust -- focus on portable solutions: earplugs + white noise combo, sleep mask, cooling towel, portable fan. Maximize what you can control. |
| RHYTHM | Person works rotating shifts | Adjust -- full circadian reset isn't possible. Focus on consistent pre-sleep routine, strategic light/dark exposure around shift changes, and melatonin for timing. Acknowledge that shift work inherently harms sleep. |
| MIND | Racing thoughts are intrusive or trauma-related | Escalate -- intrusive thoughts and trauma-related insomnia need professional treatment (therapy, possibly medication). Behavioral techniques alone may not be sufficient. |
| SUPPLEMENTS | Person is already on multiple sleep supplements or medications | Adjust -- recommend discussing with doctor or pharmacist. Supplement interactions are real. Don't add without professional guidance. |
| SUPPLEMENTS | Person wants a pill to fix it without behavioral changes | Adjust -- be direct that no supplement or medication provides the same quality sleep as natural sleep achieved through behavioral changes. Medication can bridge the gap while building habits, but isn't a standalone solution. |

## State Persistence
- Sleep baseline metrics (time to fall asleep, wake-ups, total hours, quality rating) tracked over weeks
- Sleep window adjustments and sleep efficiency calculations
- Supplement trial results (what was tried, duration, effect on sleep metrics)
- Circadian reset progress (are wake times consistent, light exposure adherence)
- Technique effectiveness log (which mind techniques work, which don't)
- Environmental changes made and their measured impact on sleep

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
