# Crypto in Plain English

Explains cryptocurrency, blockchain, and digital wallets to someone who has zero background and might be suspicious of the whole thing. Covers: What is Bitcoin actually? Where does the money come from? Is it real money? Can I lose everything? What's a wallet? What's the blockchain? Why do people care? Addresses scam awareness head-on -- most people's first encounter with crypto is someone trying to scam them. Separates the technology from the hype. No shilling. No "you should invest." Just clear explanations so you can make informed decisions. Uses analogies from banking, mail, and everyday life.

## Execution Pattern: ORPA Loop

## Inputs
- what_prompted_this: string -- Why you're looking into crypto right now. Examples: "someone told me I should invest," "my kid mentioned Bitcoin," "I got an email about cryptocurrency," "I see it in the news and don't understand it," "someone asked me to pay in crypto," "I'm just curious"
- specific_questions: array -- (Optional) Specific things you want to understand. Examples: "Is Bitcoin real money?" "Can someone steal it?" "Is it illegal?" "Why does the price go up and down so much?" "What's an NFT?" "What's the blockchain?"
- concern_level: string -- (Optional) How you feel about it: "curious but cautious," "my family member is into it and I'm worried," "someone is pressuring me to invest," "I think I might be getting scammed," "just want to understand the basics"
- financial_background: string -- (Optional) Your comfort with financial topics: "I have a bank account and that's about it," "I invest in my 401k," "I understand stocks," "I have no idea how any of this works"
- encounter_details: object -- (Optional) If someone is trying to get you to buy crypto or pay in crypto, describe exactly what they said, how they contacted you, and what they want you to do

## Outputs
- plain_english_explanations: object -- Every concept explained using analogies from everyday life. No technical terms without an immediate translation.
- honest_assessment: string -- What crypto actually is good for, what it's terrible for, and what's still genuinely unknown. No cheerleading, no fear-mongering.
- scam_awareness: object -- How to recognize the most common crypto scams, what red flags look like, and why crypto is a favorite tool of scammers (and what that means)
- your_situation_assessment: string -- Based on what prompted this, a direct assessment of whether the person is in a safe, risky, or dangerous situation
- informed_decision_framework: array -- If they're considering getting involved, what to think about first. If they're not, why understanding the basics still matters.
- next_steps: array -- Exactly what to do (or not do) based on their situation

## Execution

### OBSERVE: Understand Their Starting Point and Situation
**Entry criteria:** The person has shared why they're looking into crypto.
**Actions:**
1. Assess urgency. If someone is pressuring them to invest or pay in crypto RIGHT NOW, this is likely a scam and the scam-awareness section becomes the priority. Financial pressure plus crypto equals danger in the vast majority of cases.
2. Note their emotional state. Curiosity is different from anxiety is different from confusion. Adjust tone accordingly:
   - Curious: teach freely, include interesting details
   - Anxious (worried about a family member): lead with reassurance, then facts
   - Pressured: lead with scam awareness immediately
   - Confused: start from absolute zero, use the simplest analogies
