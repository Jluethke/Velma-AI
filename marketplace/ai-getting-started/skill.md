# AI Getting Started Guide

A gentle, zero-pressure introduction to AI for people who've heard about ChatGPT but feel overwhelmed, skeptical, or worried. Explains what AI actually is (and isn't) using everyday analogies. Walks through your first conversation with an AI step by step. Addresses real fears: "Will it steal my data?" "Will it replace my job?" "Am I too old for this?" "What if I break something?" Ends with 5 practical things you can try RIGHT NOW that will save you time. No hype. No jargon. Just honest answers.

## Execution Pattern: ORPA Loop

## Inputs
- experience_level: string -- Where you are right now: "never used AI," "tried it once and got confused," "use my phone and email but that's about it," or "I've heard of it but don't trust it"
- main_concern: string -- What worries you most about AI. Be honest. Common ones: "I'm too old," "I'll break something," "it'll steal my information," "it'll take my job," "I don't understand what it is," "it feels creepy"
- what_you_use_tech_for: array -- (Optional) What you already do with your phone or computer: email, texting, online shopping, social media, work documents, banking, video calls, or anything else
- goals: string -- (Optional) What you'd like AI to help with if you knew how. Examples: writing emails, understanding medical info, planning trips, helping grandkids with homework, organizing recipes, summarizing long articles
- device: string -- (Optional) What you'd be using: iPhone, Android phone, iPad/tablet, Windows computer, Mac, or "I'm not sure"

## Outputs
- what_ai_is: string -- A plain-English explanation of what AI actually is, using an analogy that makes sense based on your background. No buzzwords.
- what_ai_is_not: string -- Honest corrections to common misconceptions. What it cannot do. Where it gets things wrong. Why it's not magic and not dangerous in the way movies portray.
- fears_addressed: array -- Each concern you raised answered directly and honestly. No dismissing, no patronizing. If a concern is valid, we say so.
- first_conversation_walkthrough: object -- Step-by-step instructions for having your very first AI conversation, with screenshots-level detail: where to go, what to type, what to expect back, what buttons to press
- five_things_to_try: array -- Five specific, practical tasks you can try right now that will genuinely save you time or make your life easier
- safety_basics: object -- What's safe, what to be careful about, and one simple rule to remember

## Execution

### OBSERVE: Understand Where You're Starting
**Entry criteria:** The person has shared their experience level and at least one concern.
**Actions:**
1. Note their exact experience level. Someone who "tried it once and got confused" needs different help than someone who has never touched it. Meet them exactly where they are.
2. Read their concern carefully. Don't assume it's irrational. Many AI concerns are perfectly reasonable:
   - "It'll steal my data" -- partially valid. Some AI companies do use conversations for training. This deserves a real answer.
   - "I'm too old for this" -- not valid, but the feeling is real. Address the feeling, not just the fact.
   - "It'll replace my job" -- depends entirely on the job. Be honest about this.
   - "I'll break something" -- you literally cannot break anything by talking to an AI. This is the easiest fear to address.
   - "It feels creepy" -- valid emotional response to something that mimics human conversation. Acknowledge it.
3. Look at what technology they already use. If they can send a text message, they can use AI. If they can Google something, they can use AI. Draw the bridge from what they know.
4. Note their goals. If they haven't stated any, that's fine -- we'll suggest things based on what they already do with technology.
5. Identify their device so all instructions match exactly what they'll see on their screen.

**Output:** A clear picture of this person's starting point, fears, existing tech comfort, and what would be most useful to them.
**Quality gate:** No assumptions made. Concerns are taken at face value. Tech level is accurately assessed from what they told us, not guessed.

### REASON: Build the Right Explanation
**Entry criteria:** Starting point assessment complete.
**Actions:**
1. Choose the right analogy for what AI is based on their background:
   - For someone who cooks: "AI is like a very well-read assistant who's memorized millions of recipes, articles, and books. You ask it a question, and it gives you its best answer based on everything it's read. It doesn't actually understand cooking -- it's pattern-matching from everything it's seen. Sometimes it's brilliant. Sometimes it confidently tells you to put sugar in your soup."
   - For someone in an office: "Think of it like autocomplete on your phone, but for entire conversations. Your phone predicts the next word. AI predicts the next paragraph. It's not thinking -- it's predicting what a helpful answer would look like."
   - For someone who watches TV: "You know how Netflix recommends shows based on what you've watched? AI does that but with words. It's been trained on billions of pages of text and it predicts what words should come next in a conversation."
