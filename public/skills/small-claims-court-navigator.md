# Small Claims Court Navigator

Walks you through suing someone (or defending yourself) in small claims court -- the one court that's actually designed for regular people without lawyers. Helps you figure out if your case is worth pursuing, calculate what you can realistically recover, prepare your evidence so a judge takes you seriously, write your claim clearly, and present it without sounding like a TV lawyer. Small claims court handles disputes up to $5,000-$25,000 depending on your state, and most cases are decided in under an hour. This skill turns "I should sue" into an actual plan.

## Execution Pattern: Phase Pipeline

```
PHASE 1: EVALUATE    --> Determine if you have a case and if it's worth pursuing
PHASE 2: CALCULATE   --> Figure out exactly what you're owed and what you can claim
PHASE 3: PREPARE     --> Gather and organize evidence that wins cases
PHASE 4: FILE        --> Complete the paperwork and get the case on the calendar
PHASE 5: PRESENT     --> Walk into court prepared and walk out with a judgment
```

## Inputs
- dispute_summary: object -- What happened, who's involved (person, business, landlord, contractor, etc.), when it happened, dollar amount at stake
- relationship: string -- Your relationship to the other party: customer, tenant, landlord, neighbor, buyer/seller, employer/employee, contractor/client, former friend/partner
- evidence_available: array -- What you have: contracts, receipts, photos, texts/emails, witness names, expert opinions, written estimates, bank statements
- prior_attempts: object -- (Optional) What you've already tried: direct conversation, demand letter, mediation, complaints to agencies, attorney consultation
- jurisdiction: object -- State and county where the dispute occurred or where the defendant lives

## Outputs
- case_assessment: object -- Honest evaluation of case strength, likely outcome, and whether it's worth pursuing
- damages_calculation: object -- Itemized list of what you're claiming with documentation for each amount
- evidence_package: object -- Organized evidence with presentation order and key points for each piece
- court_filing: object -- Completed claim form content, filing procedures, and service requirements
- presentation_script: object -- Opening statement, evidence presentation order, anticipated defenses, and closing argument

## Execution

### Phase 1: EVALUATE
**Entry criteria:** Person has a dispute involving money and is considering small claims court.
**Actions:**
1. Determine if small claims court is the right venue. Check:
   - **Dollar limit:** Every state has a cap -- from $2,500 (Kentucky) to $25,000 (Tennessee). If your claim exceeds the limit, you can either reduce your claim to the maximum (waiving the excess) or file in regular civil court (which usually requires a lawyer). Sometimes it's worth claiming less to stay in small claims.
   - **Claim type:** Small claims handles most money disputes: unpaid debts, security deposit returns, property damage, breach of contract, defective products/services, car accident damage. It generally does NOT handle: evictions (separate process), divorce/custody, name changes, or injunctions (ordering someone to do/stop something).
   - **Statute of limitations:** Every type of claim has a filing deadline. Written contracts: typically 4-6 years. Oral contracts: 2-4 years. Property damage: 2-6 years. Personal injury: 1-3 years. If the deadline has passed, your case is dead regardless of merit.
2. Honestly assess your case strength. You need to prove your claim by a "preponderance of evidence" (more likely than not -- about 51%). Ask yourself:
   - Do you have a clear agreement (written or verbal) that was broken?
   - Can you prove the other party was responsible for the damage/loss?
   - Can you prove the dollar amount with receipts, estimates, or other documentation?
   - If it's your word against theirs with no documentation, your case is weak. Courts can't read minds -- they follow evidence.