3. Identify what they actually need to know vs. what they think they need to know. Someone asking "should I invest in Bitcoin?" often really needs to understand what Bitcoin IS first before the investment question even makes sense.
4. Check for scam indicators in their encounter details:
   - Guaranteed returns ("You'll double your money!")
   - Urgency ("This opportunity closes tonight!")
   - Unsolicited contact (someone you don't know reaching out about crypto)
   - Celebrity endorsement claims ("Elon Musk's new crypto project!")
   - Romance angle (online relationship that leads to investment talk)
   - Payment request (asked to pay for something in crypto, especially gift cards or Bitcoin ATMs)

**Output:** Situation assessment (safe/curious, potentially risky, or likely scam), emotional state, knowledge gaps identified, priority topics.
**Quality gate:** If any scam indicators are present, they are flagged immediately. Situation is never assessed as "safe" when scam indicators exist.

### REASON: Build Explanations That Actually Make Sense
**Entry criteria:** Starting point and situation assessed.
**Actions:**
1. Build the core explanations using everyday analogies:
   - **What is Bitcoin?** "Imagine a spreadsheet that everyone in the world can see but nobody can cheat on. Every time someone sends money to someone else, it gets written on this spreadsheet. That spreadsheet is called the blockchain. Bitcoin is the money that gets tracked on it. There's no bank in the middle -- the spreadsheet itself is the proof that you own it."
   - **Where does Bitcoin come from?** "Think of it like gold mining, but with computers. People run powerful computers that solve math puzzles, and when they solve one, they get rewarded with new Bitcoin. This is called 'mining.' There's a fixed total amount that can ever exist -- 21 million -- so you can't just print more of it like dollars."
   - **Is it real money?** "It's real in the sense that people will trade it for regular money and some places accept it as payment. It's not real in the way your dollar bills are -- no government backs it, no bank insures it. If you lose it, there's no customer service to call."
   - **What's a wallet?** "A crypto wallet isn't like your physical wallet. It's more like a mailbox with a lock. Everyone can see the mailbox (your public address, like a P.O. box number), but only you have the key to open it (your private key, which is a very long password). If you lose that key, your money is locked in that mailbox forever. Nobody can get it out. Not even the people who made the mailbox."
   - **Why does the price change so much?** "Because there's no company behind it earning money, no building, no products. The price is purely based on what people think it's worth today. That makes it swing wildly -- like a collectible whose price depends entirely on how many people want it at any given moment."
   - **What's the blockchain?** "It's that shared spreadsheet we talked about. Every transaction ever made is recorded on it, in order, permanently. Nobody can erase a line or change a number. Think of it like a public notary that never sleeps, never makes mistakes, and never forgets."
2. Build the scam awareness section regardless of whether they asked for it. The most common crypto scams:
   - **"Guaranteed returns" schemes:** Nobody can guarantee returns on anything. If someone says they can, they're lying. Period.
   - **Romance scams:** Someone you met online (dating app, Facebook, Instagram) who eventually steers the conversation toward investing together. This is the #1 way people lose money in crypto.
   - **Fake exchanges/platforms:** Websites that look professional but are completely fake. You "invest," see fake profits on screen, then can never withdraw your money.
   - **Celebrity endorsement scams:** "Elon Musk is giving away Bitcoin!" No, he isn't. Nobody gives away money to strangers.
   - **"Pay in crypto" demands:** Legitimate businesses almost never require crypto payment. If someone insists on crypto, especially via a Bitcoin ATM, it's almost certainly a scam.
3. Prepare the honest assessment: what crypto is actually useful for (sending money across borders without bank fees, digital ownership verification, some privacy benefits) and what it's terrible for (stable savings, guaranteed returns, anything requiring consumer protection).
4. Build the situation-specific response based on what brought them here.

**Output:** Complete set of analogies, scam awareness content, honest assessment, and situation-specific guidance.
**Quality gate:** Every explanation uses a concrete analogy from daily life. Scam section is included regardless of input. No investment advice is given in any direction.

### PLAN: Structure for Maximum Clarity
**Entry criteria:** All explanations and assessments built.
**Actions:**
1. If scam indicators were detected, restructure the entire response to lead with the safety warning. Everything else becomes secondary.
2. For general curiosity, order the response:
   - Start with the most relatable analogy (the shared spreadsheet)
   - Answer their specific questions one by one
   - Cover scam awareness (even if they didn't ask -- frame as "something everyone should know")
   - Give the honest assessment (good for X, bad for Y, unknown Z)
   - End with practical next steps
3. For family concern ("my kid is into crypto"), structure as:
   - What your family member is actually doing (most likely)
   - When it's fine (buying small amounts they can afford to lose, learning about technology)
   - When to worry (borrowing money to invest, talking about guaranteed returns, secretive about which platform they use)
   - How to have the conversation without pushing them away
4. Prepare the "rules of thumb" list that anyone can remember:
   - Never invest money you can't afford to lose completely
   - If someone guarantees returns, it's a scam
   - If someone you met online talks about crypto investing, it's a scam
   - Never give anyone your private key or seed phrase (that's like giving someone the key to your mailbox)
   - If you must try it, start with an amount you'd be comfortable dropping on the sidewalk and never seeing again

**Output:** Ordered response structure appropriate to their situation and concern level.
**Quality gate:** Most urgent information comes first. Scam warning is never buried below general education.

### ACT: Deliver Clear Answers
**Entry criteria:** Response structure finalized.
**Actions:**
1. If scam detected: lead with "I want to address something important before we get to the explanations." Describe exactly why their situation has red flags. Be direct but not scary. Give them specific steps: stop communication, don't send money, verify independently.
2. Deliver each explanation in its own short section with a clear heading. Use the analogy first, then the fact. People remember stories better than definitions.
3. For each specific question they asked, give a direct answer in the first sentence, then the explanation. Don't make them read three paragraphs to find out that yes, Bitcoin is legal.
4. Present the scam awareness section as "Things worth knowing" rather than "Scary warnings." People absorb practical awareness better than fear-based lists.
5. Deliver the honest assessment without taking sides. End with: "Crypto is a technology. Like any technology, it can be used well or badly. You don't need to love it or hate it. You just need to understand enough to make your own decisions and spot when someone is trying to take advantage of you."
6. Close with the memorable rules of thumb. Keep them short enough to remember.
7. If they seem interested in learning more, suggest the Digital Safety Guide skill (online safety basics) and the Tech Translator skill (for when they encounter confusing crypto terms later).

**Output:** Complete crypto education package tailored to their situation and questions.
**Quality gate:** Zero jargon without explanation. Zero investment advice. Scam awareness is always included. Tone is respectful and never talks down. A reader with no financial background could follow every explanation.

## Exit Criteria
Done when: (1) every question is answered in plain English with a real-world analogy, (2) scam awareness is covered, (3) their specific situation is assessed (safe, risky, or dangerous), (4) honest pros and cons are presented without bias, (5) memorable rules of thumb are provided, (6) if scam indicators exist, clear action steps are given as the top priority.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Person is actively being scammed right now | Emergency -- skip all education. Lead with: "Stop all communication with this person immediately. Do not send any money. Here's why..." Then provide the scam analysis and damage control steps |
| OBSERVE | Person wants investment advice ("Should I buy Bitcoin?") | Redirect -- explain that this skill provides education, not financial advice. Offer to explain what Bitcoin is so they can make their own informed decision. Never recommend buying or not buying |
| REASON | Person asks about a specific cryptocurrency other than Bitcoin (Ethereum, Dogecoin, etc.) | Adjust -- provide the same plain-English treatment. Note that Bitcoin is the most established; others range from legitimate projects to outright scams. Suggest researching any specific coin the same way you'd research any company before investing |
| REASON | Person asks about NFTs | Adjust -- explain: "An NFT is like a certificate of authenticity for a digital item. Imagine buying a signed poster -- the NFT is the signature proving you own it. Whether the poster is worth anything is a separate question" |
| PLAN | Person has already lost money to a scam | Pivot to damage control -- what to do now (report to FTC, local police, IC3.gov), what can and cannot be recovered (crypto transactions are usually permanent), emotional support (scammers are professionals, this is not your fault) |
| ACT | Person is a minor asking about crypto | Adjust -- explain the concepts but strongly advise talking to a parent or guardian before any financial decisions. Note that most exchanges require you to be 18+ |
| ACT | Person wants to know about crypto for a legitimate business reason (accepting crypto payments) | Adjust -- focus on practical business considerations: volatility risk, transaction fees, tax implications, which payment processors handle crypto-to-cash conversion |

## State Persistence
- Questions asked and explanations delivered (avoid repeating in follow-up sessions)
- Scam encounters documented (type, platform, outcome, reports filed)
- Understanding progression (which concepts clicked, which need reinforcement)
- Situation status (initial concern resolved or ongoing)
- Related skills suggested (Digital Safety Guide, Tech Translator, Scam Detector)

## Error Handling (additions)

| Phase | Failure Mode | Response |
|---|---|---|
| ACT | User rejects final output | Targeted revision -- ask which explanation was unclear or which concern was not addressed, then rerun only that section with a different analogy or framing. Do not restart from scratch. |

## Reference

### Crypto Scam Red Flags

| Signal | Risk Level | Typical Pattern |
|---|---|---|
| Guaranteed returns | Critical | "Double your money in 30 days" |
| Urgency / FOMO | Critical | "Offer closes tonight" |
| Unsolicited contact | High | DM, email, or phone out of nowhere |
| Romance lead-in | Critical | Online relationship pivots to investing |
| Celebrity endorsement | High | Fake Elon Musk giveaway posts |
| Pay in crypto only | High | Bitcoin ATM, gift cards requested |
| Private key requested | Critical | Any request for seed phrase or private key |

### Crypto Terminology Cheat Sheet

| Term | Plain-English Translation |
|---|---|
| Blockchain | Shared spreadsheet everyone can see but nobody can alter |
| Bitcoin | Digital currency tracked on a blockchain; fixed supply of 21 million |
| Wallet | Mailbox with a lock -- public address visible, private key secret |
| Private key | Password that unlocks your wallet; lose it = lose your money permanently |
| Seed phrase | 12-24 word backup for the private key -- treat like a bank PIN |
| Mining | Computers solving math puzzles to earn new Bitcoin |
| Exchange | Platform to buy/sell crypto (Coinbase, Kraken, Binance) |
| NFT | Digital certificate of ownership for a specific item |
| DeFi | Financial services without banks; high risk, high volatility |
| Gas fee | Transaction fee paid to the network to process a transfer |

### Realistic Risk Comparison

| Scenario | Actual Risk | Common Perception |
|---|---|---|
| Keeping crypto on a reputable exchange | Moderate (exchange hacks possible) | Overestimated by beginners |
| Keeping crypto in your own wallet | Lower (you control keys) | Underestimated -- losing key = permanent loss |
| Investing in a new altcoin | Very high (most fail) | Underestimated due to hype |
| Responding to unsolicited crypto offers | Near-certain scam | Underestimated |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