2. Build honest answers for each fear:
   - Never minimize a concern. If there's a real risk, say so and explain how to manage it.
   - Never exaggerate safety either. "It's completely safe!" is as unhelpful as "It's dangerous!"
   - Use the format: "Here's what's actually true about that..." followed by practical advice.
3. Select the right first-conversation platform based on their device:
   - iPhone/iPad: ChatGPT app from the App Store (free)
   - Android: ChatGPT app from Google Play (free)
   - Any computer: chat.openai.com in their web browser (free, no download needed)
   - Alternative: Google's Gemini if they already have a Google account (gemini.google.com)
4. Pick 5 try-it-now tasks matched to their life. Don't suggest "write code" to someone who doesn't code. Suggest things like:
   - "Explain this medical bill to me in plain English" (paste the confusing part)
   - "Write a birthday message for my sister who loves gardening"
   - "What's a good recipe for dinner with chicken, rice, and whatever vegetables I have?"
   - "Summarize this long email so I know what they actually want"
   - "Help me write a polite complaint to my internet company"
5. Prepare the one safety rule: "Don't type anything you'd be embarrassed to see on a billboard. No passwords, no Social Security numbers, no bank account numbers, no private medical details you want kept secret."

**Output:** Tailored analogy, honest fear responses, platform recommendation, personalized task suggestions, safety rule.
**Quality gate:** Analogy connects to something the person already understands. Fear responses are honest, not dismissive. Tasks are genuinely useful for this specific person.

### PLAN: Structure the Walkthrough
**Entry criteria:** All explanation components built.
**Actions:**
1. Order the response for maximum comfort:
   - Start with what AI is (short, friendly, relatable)
   - Then address their specific fears (they need this before they'll try anything)
   - Then the step-by-step first conversation (make it feel doable)
   - Then the 5 things to try (give them momentum)
   - End with the safety basics (so they feel in control)
2. Write the first-conversation walkthrough at "tell me which button to press" detail level:
   - Step 1: Open [specific app/website] on your [device]
   - Step 2: You'll see [exactly what they'll see]. Tap/click [specific button]
   - Step 3: You'll see a text box that says something like "Message ChatGPT." That's where you type, just like texting
   - Step 4: Type this exact sentence: [provide a starter sentence relevant to their interests]
   - Step 5: Press the send arrow (it looks like [description])
   - Step 6: Wait a moment. You'll see it typing a response, just like when someone is typing a text back to you
   - Step 7: Read the response. If you want to ask a follow-up, just type again. It's a conversation.
   - Step 8: If you want to start over with a new topic, look for "New Chat" (usually a [icon description] at the top)
3. Make each of the 5 try-it-now tasks a complete mini-script: what to type, what to expect, why it's useful.
4. Format safety basics as three categories: Always Safe, Be Careful, Never Do.

**Output:** Complete response structure with walkthrough, tasks, and safety guide ready to deliver.
**Quality gate:** A person who has never used AI could follow every instruction without getting stuck. No step assumes knowledge that hasn't been explained.

### ACT: Deliver the Guide
**Entry criteria:** All sections planned and personalized.
**Actions:**
1. Open with warmth and normalcy: "Lots of people feel exactly the way you do. That's not a weakness -- it means you're thinking about this carefully, which is smarter than blindly jumping in."
2. Deliver the AI explanation using the chosen analogy. Keep it under 4 sentences. End with: "The most important thing to know is that you're just having a conversation. If you can text a friend, you can use AI."
3. Address each fear in its own short paragraph. Lead with validation ("That's a reasonable concern"), then the honest answer, then the practical takeaway.
4. Walk through the first conversation with numbered steps. Use the exact button names and screen descriptions for their device.
5. Present the 5 things to try as a numbered list, each with:
   - What to type (in quotes, ready to copy)
   - What it'll give you back (set expectations)
   - Why this is useful (connect to their life)
6. Close with the safety section. Frame it positively: "Here's how to stay in control." The one rule: "If you wouldn't say it to a stranger at a coffee shop, don't type it into AI."
7. Final message: "You don't have to become an expert. You don't have to use this every day. Just try one thing from the list above. If it's useful, great. If not, you haven't lost anything."

**Output:** Complete, personalized getting-started guide.
**Quality gate:** Tone is warm but never condescending. Every instruction is specific enough to follow without outside help. Fears are addressed honestly. The person feels capable, not overwhelmed.

