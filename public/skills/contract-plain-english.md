# Contract Plain English

Takes any contract -- employment, rental, service agreement, freelance, gym membership, whatever -- and translates it from legalese into plain English so you know what you're actually agreeing to. Spots the dangerous clauses that companies bury in paragraph 17, identifies what you can negotiate, and tells you what's standard versus what's sketchy. Because "I didn't read the fine print" is the most expensive sentence in the English language. Works for any contract you'd encounter in normal life -- this isn't for merging corporations, it's for regular people signing things they don't fully understand.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCAN        --> Quick read to identify contract type, parties, and big-picture terms
PHASE 2: TRANSLATE   --> Convert every section from legalese to plain English
PHASE 3: RED FLAGS   --> Spot dangerous, unusual, or one-sided clauses
PHASE 4: NEGOTIATE   --> Identify what's negotiable and script the conversation
PHASE 5: DECIDE      --> Summary recommendation: sign, negotiate, or walk away
```

## Inputs
- contract_text: string -- The full text of the contract (pasted, uploaded, or described section by section)
- contract_type: string -- Employment, rental/lease, service agreement, freelance/independent contractor, NDA, non-compete, gym/membership, software/SaaS terms of service, home purchase, vehicle purchase, or other
- your_role: string -- Which side of the contract you're on (employee, tenant, customer, freelancer, buyer, seller)
- concerns: array -- (Optional) Specific sections or terms you're worried about, things a friend warned you about, clauses that seem weird
- context: object -- (Optional) Your negotiating position (how badly you need this deal), alternatives available, timeline pressure, whether you have an attorney reviewing as well

## Outputs
- plain_english_summary: object -- The entire contract restated in normal human language, organized by topic
- clause_analysis: array -- Every significant clause rated as standard, favorable, unfavorable, or dangerous, with explanation
- red_flag_report: array -- Specific clauses that are unusual, one-sided, or potentially harmful, ranked by risk severity
- negotiation_guide: object -- Which clauses to push back on, suggested alternative language, and scripts for the conversation
- recommendation: object -- Overall assessment with sign/negotiate/walk away recommendation and reasoning

## Execution

### Phase 1: SCAN
**Entry criteria:** Contract text and contract type provided.
**Actions:**
1. Identify the basics: who are the parties, what's the effective date, what's the term (how long it lasts), and how does it end (termination provisions). These four pieces frame everything else. If the contract doesn't clearly state all four, that's already a yellow flag -- ambiguity in contracts always favors the party who wrote it.
2. Identify the core exchange: what each party is giving and getting. In an employment contract: you give labor and loyalty, they give salary and benefits. In a lease: you give rent, they give a place to live. In a service agreement: you give money, they give services. If the exchange seems lopsided even at a glance, pay close attention in later phases.
3. Note the contract's structure and length. A 3-page employment offer is normal. A 47-page employment agreement with 12 exhibits for a mid-level job is a company that uses contracts as weapons. Similarly, a 1-page lease is suspiciously short (probably missing protections for you), while a 30-page lease is standard for most states.
4. Identify which state's law governs the contract (usually in a "Governing Law" clause near the end). This matters because contract law varies significantly by state. A non-compete that's enforceable in Florida might be void in California. A lease clause that's legal in Texas might violate tenant protection laws in New York.
5. Check for arbitration and dispute resolution clauses. These are often buried at the end and they determine how you fight if something goes wrong. Mandatory arbitration means you give up your right to sue in court. Class action waiver means you can't join others with the same complaint. These clauses aren't inherently evil, but you should know they're there before you sign.

**Output:** Contract overview with parties, term, core exchange, governing law, and dispute resolution mechanism identified.
**Quality gate:** All basic elements are identified. Any missing standard elements are flagged. The person understands what the contract is fundamentally about before getting into details.

### Phase 2: TRANSLATE
**Entry criteria:** Contract scan complete.
**Actions:**
1. Go through the contract section by section and restate each in plain English. Common legalese translations:
   - "Indemnify and hold harmless" = You'll pay for any problems your actions cause, including their legal fees.
   - "Time is of the essence" = Deadlines are hard deadlines. Miss one and they can cancel the whole deal.
   - "Notwithstanding" = Despite what that other section says, this section wins.
   - "Severability" = If a court strikes one clause, the rest of the contract still applies.
   - "Force majeure" = Neither party is at fault if something crazy happens (pandemic, natural disaster, war).
   - "Liquidated damages" = If you break this clause, you owe this specific dollar amount (whether or not that reflects actual harm).
   - "Assigns and successors" = This contract applies even if the company is sold or merged.
2. For employment contracts specifically, translate: compensation (base, bonus structure, equity/options and vesting schedule), benefits (health, retirement, PTO and how it accrues and whether it pays out), at-will provisions (they can fire you anytime for any legal reason, and you can quit anytime), non-compete scope (geography, duration, industry), non-solicitation (can't recruit former coworkers or clients), IP assignment (they own everything you create, sometimes including side projects), and confidentiality (what you can't talk about, and for how long after leaving).
3. For rental/lease agreements, translate: rent terms (amount, due date, grace period, late fees), security deposit (amount, conditions for return, timeline for return after move-out), maintenance responsibilities (who fixes what -- landlord vs. tenant), entry provisions (when can landlord enter and how much notice), renewal terms (auto-renew? month-to-month after term?), early termination (what it costs to break the lease), and prohibited activities.
4. For service agreements, translate: scope of work (exactly what they'll do and -- just as important -- what's excluded), payment terms (when you pay, what triggers payment, what happens if you don't pay), warranties (what they guarantee and for how long), liability caps (the maximum they'll pay if they screw up), and termination (can you cancel? What's the penalty?).
5. Flag every instance of vague language that benefits the drafter. Phrases like "reasonable efforts," "as determined by Company," "at Company's sole discretion," "including but not limited to," and "may be modified at any time" are all flexibility for them and uncertainty for you. These aren't automatically bad, but they should be noticed.

*Note: This skill provides educational contract analysis. It is not legal advice and does not replace review by a qualified attorney, particularly for high-value contracts or complex situations.*

**Output:** Complete plain-English translation of every significant section, with legalese terms decoded and vague language flagged.
**Quality gate:** Every section of the contract has a plain-English equivalent. No jargon remains unexplained. Vague or discretionary language is specifically highlighted.

### Phase 3: RED FLAGS
**Entry criteria:** Translation complete.
**Actions:**
1. Check for one-sided termination rights. Can they end the contract easily while you're locked in? In employment: at-will is standard (both sides can end it), but if they add a non-compete that survives termination, you're locked in even after you're fired. In leases: can the landlord terminate with 30 days notice while you're on a 12-month lease? In service agreements: can they change the terms mid-contract while you can't cancel?
2. Check for overreaching non-competes and NDAs. Red flags in non-competes: duration over 1-2 years, geography that covers the entire country (or "anywhere Company does business"), industry definition so broad it prevents you from working in your field at all, and application even if you're laid off or fired without cause. Red flags in NDAs: overly broad definition of "confidential information" (sometimes written to include publicly known information), survival period of forever, and penalties beyond standard damages.
3. Check for automatic renewal and price escalation traps. Many service contracts and subscriptions auto-renew with a narrow cancellation window (sometimes 30 days before the anniversary, buried in clause 14). Some include automatic price increases ("fees may increase up to 10% annually" or worse, "at Company's discretion"). Missed the cancellation window? You're locked in for another year at a higher price.
4. Check for liability limitations and waivers that go too far. It's standard for a company to limit liability to the amount you've paid them. It's a red flag when they limit liability to nothing while you have unlimited liability to them. Watch for: "under no circumstances shall Company be liable for any damages" combined with your obligation to indemnify them for everything. Also watch for waivers of negligence -- you're agreeing they're not responsible even if they're at fault.
5. Check for intellectual property traps (especially in employment and freelance contracts). Red flags: IP assignment clauses that cover work done on your own time with your own equipment, "work made for hire" clauses in freelance agreements that give them ownership of everything you create (standard for employment, negotiable for freelance), and pre-existing IP carve-outs (you should always list your existing work/IP that's excluded from the assignment).
6. Check for penalty clauses, liquidated damages, and fee triggers. Hidden fees: early termination fees that exceed any reasonable cost to the company, late payment penalties that compound, "administrative fees" triggered by routine activities, and mandatory mediation/arbitration where you pay even if you win. Calculate the worst-case cost scenario -- what's the most this contract could cost you if everything goes wrong?

**Output:** Red flag report with each dangerous clause quoted, risk rating (low/medium/high/critical), plain-English explanation of the risk, and what a fair version of the clause would look like.
**Quality gate:** Every one-sided or unusual clause is identified. Risk ratings are justified with specific reasoning. The person understands the realistic worst-case scenario for each red flag.

### Phase 4: NEGOTIATE
**Entry criteria:** Red flags identified.
**Actions:**
1. Separate the negotiable from the non-negotiable. Big companies with standard agreements (Amazon, gym chains, most landlords) have little room for negotiation on standard terms. Smaller companies, direct employment offers, and service agreements between individuals are usually negotiable. Even with big companies, you can sometimes negotiate: timeline extensions, fee reductions, specific carve-outs, and addendums for things the standard contract doesn't address.
2. Prioritize which red flags to push on. Don't try to renegotiate every clause -- that signals you're difficult and unlikely to sign. Pick the 2-3 most important issues (usually: non-compete scope, liability balance, termination rights, and IP assignment for employment; security deposit terms, maintenance responsibilities, and early termination for leases).
3. Draft alternative language for each clause you want to change. Don't just say "I don't like the non-compete." Say: "I'd like to modify Section 7.2 to limit the non-compete to [12 months instead of 24], [the metropolitan area instead of the entire state], and [direct competitors only instead of the entire industry]." Specific counter-proposals get results. Vague complaints get ignored.
4. Script the negotiation conversation. Template: "I'm excited about [the job/the apartment/the service], and I've reviewed the agreement carefully. I have a few questions about [2-3 specific sections]. My understanding is that [plain English interpretation] -- is that right? I'd feel more comfortable if [specific change]. Is that something we can adjust?" Tone matters: collaborative, not adversarial. You're solving a problem together, not fighting.
5. Know your BATNA (Best Alternative to a Negotiated Agreement). If this deal falls through, what's your next best option? If you have strong alternatives, you can push harder. If this is your only option, you still negotiate -- but you pick your battles more carefully and accept more risk. Never bluff about walking away unless you're actually willing to walk.

**Output:** Prioritized negotiation list, alternative clause language for each issue, conversation scripts, and BATNA assessment.
**Quality gate:** Counter-proposals are specific and reasonable (not "delete the entire non-compete" but a narrowed version). Scripts are conversational and professional. The person knows which points to push hard on and which to concede.

### Phase 5: DECIDE
**Entry criteria:** Red flags and negotiation options assessed.
**Actions:**
1. Create the final summary with three columns: **What's Good** (clauses that are standard or favorable to you), **What's Concerning** (clauses that are unfavorable but manageable), and **What's Dangerous** (clauses that create real risk). This gives a clear visual of the overall balance.
2. Calculate the financial exposure. What's the most this contract can cost you? Include: direct costs (rent, fees, salary foregone from non-compete), penalties (early termination, liquidated damages), and opportunity costs (what you can't do because of non-competes, exclusivity clauses, or IP assignments). Express this as a dollar range from "everything goes fine" to "worst case."
3. Make the recommendation:
   - **Sign as-is:** The contract is balanced, standard for the industry, and the red flags are minor or standard.
   - **Negotiate first:** There are meaningful red flags, but they're fixable and the underlying deal is worth pursuing.
   - **Walk away:** The contract has deal-breaker clauses, the other party has shown they won't negotiate in good faith, or the risk/reward ratio doesn't make sense.
   - **Get an attorney:** The contract involves significant money, complex terms, or high stakes that exceed what self-review can handle.
4. If the recommendation is "sign," provide a pre-signing checklist: verify all blanks are filled in (never sign a contract with empty spaces), ensure all verbal promises are in writing (if they promised something not in the contract, it doesn't exist), keep a complete signed copy for your records, note any important dates or deadlines from the contract on your calendar, and understand how to exercise your rights under the contract (cancellation process, complaint process, etc.).
5. Document the decision. Whether you sign or walk away, note: what the contract covered, key terms, any negotiated changes, why you decided what you decided, and any dates you need to track (renewal, termination window, non-compete expiration). Future you will thank present you for this record.

**Output:** Three-column summary (good/concerning/dangerous), financial exposure calculation, sign/negotiate/walk/lawyer recommendation with reasoning, and pre-signing checklist.
**Quality gate:** Recommendation is clear and justified. Financial exposure is calculated as a range. Every action item has a specific next step. The person can make an informed decision -- not just a trusting one.

## Exit Criteria
Done when: (1) every section of the contract is translated to plain English, (2) all red flags are identified and rated, (3) negotiation strategy is prepared for key issues, (4) clear sign/negotiate/walk recommendation is made with reasoning, (5) the person understands what they're agreeing to and the worst-case scenarios.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| SCAN | Contract is incomplete or missing pages | Flag -- do not proceed with analysis until the complete contract is provided. Missing sections could contain critical terms |
| SCAN | Contract references other documents (exhibits, handbooks, policies) not provided | Flag -- request all referenced documents. "Subject to Company Policy" means the policy IS part of the contract. You need to read it |
| TRANSLATE | Clause is genuinely ambiguous even to professionals | Flag -- note the ambiguity, explain the two (or more) possible interpretations, and recommend asking the other party in writing which interpretation they intend. Their written answer becomes binding context |
| RED FLAGS | Contract contains clauses that may be illegal in the governing jurisdiction | Flag -- note the potentially unenforceable clause, but warn that just because a clause is unenforceable doesn't mean the other party won't try to enforce it. An illegal non-compete still chills your job search even if a court would strike it down |
| NEGOTIATE | Other party says "take it or leave it" on all points | Adjust -- this itself is useful information. A party that refuses any negotiation on a standard contract is telling you how they'll treat you during the contract. Factor this into the decision |
| DECIDE | Stakes are too high for self-review (six-figure employment, business sale, real estate) | Escalate -- recommend attorney review. Provide the analysis as a starting point for the attorney conversation, which will make the attorney's time (and your bill) more efficient |

## State Persistence
- Contract catalog (contracts reviewed, key terms, dates, decisions made)
- Template library of alternative clause language by contract type
- Negotiation outcomes (what was requested, what was accepted, what was rejected)
- Calendar integration for contract milestones (renewal dates, termination windows, non-compete expirations)
- Red flag pattern database (common traps by industry and contract type)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