3. Consider the collectability problem. Winning a judgment and collecting money are two completely different things. A judgment against someone who has no job, no assets, and no bank account is a piece of paper. Before filing, consider: does this person or business have assets? Are they still operating? Have others successfully collected from them? A judgment is typically enforceable for 10-20 years and can accrue interest, so even if they can't pay now, it may be worth having.
4. Calculate the cost-benefit. Filing fees range from $30-$200 depending on the claim amount and state. Service of process costs $20-$75. You'll likely take a half-day off work for the hearing. If you're claiming $500 and it costs you $250 in fees and lost wages, is the principle worth it? (Sometimes yes -- sometimes the answer is "absolutely, this person needs to be held accountable." That's a valid reason.)
5. Attempt resolution one more time before filing. Send a formal demand letter (via certified mail) that states: what happened, what you're owed, the evidence you have, and that you'll file in small claims court if the matter isn't resolved within 14 days. Many disputes settle at this stage. Plus, the judge will want to see that you tried to resolve it -- showing up in court without having attempted direct resolution looks bad.

*Note: This skill provides general guidance about small claims court procedures. It is not legal advice and does not replace consultation with a qualified attorney. Court procedures vary by jurisdiction.*

**Output:** Case viability assessment covering jurisdiction, claim type, statute of limitations, case strength, collectability, and cost-benefit analysis.
**Quality gate:** The dollar limit for the specific jurisdiction is verified. Statute of limitations is checked against the date of the incident. An honest case strength assessment is provided (not just "you have a great case" cheerleading). A demand letter has been sent or is being prepared.

### Phase 2: CALCULATE
**Entry criteria:** Case is viable and worth pursuing.
**Actions:**
1. Itemize actual damages -- what you actually lost. Categories:
   - **Direct financial loss:** Money paid for goods or services not received, security deposit not returned, property damaged or stolen, medical bills from an injury. Each item needs a receipt, bank statement, or estimate to support it.
   - **Cost of repair or replacement:** Get at least 2 written estimates from qualified vendors. Courts want to see fair market value or reasonable repair costs, not your emotional attachment to the item. A 10-year-old laptop isn't worth what a new one costs.
   - **Consequential damages:** Additional losses caused by the breach. Example: contractor didn't finish the work, so you had to pay someone else more money, AND you had to stay in a hotel while the work was redone. The hotel cost is consequential damages.
   - **Lost income:** If the dispute caused you to miss work (not just the court date). Document with pay stubs or employer letter.
2. Understand what you CAN'T claim in most small claims courts: pain and suffering (generally not available), punitive damages (some states allow them, most small claims courts don't), attorney fees (because you typically can't have an attorney in small claims), emotional distress (rare in small claims), and your time spent on the dispute (you're not billing for your "research hours").
3. Check for statutory damages. Some situations have specific legal penalties:
   - Security deposit: Many states award 2x or 3x the deposit if the landlord wrongfully withheld it.
   - Bad checks: Often 2-3x the check amount plus fees.
   - Consumer protection violations: Many state consumer protection acts allow treble (3x) damages.
   - Unfair business practices: Depending on the statute, additional penalties may apply.
   If statutory damages apply, they can significantly increase your claim.
4. Calculate pre-judgment interest. Many states allow interest on the amount owed from the date payment was due until the judgment date. Rates vary by state (typically 5-12% annually). On a $5,000 claim that's been unpaid for 2 years at 10%, that's $1,000 in interest. Include this in your claim.
5. Create the final damages summary. Build a clear, itemized spreadsheet:
   | Item | Amount | Supporting Evidence |
   | Security deposit not returned | $1,500 | Lease agreement, move-out photos, certified mail receipt |
   | Cleaning supplies to repair damage beyond landlord's claim | $85 | Receipt |
   | Statutory penalty (2x deposit per [State Statute]) | $3,000 | Statute citation |
   | Pre-judgment interest (12 months at X%) | $150 | Calculation sheet |
   | **Total Claimed** | **$4,735** | |

**Output:** Itemized damages calculation with supporting evidence for each item, statutory damage analysis, interest calculation, and total claim amount.
**Quality gate:** Every dollar claimed has a corresponding piece of evidence or legal basis. Statutory damages are verified for the specific jurisdiction. The total doesn't exceed the small claims court limit. The itemization is clear enough that a judge can follow it in 30 seconds.

### Phase 3: PREPARE
**Entry criteria:** Damages calculated and evidence identified.
**Actions:**
1. Organize your evidence into a presentation package. Make 3 copies of everything: one for you, one for the judge, and one for the defendant. Organize chronologically and number each exhibit. Include:
   - **Exhibit list:** One page listing every piece of evidence with a brief description.
   - **Exhibit 1:** The contract, lease, agreement, or receipt that establishes the relationship and terms.
   - **Exhibits 2-N:** Evidence of breach, damage, and losses -- in chronological order.
   - **Final exhibit:** Your demand letter and proof it was sent and received (certified mail receipt).
2. Prepare your witnesses. If someone saw what happened or can verify your claims (a contractor who assessed the damage, a friend who was present, a neighbor who witnessed the incident), ask them to come to court. Brief them on: what you'll ask them, to speak only to what they personally saw or know (not what you told them), and to address the judge (not the other party). If a witness can't attend, a signed written statement is better than nothing but much weaker than live testimony.
3. Anticipate the other side's defense. Common defenses and how to counter them:
   - "We never agreed to that." Counter: show the written agreement, email confirmation, or text messages. If it was verbal, show corroborating evidence (partial payment implies agreement).
   - "The damage was pre-existing." Counter: show before/after photos with timestamps.
   - "You caused the problem." Counter: show your compliance with the agreement/lease/contract.
   - "We already resolved this." Counter: show that no payment was received, no repair was made, or the resolution they claim didn't happen.
   - "The amount is wrong." Counter: present your itemized calculation with supporting documentation.
