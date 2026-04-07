# Dating Profile Optimizer

Turns your dating profile from a ghost town into something that actually gets quality matches. Covers every element: which photos to use (and which to burn), how to write a bio that sounds like a person and not a LinkedIn summary, how to answer prompts in a way that starts conversations, and how to target the right audience for what you're actually looking for. Works across all major apps -- Hinge, Bumble, Tinder, Coffee Meets Bagel, and whatever launches next week. No pickup artist nonsense. Just honest self-presentation that attracts people who'd actually like the real you.

## Execution Pattern: Phase Pipeline

```
PHASE 1: AUDIT       --> Tear down your current profile with honest feedback
PHASE 2: PHOTOS      --> Build a photo lineup that tells your story authentically
PHASE 3: COPY        --> Write bio and prompt responses that sound human and invite conversation
PHASE 4: TARGET      --> Optimize settings, platform choice, and strategy for your specific goals
PHASE 5: ITERATE     --> Test, measure, and refine based on actual results
```

## Inputs
- current_profile: object -- (Optional) Current dating app, existing photos, bio text, prompt responses. Provide as much as you have.
- personal_info: object -- Age, gender, what you're looking for (casual, serious, open to either), location (city/suburb/rural), lifestyle highlights (hobbies, job, social life, pets, travel)
- dating_goals: string -- What you actually want: long-term partner, casual dating, hookups (no judgment), friends first, or genuinely figuring it out
- self_perception: object -- What you think your strengths are, what you're insecure about, what past dates or partners have said they liked about you, and what's unique about you
- struggles: array -- What's not working: no matches, matches but no conversations, conversations but no dates, attracting the wrong type, can't figure out what to write, photos are terrible, or "I don't know what's wrong"
- platform: string -- (Optional) Which app(s) you're on or considering: Hinge, Bumble, Tinder, Coffee Meets Bagel, Match, OkCupid, or others

## Outputs
- profile_teardown: object -- Honest assessment of current profile with specific problems identified and scored
- photo_strategy: object -- Recommended photo lineup (6-slot plan) with guidance for each position, tips for getting better photos, and photos to immediately remove
- bio_and_prompts: object -- Written bio options and prompt responses tailored to personality and goals, with conversation hooks built in
- platform_strategy: object -- Which apps to use, how to configure settings, swiping strategy, and audience targeting
- optimization_plan: object -- Testing framework, metrics to track, iteration schedule, and when to make changes

## Execution

### Phase 1: AUDIT
**Entry criteria:** Person wants to improve their dating profile (existing or starting from scratch).
**Actions:**
1. If they have a current profile, evaluate each element:
   - **Photos (rate each 1-5):**
     - Is the face clearly visible? (No sunglasses, no hats, no distance shots as lead)
     - Is the lighting good? (Natural light > flash > bar lighting)
     - Does it show something interesting? (Activity, location, context > standing against a wall)
     - Would someone swipe right based on THIS photo alone?
     - Is it recent? (Within 2 years. People can tell when photos are old.)
   - **Bio (rate 1-5):**
     - Does it sound like a real person or a corporate tagline?
     - Does it give someone a reason to message you?
     - Is it the right length? (Too short = lazy. Too long = overwhelming. 3-5 lines is the sweet spot.)
     - Does it say what you're looking for?
   - **Prompts (rate each 1-5):**
     - Are the answers specific or generic?
     - Do they invite a response?
     - Do they reveal personality?
     - Are they trying too hard to be clever?
2. Identify the biggest problems (be direct):
   - **The Blurry Blob:** All photos are low quality, far away, or in dark bars. Nobody can tell what you look like.
   - **The Group Confusion:** Every photo has 4+ people. Which one are you? Nobody's going to investigate.
   - **The Resume:** Bio reads like a job application. "Finance professional. Love to travel. Looking for my person." This tells someone nothing about what you're like to be around.
   - **The Try-Hard:** Bio is a monologue of jokes that's more performance than personality. "I'm fluent in sarcasm" makes you sound like everyone else.
   - **The Ghost:** No bio, one photo, no prompts filled out. You're asking someone to invest interest in someone who couldn't be bothered to present themselves.
   - **The Red Flag Gallery:** Shirtless bathroom mirror selfies, photos with exes (even cropped), holding a gun/dead animal (know your audience), photos only with alcohol, every photo is a selfie.