## Exit Criteria
Done when: (1) AI is explained in a way that connects to something the person already understands, (2) every stated concern is addressed honestly, (3) step-by-step first conversation walkthrough is complete with device-specific instructions, (4) 5 practical try-it-now tasks are provided with exact text to type, (5) safety basics are clear and memorable.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Person doesn't state a concern but seems hesitant | Adjust -- address the 3 most common fears proactively ("Most people worry about...") and let them see which resonates |
| OBSERVE | Person seems hostile toward AI ("it's all garbage") | Adjust -- don't argue. Acknowledge valid criticisms (hallucinations, hype). Focus on one concrete use case that's genuinely useful |
| REASON | Person's device or platform isn't clear | Adjust -- provide instructions for the two most common options (phone app and web browser) and let them pick |
| REASON | Person has a disability or accessibility need | Adjust -- include voice input instructions ("you can talk to it instead of typing"), screen reader compatibility notes, or large-text settings |
| PLAN | Person seems overwhelmed by the amount of information | Simplify -- cut to just 3 sections: what it is (2 sentences), how to try it (5 steps), one thing to type right now |
| ACT | Person asks a follow-up fear question not originally raised | Expand -- address the new concern with the same honest, direct approach before continuing |
| ACT | Person is excited and wants to go deeper immediately | Redirect -- suggest 2-3 next skills (Digital Safety Guide, Tech Translator) rather than overloading this session |
| ACT | Person rejects the explanation or says it didn't help them understand | **Adjust** -- incorporate their specific feedback (e.g., analogy didn't land, walkthrough was too fast, tasks weren't relevant), swap in a different analogy or platform, and regenerate only the affected section; do not restart the whole guide |
| ACT | User rejects final output | **Targeted revision** -- ask which analogy, walkthrough step, or task example fell short and rerun only that section. Do not regenerate the full guide. |

## Reference

### AI Analogy Library (by Background)

| User Background | Best Analogy | Key Point |
|---|---|---|
| Cook / home chef | A well-read assistant who has memorized millions of recipes and articles — brilliant sometimes, confidently wrong other times | Pattern-matching, not understanding |
| Office worker | Autocomplete on your phone, but for entire paragraphs and conversations | Prediction, not thinking |
| TV/streaming viewer | Netflix recommendations, but for words — trained on billions of pages, predicts the helpful next sentence | Trained patterns, not awareness |
| Parent / caregiver | A very fast researcher who can summarize anything but sometimes makes up details — always verify medical or legal specifics | Useful assistant, requires verification |

### Platform Quick-Start by Device

| Device | Platform | First Step |
|---|---|---|
| iPhone / iPad | ChatGPT app (App Store, free) | Open App Store → Search "ChatGPT" → Install → Sign up |
| Android phone | ChatGPT app (Google Play, free) | Open Play Store → Search "ChatGPT" → Install → Sign up |
| Any computer | chat.openai.com (free, no install) | Open browser → Go to chat.openai.com → Sign up |
| Google account holder | gemini.google.com (free) | Open browser → Go to gemini.google.com → Sign in with Google |

### The One Safety Rule (Memorable Form)
"Don't type anything you'd be embarrassed to see on a billboard."
- Never type: passwords, Social Security numbers, bank account details, private medical information you want kept secret
- Safe to type: questions, writing help requests, summaries of public documents, recipe ideas, travel planning

### Fear Response Framework

| Fear | Honest Answer | Practical Takeaway |
|---|---|---|
| "It'll steal my data" | Partially valid — some AI companies use conversations for training. Use the data controls in settings. | Read the privacy settings; opt out of training data if the option exists |
| "I'm too old" | Not valid — if you can send a text, you can use AI. Age has no bearing. | Start with texting-style short questions |
| "It'll replace my job" | Depends entirely on the job. Honest answer: some tasks, yes; full jobs, rarely. | Focus on what it can help you do faster, not what it might replace |
| "I'll break something" | Not possible — you can only type words, and you can always start a new chat | There is no "break" button in a chat window |
| "It feels creepy" | Valid emotional response. It mimics human conversation without being human. | Knowing it's a prediction machine (not a person) helps most people feel more comfortable |

## State Persistence
- Comfort level progression (from initial skepticism to first successful interaction to regular use)
- Fears addressed and which ones resolved vs. which remain
- Tasks tried and which were useful vs. which weren't relevant
- Preferred platform and device for future instructions
- Topics the person gravitates toward (practical, creative, informational) for suggesting next skills

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