4. Create your timeline. On one page, list every relevant event chronologically with dates:
   - Date of agreement/lease/purchase
   - Date problem occurred or was discovered
   - Date you reported the problem
   - Date of any response (or note: no response)
   - Date of demand letter
   - Date demand letter deadline passed with no resolution
   - Date of filing
   Judges love timelines. They make complex situations simple.
5. Practice your presentation. You'll have 10-15 minutes to present your case. Practice telling the story: what happened, what the other side did (or didn't do), what it cost you, and what you're asking for. Time yourself. If it takes more than 10 minutes to tell the story, you're including too much detail. Focus on facts, not feelings. "The landlord didn't return my deposit" is a fact. "The landlord is a terrible person" is not helpful.

**Output:** Numbered exhibit package (3 copies), witness preparation notes, defense anticipation and counter-arguments, one-page chronological timeline, and practiced presentation outline.
**Quality gate:** Exhibits are numbered, labeled, and organized chronologically. Three complete copies exist. The timeline fits on one page. The presentation can be delivered in under 10 minutes. At least 2-3 likely defenses have prepared counter-arguments.

### Phase 4: FILE
**Entry criteria:** Evidence package is assembled.
**Actions:**
1. Get the correct court forms. Go to your county courthouse website or the clerk's office. You'll need:
   - **Claim form (Plaintiff's Claim and ORDER to Go to Small Claims Court or equivalent):** This is where you state who you're suing, why, and for how much. Fill it out clearly -- hand-written is fine if it's legible, typed is better.
   - **Proof of service form:** You'll need this after the defendant is served.
   - Some courts have additional required forms (mediation requests, corporate representative designations).
2. Write the claim clearly. The claim description is typically limited to a few sentences or a small box on the form. Be direct:
   - BAD: "The landlord was negligent and breached the implied warranty of habitability and the covenant of quiet enjoyment and various statutory duties under the state landlord-tenant act..."
   - GOOD: "Landlord failed to return $1,500 security deposit within the required 30 days after I moved out on [date]. Unit was left in good condition (photos attached). Demand letter sent [date] with no response. Claiming deposit return plus statutory penalty per [State Code Section]."
3. File at the courthouse. Bring: your completed forms, copies (courts typically want the original plus 2 copies), filing fee (check the amount online -- ranges from $30-$200 based on claim amount, check or money order typically required, some courts accept credit cards). File in: the county where the defendant lives, where the business is located, or where the transaction occurred (rules vary by state -- check which is correct for your situation).
4. Serve the defendant. The defendant must be officially notified of the lawsuit. You CANNOT serve them yourself. Options:
   - **Certified mail:** Court clerk sends it (cheapest, $20-30, but the defendant can refuse to sign).
   - **Process server:** A professional delivers the papers ($50-100, most reliable).
   - **Sheriff/marshal:** Local law enforcement serves them ($40-75, depends on jurisdiction).
   - **Substituted service:** If the defendant is avoiding service, you may serve another adult at their home or business. Requires court permission in some states.
   - Keep the proof of service -- you can't proceed without it.
5. Prepare for the hearing date. Mark the calendar (typically 4-8 weeks after filing). Note: the defendant may file a counterclaim against you (they claim you owe them). If they do, prepare a defense against their claim the same way you prepared your case -- with evidence, timeline, and a clear presentation. Some courts require mediation before the hearing -- take it seriously, as many cases settle at mediation.

**Output:** Completed claim form content, filing procedure checklist with specific courthouse information, service of process plan, and hearing preparation timeline.
**Quality gate:** Claim form is complete and clear. Filing fee amount is verified. Service method is selected and scheduled. Hearing date is calendared with preparation milestones.

### Phase 5: PRESENT
**Entry criteria:** Case is filed, defendant is served, and hearing date is set.
**Actions:**
1. Courtroom preparation. Arrive 30 minutes early. Dress like you would for a job interview (business casual minimum -- first impressions matter to judges). Bring: your evidence binder (3 copies), a notepad and pen, any witnesses, and your photo ID. Turn off your phone. If the hearing is virtual (some courts offer this), test your technology the day before and have a quiet, well-lit location.
2. Deliver your opening statement (30-60 seconds). Structure: "Your Honor, I am [name]. I am here because [one sentence summary of the dispute]. I am seeking [$amount] because [one sentence on why]. I have [type of evidence] to support my claim." That's it. Don't argue your case yet -- just set the stage.
3. Present your evidence in order. Walk through each exhibit:
   - "Your Honor, Exhibit 1 is the lease agreement showing the security deposit of $1,500 paid on [date]."
   - "Exhibit 2 is a photograph of the apartment on move-out day, showing [condition]."
   - "Exhibit 3 is the demand letter sent by certified mail on [date], with the return receipt showing it was received."
   - Hand the judge their copy as you reference each exhibit. Hand the defendant their copy. Be organized -- fumbling through papers kills credibility.
4. Handle the defendant's presentation. Listen without interrupting (the judge will give you a chance to respond). Take notes on anything you disagree with. When it's your turn to respond:
   - Stick to facts, not emotions: "The defendant claims the carpet was damaged, but Exhibit 4 shows the carpet's condition on move-out day."
   - If they present evidence you haven't seen, ask the judge for a moment to review it.
   - Don't argue with the defendant directly -- address the judge. "Your Honor, the defendant's claim that I never sent a demand letter is contradicted by Exhibit 3, the certified mail receipt."
5. Deliver your closing (30-60 seconds). Structure: "Your Honor, the evidence shows that [summary of what you proved]. I am asking for [$total amount], which includes [quick breakdown]. Thank you." Then stop talking. The strongest closing is short and confident.
6. After the judgment. If you win: the judge may issue the judgment immediately or mail it. Once you have the judgment, the defendant typically has 30 days to pay. If they don't, you'll need to enforce it through: wage garnishment, bank levy, property lien, or debtor's examination (the court orders them to disclose their assets). If you lose: determine whether you have the right to appeal (not all small claims courts allow plaintiff appeals -- some only allow defendant appeals). Consider whether the appeal is worth the additional time and effort.

**Output:** Courtroom preparation checklist, opening statement script, evidence presentation sequence, anticipated defense responses, closing statement, and post-judgment collection plan.
**Quality gate:** Opening and closing statements are under 60 seconds each. Evidence presentation follows the numbered exhibit order. At least 3 anticipated defenses have prepared responses. Post-judgment collection strategy is identified.

## Exit Criteria
Done when: (1) case viability is honestly assessed, (2) damages are calculated and itemized with evidence, (3) evidence package is organized in presentation-ready format with 3 copies, (4) claim is filed and defendant is served, (5) presentation is prepared and practiced, (6) post-judgment plan (collection or appeal) is considered.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| EVALUATE | Claim exceeds small claims limit | Adjust -- either reduce the claim to the limit (waiving the excess) or consult an attorney about filing in regular civil court. Sometimes the simplicity and speed of small claims is worth leaving money on the table |
| EVALUATE | Statute of limitations may have passed | Escalate -- consult a legal aid attorney to confirm the specific limitation period. Some circumstances toll (pause) the clock. Don't file if the limitation has passed -- you'll waste filing fees and the defendant may countersue for costs |
| CALCULATE | No receipts or documentation for expenses | Adjust -- get retroactive estimates from vendors, check bank/credit card statements for transaction records, check email for confirmation emails. If no documentation exists, your testimony is evidence but it's weaker. Be honest about the amount |
| PREPARE | Can't find the other party to serve them | Adjust -- try skip tracing (search public records, social media, prior addresses). Some courts allow service by publication (newspaper notice) as a last resort. A process server can often find people you can't |
| FILE | Filed in the wrong court | Adjust -- the case may be transferred or dismissed. Re-file in the correct court before any deadlines pass. If the defendant raises a jurisdiction objection, this needs to be resolved before the case proceeds |
| PRESENT | Defendant doesn't show up | Proceed -- request a default judgment. The judge may grant your full claim amount or may still require you to present evidence. Be prepared either way |
| PRESENT | You lose the case | Assess -- determine appeal eligibility and deadline. If no appeal is available, consider whether a new claim could be filed on different grounds (unlikely but sometimes possible). Accept the outcome if the evidence didn't support your case |

## State Persistence
- Case file (all documents, evidence, correspondence, and court filings)
- Deadline tracker (filing deadline, service deadline, hearing date, appeal window)
- Evidence inventory (what exists, what's needed, what's been submitted)
- Cost tracker (filing fees, service costs, lost wages, total invested in the case)
- Judgment details (amount, date, payment deadline, enforcement actions taken)
- Collection efforts (demand for payment sent, garnishment filed, lien recorded)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