3. Benchmark against what works on their specific platform:
   - **Hinge:** Most relationship-oriented. Prompt responses matter most. 6 photos with variety.
   - **Bumble:** Women message first. Your photos need to be approachable. Bio should give them something to open with.
   - **Tinder:** Most visual-first. Lead photo is everything. Bio matters less but a funny/genuine one sets you apart.
   - **Coffee Meets Bagel:** More curated. Fewer matches, higher intent. Detail in profile matters more.
4. Get external feedback if possible:
   - Show the profile to 2-3 friends of the gender you're trying to attract. Ask specific questions: "Would you swipe right? Why or why not? Which photo is best? Which is worst? Does the bio make you want to know more?"
   - If no friends available for this, online communities (r/dating, Photofeeler for photo ratings) provide honest stranger feedback.
5. List what's working (even if it's small) and what needs to change (even if it's everything). Specific, actionable problems, not vague "it's not great."

**Output:** Element-by-element profile rating, top 3 problems identified, platform-specific benchmark comparison, feedback strategy, and change priority list.
**Quality gate:** Every profile element is scored specifically. Problems are named directly without softening. Feedback includes external perspective (not just self-assessment).

### Phase 2: PHOTOS
**Entry criteria:** Audit complete, photo problems identified.
**Actions:**
1. Build the ideal 6-photo lineup:
   - **Slot 1 -- The Lead:** Your face, clear as day, with a genuine smile. Good lighting (golden hour outdoors is chef's kiss). Not a selfie if possible. This is your first impression and it does 80% of the work.
   - **Slot 2 -- The Full Body:** A natural photo showing your full body. Not a posed model shot. You at a wedding, hiking, standing in a cool location. People want to know what you look like, and hiding it loses trust.
   - **Slot 3 -- The Activity:** You doing something you actually do. Cooking, playing guitar, rock climbing, at a farmer's market, with your dog. This shows your life, not just your face.
   - **Slot 4 -- The Social:** You with friends. ONE group photo max. It shows you have a life and people enjoy being around you. Make sure you're easy to identify (ideally the best-looking version of yourself in the group -- this sounds shallow, it's reality).
   - **Slot 5 -- The Personality:** Something that reveals who you are: a travel photo, you at a concert, doing something weird or niche, laughing hard. This is the one that makes someone say "I want to know the story behind this."
   - **Slot 6 -- The Wildcard:** Something that invites conversation: a photo of food you cooked, a sunset from a trip, you with an animal, a childhood photo (if charming). This slot is low-stakes and fun.
2. Photos to delete immediately:
   - Any photo where you're not smiling (unless it's a genuinely cool action shot)
   - Bathroom or gym mirror selfies (yes, even if you're fit)
   - Photos with visible exes, even cropped (the phantom arm around your shoulder is obvious)
   - Car selfies (the angle is always bad and the lighting is always worse)
   - Photos older than 2 years
   - Multiple photos from the same event/outfit (looks like you only go out once)
   - Shirtless photos (unless you're literally at the beach in a natural setting, and even then, not as your lead)
   - Photos where you look angry, bored, or drunk
3. Getting better photos when you don't have any:
   - Ask a friend to take candid shots during your next outing. Not a photoshoot -- just casual photos during real activities.
   - Use the timer function on your phone with good natural lighting. Prop the phone, set a 10-second timer, and act natural.
   - Invest in one professional photo session if you're serious about dating. Not glamour shots -- a photographer who specializes in natural, lifestyle portraits. $100-200 can transform your profile.
   - Photo quality matters more than you think. A mediocre photo of you in great lighting beats a great moment in terrible lighting.
4. Platform-specific photo rules:
   - **Hinge:** All 6 slots matter. Mix of posed and candid. Can include a short video.
   - **Bumble:** Lead photo is critical since women are choosing who to invest messaging energy in.
   - **Tinder:** First 2 photos do almost all the work. Make them count. Speed of swiping means people barely see photos 4-6.
5. Test your photos:
   - Upload to Photofeeler.com for unbiased ratings on attractiveness, trustworthiness, and fun factor.
   - Swap your lead photo every 2 weeks and track match rate changes.
   - The photo YOU think is best is often not the one others respond to. Data beats ego.

**Output:** 6-slot photo lineup plan with specifications, delete list, photo acquisition strategies, platform-specific adjustments, and testing plan.
**Quality gate:** Each slot has a clear purpose. Delete list is non-negotiable. Getting new photos has an actionable plan. Testing is built in.

### Phase 3: COPY
**Entry criteria:** Photo strategy is set.
**Actions:**
1. Write the bio. Three options tailored to the person's personality:
   - **Option A -- The Genuine:** Straightforward, warm, and real. "Marketing manager who stress-bakes at midnight and has genuinely strong opinions about tacos. Looking for someone who can hold a conversation and doesn't take themselves too seriously. Probably taller than you in heels."
   - **Option B -- The Character Sketch:** Shows personality through specifics. "Most likely to: fall asleep during the movie I chose. Least likely to: have a clean car. Currently obsessed with: sourdough (yes, I know). Best quality according to my mom: 'a good listener' (she's not wrong)."
   - **Option C -- The Direct:** No fluff, just facts. "Software engineer. Runner. Dog dad to a 60lb pit mix who thinks he's a lapdog. Looking for something real, not a texting pen pal. Let's grab coffee and see if we click."
   - Bio must include: one personality reveal, one conversation hook (something someone can message about), and a signal of what you're looking for.
2. Write prompt responses that actually work (platform-specific):
   - **The rule:** Specific beats generic EVERY time. "I love to travel" → "I spent two weeks in Japan eating my way through Osaka and still think about a $3 bowl of ramen from a place I could never find again."
   - **Hinge prompts (pick the 3 that let you show the most personality):**
     - "A life goal of mine" → Make it real and slightly unexpected. "Own a house with one of those showers that has multiple heads. That's the dream."
     - "I'm looking for" → Be specific without being a checklist. "Someone who asks good questions and has at least one story that's too embarrassing to tell on a first date."
     - "The way to win me over is" → Make it achievable. "Send me a restaurant recommendation I've never heard of."
   - **Bumble prompts:** Focus on giving women something to message about. Every answer should have a hook they can grab.
   - **Tinder bio:** Shorter is better. 2-3 lines. If it's funny, great. If it's honest, also great. If it's both, you win.
3. Conversation hooks to embed in every profile element:
   - A hook is anything that makes someone think "I want to ask about that" or "me too!"
   - Name a specific restaurant, trip, hobby, opinion, or story. "Best pizza in Chicago, fight me" invites a message. "I love pizza" does not.
   - Slight controversy works: "Unpopular opinion: cold pizza is better than reheated pizza." Low stakes, high engagement.
   - Questions directed at the reader: "Tell me your best hidden gem restaurant" in a prompt response invites direct interaction.
4. Things to NEVER write in a profile:
   - "Looking for a partner in crime" (everyone says this)
   - "Fluent in sarcasm" (everyone says this)
   - "Here because my friend made me" (signals low effort)
   - "Not here for hookups" (starts with a negative)
   - Height, unless the app requires it (let them discover that on the date)
   - Negativity about dating apps ("is anyone real on here?" -- yes, and they just swiped left)
   - An entire wishlist of what you want in a partner (comes off as demanding)
   - Anything you can't deliver on. Don't claim to be "adventurous" if your ideal Saturday is the couch.
5. Final copy check:
   - Read it out loud. Does it sound like you talking at a bar, or a corporate PR statement?
   - Would your best friend say "that's so you" or "that doesn't sound like you at all"?
   - Is there at least ONE specific detail someone could reference in an opening message?
   - Does it tell someone what spending time with you would be like?

**Output:** 3 bio options, platform-specific prompt responses (3-5 per platform), conversation hook inventory, "never write" checklist, and voice authenticity check.
**Quality gate:** Every piece of copy sounds like a real person. Conversation hooks are embedded throughout. Nothing on the "never write" list appears. Reading it out loud passes the "sounds like me" test.

### Phase 4: TARGET
**Entry criteria:** Photos and copy are ready.
**Actions:**
1. Choose the right platform(s) for your goals:
   - **Looking for a relationship:** Hinge (designed for relationships, prompt-driven), Bumble (women initiate, tends more serious), Coffee Meets Bagel (curated daily matches)
   - **Open to anything:** Bumble (broad user base, multiple modes), Tinder (largest pool, full spectrum)
   - **Casual:** Tinder (largest casual pool), Bumble (still viable)
   - **Over 35:** Hinge, Match, Bumble. Tinder skews younger.
   - **LGBTQ+:** Hinge (inclusive options), Tinder (large queer user base), HER (women/nonbinary), Grindr (men)
   - Use 2 apps maximum. More than that is exhausting and leads to burnout.
2. Configure your settings strategically:
   - **Age range:** Be realistic, not aspirational. A 20-year age range signals "I'll date anyone."
   - **Distance:** Set to how far you'll actually drive for a first date on a weekday. Not "how far I'd drive for my soulmate."
   - **Deal-breaker filters:** Use sparingly. Every filter reduces your pool. Only filter for genuine non-negotiables (kids/no kids, smoking, religion if critical).
3. Build your swiping strategy:
   - Spend time on each profile. Read the bio. Look at all photos. The algorithm rewards thoughtful engagement over rapid-fire swiping.
   - Don't swipe right on everyone -- the algorithm deprioritizes profiles that mass-swipe.
   - Don't swipe right on nobody -- be honest about whether you're being selective or unrealistic.
   - Swipe during peak hours (Sunday evenings and weekday evenings 7-10 PM) for maximum visibility.
   - Refresh your profile weekly: change photo order, update a prompt, or adjust settings. Activity signals boost visibility.
4. Craft your opening messages (for apps where you message first):
   - Reference something specific from their profile: "Your Japan trip photo -- was that in Kyoto? I'm planning a trip and need recommendations."
   - Ask an open-ended question that's easy and fun to answer: "I see you're a coffee snob -- pour over or espresso and why?"
   - Don't: "hey," "you're beautiful," anything copy-pasted, anything sexual as an opener, anything that could be sent to any person.
   - First message goal: start a conversation, not secure a date. Be curious, not desperate.
5. Manage the mental health of online dating:
   - Set time limits: 20-30 minutes per day on dating apps. More than that is a doom scroll.
   - Rejection on apps is not personal. They saw 5 photos and a paragraph. They don't know you.
   - Take breaks. A week off every month prevents burnout.
   - Don't measure your worth by your match count. The apps are designed to keep you swiping, not to make you feel good.

**Output:** Platform recommendation, settings configuration, swiping strategy, opening message templates, and mental health boundaries.
**Quality gate:** Platform matches dating goals. Settings are realistic, not aspirational. Swiping strategy is intentional. Mental health protections are built in.

### Phase 5: ITERATE
**Entry criteria:** Profile is live and active for at least 2 weeks.
**Actions:**
1. Track the metrics that matter:
   - **Match rate:** How many right-swipes convert to matches? If it's below 5%, the profile needs work.
   - **Message rate:** How many matches turn into conversations? If matches happen but nobody talks, your profile invites attraction but not engagement (need better hooks).
   - **Date conversion:** How many conversations become dates? If you're chatting but never meeting, you're either taking too long to ask or there's a disconnect between profile and messages.
   - **Quality:** Are the matches people you're actually interested in? Getting lots of matches from people you'd never date means your profile is attracting the wrong audience.
2. Run A/B tests:
   - Change ONE thing at a time and run it for 1-2 weeks before evaluating.
   - Test different lead photos first (biggest impact). Track match rate before and after.
   - Test different prompt responses second (second biggest impact).
   - Test bio changes third.
   - Don't change everything at once -- you won't know what worked.
3. Adjust based on data:
   - Low matches → Photos need work (especially lead photo)
   - Matches but no messages → Bio and prompts need better conversation hooks
   - Messages but no dates → Messaging strategy needs work (ask them out within 10-15 messages)
   - Dates but no second dates → This is a date skill issue, not a profile issue (see First Date Confidence Kit)
   - Wrong type of matches → Profile is sending unintended signals. Review what kind of person each element attracts.
4. Seasonal and timing adjustments:
   - January is peak dating app season (New Year's resolutions). Have your best profile ready by December 26.
   - Sunday evenings consistently have the highest engagement.
   - Summer is slower (people are out living, not swiping).
   - After major holidays (Valentine's Day, Christmas) sees spikes in new users.
5. Know when to take a break vs. when to push through:
   - **Take a break if:** You dread opening the app, every match feels like a chore, you're comparing yourself to other profiles, or dating feels like a job.
   - **Push through if:** You're getting discouraged but the metrics are actually trending up, you've been at it less than a month, or you just got out of a slump and momentum is building.
   - Dating fatigue is real. A 2-week break with a refreshed profile often outperforms 2 continuous months of grinding.

**Output:** Metrics tracking framework, A/B testing plan, data-driven adjustment guide, seasonal calendar, and break/continue assessment.
**Quality gate:** Metrics are specific and measurable. Tests change one variable at a time. Adjustments are based on data, not feelings. Breaks are strategic, not surrender.

## Exit Criteria
Done when: (1) existing profile is honestly audited with specific problems identified, (2) photo lineup is strategic with 6 purposeful slots, (3) bio and prompts are written in an authentic voice with conversation hooks, (4) platform and settings are optimized for dating goals, (5) testing and iteration framework is in place with metrics to track.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| AUDIT | Person doesn't have a current profile to audit | Adjust -- skip to building from scratch using Phases 2-4. No teardown needed. |
| PHOTOS | Person has no good photos and no one to take photos of them | Adjust -- phone timer in natural light, tripod or prop against a stack of books, Meetup groups for social photos, or invest in one affordable lifestyle photo session ($100-200) |
| PHOTOS | Person is insecure about their appearance | Adjust -- focus on photos that show energy, warmth, and personality. Attractiveness on apps is 40% looks and 60% presentation (lighting, smile, context). Confidence and authenticity attract more than conventional attractiveness. |
| COPY | Everything they write sounds stiff or fake | Adjust -- have them record a voice memo describing themselves, then transcribe and edit. People are always more natural speaking than writing. |
| TARGET | Getting matches on the wrong app for their goals | Adjust -- switch platforms before changing profile content. A great Hinge profile on Tinder will still attract Tinder's audience. |
| ITERATE | No matches at all after 3 weeks despite good profile | Adjust -- check location (small towns have tiny pools), check age range and distance settings, consider whether the app's demographic matches your target. Try a different platform before assuming the profile is the problem. |
| ITERATE | Burned out on dating apps entirely | Adjust -- take a full break (2-4 weeks minimum). Delete the apps. When you return, treat it as a fresh start with the optimized profile. Also explore offline dating (hobbies, events, through friends). |

## State Persistence
- Profile versions (photos, bio, prompts at each stage for comparison)
- Match rate history by profile version (what changes improved results)
- A/B test log (what was tested, duration, results)
- Platform performance comparison (which app produces the best quality matches)
- Opening message performance (which approaches get responses)
- Date conversion funnel (matches → conversations → dates → second dates)
- Break schedule and re-entry results
- Lessons learned log (what works for THIS specific person, not general advice)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
