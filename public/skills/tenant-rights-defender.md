# Tenant Rights Defender

Helps you know your rights as a renter, deal with landlord problems, and protect yourself when things go sideways. Covers the stuff that actually comes up: getting your security deposit back, handling repair requests that get ignored, fighting unfair rent increases, drafting demand letters that get results, negotiating from a position of knowledge, and planning your exit when it's time to leave a bad situation. Most tenants don't know they have significantly more legal protection than they think -- landlords count on that ignorance. This skill levels the playing field.

## Execution Pattern: Phase Pipeline

```
PHASE 1: RIGHTS CHECK --> Know exactly what protections apply in your jurisdiction
PHASE 2: DOCUMENT     --> Build your evidence file before you need it
PHASE 3: COMMUNICATE  --> Draft demand letters and formal complaints that get results
PHASE 4: NEGOTIATE    --> Leverage your position to get repairs, refunds, or fair treatment
PHASE 5: EXIT PLAN    --> Get out cleanly with your deposit and your record intact
```

## Inputs
- location: object -- State and city/county (tenant law is hyper-local -- your city may have protections your state doesn't)
- lease_details: object -- Lease type (month-to-month, fixed term), monthly rent, security deposit amount, lease start/end dates, landlord type (individual, property management company, corporate)
- issue: object -- What's going on: repair needed and being ignored, security deposit dispute, rent increase, harassment, privacy violations (unauthorized entry), habitability problems, retaliation, discrimination, lease violation accusation, eviction threat
- documentation: array -- (Optional) What evidence you already have: photos, texts/emails with landlord, repair requests sent, inspection reports, rent receipts, lease copy
- goals: object -- What you want: get the repair done, get money back, reduce rent, break the lease, stay and improve conditions, or leave cleanly

## Outputs
- rights_summary: object -- Your specific legal rights based on jurisdiction, with relevant statute citations
- evidence_plan: object -- What to document, how to document it, and how to store it
- demand_letter: string -- Ready-to-send formal communication to landlord with legal basis
- negotiation_strategy: object -- Leverage points, escalation ladder, and settlement targets
- exit_checklist: object -- Step-by-step plan for leaving the unit with deposit and references intact

## Execution

### Phase 1: RIGHTS CHECK
**Entry criteria:** Location and issue type identified.
**Actions:**
1. Identify the applicable tenant protection laws. These layer on top of each other:
   - **Federal:** Fair Housing Act (protects against discrimination based on race, color, national origin, religion, sex, familial status, disability). Applies everywhere.
   - **State:** Every state has landlord-tenant statutes covering: security deposit limits and return timelines, habitability requirements, entry notice requirements, retaliation protections, eviction procedures. Look up your state's specific statute.
   - **Local/City:** Many cities have additional protections: rent control or stabilization, just cause eviction requirements, relocation assistance for no-fault evictions, enhanced habitability standards, tenant organizing rights. Cities like NYC, LA, San Francisco, Chicago, Portland, Seattle, and DC have significantly stronger tenant protections than their states.
2. Determine what "warranty of habitability" means in your jurisdiction. In almost every state, landlords must provide: structural integrity (roof doesn't leak, walls are sound), working plumbing and hot water, adequate heating (and cooling in some states), electricity in working condition, absence of pest infestations, working smoke and carbon monoxide detectors, locks on exterior doors, and compliance with local building and health codes. If any of these are broken, you have legal leverage.
3. Know your security deposit rights. Common protections most tenants don't know about: maximum deposit amounts (often 1-2 months' rent by law), requirements for the landlord to hold the deposit in a separate account, mandatory itemized deduction statements within a specific timeframe after move-out (14-30 days in most states), prohibition against deducting normal wear and tear, and penalty provisions if the landlord doesn't follow the rules (some states award 2x or 3x the deposit amount).
4. Understand retaliation protections. In most states, it's illegal for a landlord to raise your rent, decrease services, or threaten eviction in response to: filing a complaint with a housing agency, requesting legally required repairs, organizing or joining a tenant association, or exercising any legal right. Many states presume retaliation if adverse action happens within 60-180 days of protected activity.
5. Know the eviction rules. Landlords cannot just change the locks, shut off utilities, remove your belongings, or threaten you out. These "self-help evictions" are illegal everywhere. Legal eviction requires: proper written notice (3-30+ days depending on state and reason), a court filing, a court hearing where you can defend yourself, and a court-ordered removal executed by law enforcement. You have the right to appear in court and present your case. Many evictions are won by tenants who simply show up.

*Note: This skill provides general legal education about tenant rights. It is not legal advice and does not replace consultation with a qualified attorney or legal aid organization. Tenant law varies significantly by jurisdiction.*

**Output:** Jurisdiction-specific rights summary covering habitability, security deposits, retaliation, eviction procedures, and any special local protections, with statute references.
**Quality gate:** Rights are specific to the person's city and state (not generic "most states" language wherever possible). Relevant statutes are cited by name or code section. Any local protections beyond state law are identified.

### Phase 2: DOCUMENT
**Entry criteria:** Rights are understood and an issue needs to be addressed.
**Actions:**
1. Start the evidence file immediately. From this moment forward, every interaction with your landlord should be documented. Create a folder (physical and digital) with:
   - **Communications log:** Every text, email, voicemail, letter, and in-person conversation. For in-person conversations, follow up with an email: "Per our conversation today, you said [X]. Please let me know if I've misunderstood." This creates a written record of verbal agreements.
   - **Photo/video evidence:** Timestamp everything. For habitability issues: photograph the problem with a newspaper or phone screen showing the date visible in the shot. Take video of water leaks, pest infestations, heating failures (show thermostat reading and your breath in the cold). Before/after for any damage.
   - **Timeline:** Chronological log of events: when the problem started, when you reported it, landlord's response (or lack thereof), any follow-up requests, current status.
2. For repair issues: document the formal request chain. Step 1: Written request (email or certified letter, not just a phone call) describing the problem, referencing the habitability requirement, and requesting repair within a reasonable timeframe (typically 14-30 days for non-emergency, 24-48 hours for emergencies like no heat in winter or a gas leak). Step 2: Follow-up request if no response after half the reasonable timeframe. Step 3: Notice of intent to exercise legal remedies (repair and deduct, rent escrow, or complaint to housing authority).
3. For security deposit protection: document the unit condition at move-in AND now. If you didn't take move-in photos (most people don't), document current condition thoroughly and note anything that was pre-existing when you moved in. When you eventually move out, do a video walkthrough of every room, every wall, every appliance, and every fixture the day you hand back keys. This video is your most powerful weapon in a deposit dispute.
4. For harassment or privacy violations: log every incident with date, time, and what happened. If the landlord is entering without proper notice, install a simple door camera or use a time-stamped security app. Most states require 24-48 hours written notice before entry except for genuine emergencies. "Showing the unit to prospective tenants" doesn't override notice requirements.
5. Get third-party documentation when possible. Code enforcement inspection reports, health department reports, photos from guests who witnessed conditions, written statements from neighbors experiencing the same issues, and reports from any utility companies or repair services who assessed the problem. Third-party evidence is more persuasive than your word alone.

**Output:** Evidence file structure, documentation templates, formal repair request chain, and inventory of existing evidence with gaps identified.
**Quality gate:** Every communication going forward will be in writing or confirmed in writing. Photos/videos are timestamped. The timeline is chronological and complete. At least one form of third-party evidence is identified or planned.

### Phase 3: COMMUNICATE
**Entry criteria:** Evidence is assembled and specific rights violations identified.
**Actions:**
1. Draft the initial formal request. This is not the demand letter -- it's the "I'm being reasonable and giving you a chance to fix this" letter. Template structure:
   - State the problem factually (no emotions, no accusations)
   - Reference the specific lease provision or law that requires the landlord to act
   - State what you're requesting (specific repair, deposit return, policy change)
   - Give a reasonable deadline (14-30 days for most issues, 48 hours for emergencies)
   - State that you're documenting everything and will pursue appropriate remedies if the issue isn't resolved
   - Send via email AND certified mail (the certification proves they received it)
2. If the initial request is ignored, draft the demand letter. This escalates the tone and specifics. Template structure:
   - Reference your previous communication (date sent, no response received)
   - Restate the issue with all evidence listed (photos attached, dates documented)
   - Cite the specific statute they're violating and the legal consequences
   - State your specific demand (repair by [date], return deposit of [$amount], rent reduction of [$amount])
   - State what you will do if the demand isn't met (file complaint with [agency], pursue repair-and-deduct, seek legal remedies in [small claims court])
   - Give a final deadline (7-14 days)
   - This letter should be firm but professional -- no threats, no insults, no all-caps
3. File complaints with the appropriate agencies. Depending on the issue:
   - **Habitability/code violations:** Local building/code enforcement, health department
   - **Discrimination:** HUD (federal), state human rights commission, local fair housing agency
   - **Illegal practices:** State attorney general's consumer protection division
   - **General landlord-tenant disputes:** Local tenant rights organizations, legal aid
   - Many agencies will inspect and issue violation notices to the landlord. An official violation notice is powerful leverage.
4. For rent withholding or repair-and-deduct (where legally available): follow your state's procedure exactly. Typically: written notice of the problem, reasonable time for landlord to act, the problem must affect habitability (not cosmetic), and in rent escrow states, you pay rent into a court-held account (not just stop paying). Skipping any step can turn your legitimate claim into an eviction for non-payment.
5. Keep copies of everything you send. Print emails. Keep certified mail receipts. Screenshot text messages. Back up digital files. If this goes to court, your organized documentation file will be your most powerful asset.

**Output:** Formal request letter, demand letter (if escalation needed), agency complaint filings identified, and complete copies of all communications.
**Quality gate:** Every letter cites specific lease provisions or statutes. Deadlines are reasonable and specific. Tone is professional throughout. The escalation is proportional to the issue. All communications are saved and organized.

### Phase 4: NEGOTIATE
**Entry criteria:** Communication has been sent and you're either in dialogue or preparing for it.
**Actions:**
1. Assess your leverage. You have more than you think:
   - **Legal leverage:** Specific statute violations give you the right to file complaints, withhold rent (where legal), repair and deduct, or sue in small claims court.
   - **Financial leverage:** Evicting you costs the landlord $3,000-10,000+ in legal fees, lost rent during the process (2-6 months), and unit turnover costs. A reasonable settlement is almost always cheaper than eviction.
   - **Reputational leverage:** Bad reviews on Google, Yelp, and apartment review sites. Complaints to the Better Business Bureau. Social media (use carefully and factually -- defamation is real).
   - **Regulatory leverage:** Code enforcement violations can result in fines, required repairs, and in extreme cases, orders to vacate (which trigger relocation assistance in many jurisdictions).
2. Set your negotiation targets. Define three levels:
   - **Ideal outcome:** Everything you want (full repair, full deposit return, rent reduction).
   - **Acceptable outcome:** The minimum that makes staying (or leaving) worthwhile.
   - **Walk-away point:** Below this, you escalate to legal remedies or move out.
   Having these defined before you negotiate prevents emotional decision-making.
3. Use the "reasonable tenant" approach. Frame everything as: "I want to resolve this without involving [courts/agencies/lawyers]. I think a fair resolution is [specific request]. I'm confident in my legal position because [cite evidence and law], but I'd rather we handle this directly." This signals that you know your rights, you're reasonable, and you'll escalate if needed -- all without making threats.
4. Get any agreement in writing. Verbal agreements are worth the paper they're not printed on. If the landlord agrees to make repairs, reduce rent, return a deposit, or change any terms: put it in a simple written agreement signed by both parties. Template: "Landlord agrees to [specific action] by [specific date]. If [action] is not completed by [date], tenant may [specific remedy]. This agreement supplements the existing lease dated [date]."
5. Know when to bring in reinforcements. If the landlord has an attorney, you should consider one. Many areas have free or low-cost legal aid for tenants. Tenant unions and advocacy organizations can provide support, advice, and sometimes representation. For disputes under your state's small claims limit ($5,000-$15,000 depending on state), small claims court is designed for people without lawyers.

**Output:** Leverage assessment, negotiation targets (ideal/acceptable/walk-away), conversation scripts, written agreement template, and escalation plan if negotiation fails.
**Quality gate:** Leverage points are specific and documented (not just "you have rights"). Targets are realistic dollar amounts or specific actions. Written agreement template is ready to use. Escalation path is defined with specific next steps.

### Phase 5: EXIT PLAN
**Entry criteria:** Decision to leave has been made or is being evaluated.
**Actions:**
1. Review your lease termination provisions. Key questions: How much notice is required (typically 30-60 days)? Is there an early termination clause and fee? Does the lease require specific move-out procedures (professional cleaning, walk-through scheduling)? Are there auto-renewal provisions you need to avoid? Send termination notice in writing via certified mail, even if your lease says email is fine -- certified mail is proof.
2. Maximize your security deposit recovery. Before move-out: repair anything you damaged beyond normal wear and tear (fill nail holes, touch up paint if required by lease, replace burned-out bulbs, deep clean). The day you move out: do a thorough video walkthrough, take photos of every room from multiple angles, and note the condition of appliances, fixtures, floors, and walls. If possible, schedule a walk-through WITH the landlord and get written acknowledgment of the unit's condition.
3. Know the difference between "normal wear and tear" and "damage." Normal wear and tear (landlord CANNOT deduct): faded paint, minor scuffs on walls, worn carpet from regular use, small nail holes from hanging pictures, loose door handles from normal use. Damage (landlord CAN deduct): holes in walls, stained or burned carpet, broken fixtures, unauthorized paint colors, pet damage. If the landlord tries to deduct for normal wear and tear, dispute it in writing citing your state's statute.
4. If you need to break the lease early, know your options:
   - **Mutual agreement:** Ask the landlord. If they can re-rent quickly, they may agree to a reduced penalty or no penalty. Get it in writing.
   - **Constructive eviction:** If habitability violations make the unit unlivable and the landlord hasn't fixed them despite proper notice, you may have grounds to leave without penalty. Document everything.
   - **Domestic violence:** Most states have provisions allowing survivors to break leases without penalty with proper documentation.
   - **Military deployment:** Federal SCRA protects service members.
   - **Landlord violation:** If the landlord has materially violated the lease (illegal entry, failure to maintain), you may have grounds to terminate.
   - **Paying the fee:** Sometimes the early termination fee (typically 1-2 months' rent) is simply worth paying to get out of a bad situation. Calculate whether it's cheaper than staying.
5. Protect your rental history. Even in a bad situation, try to leave cleanly: give proper notice, pay final rent on time, return keys formally (get a receipt), and leave the unit clean. Ask for a reference letter from the landlord if the relationship is at all salvageable. If you end up in a dispute, potential future landlords will hear your side -- but they'll call your previous landlord first. If you're worried about a bad reference, know that landlords in most states can only confirm dates of tenancy, rent amount, and whether you'd be re-rented to (yes/no). Defamatory statements open them to liability.

**Output:** Move-out timeline with deadlines, security deposit maximization checklist, early termination options with costs, and rental history protection plan.
**Quality gate:** Notice is given in proper form and timeframe. Move-out documentation plan is thorough. Security deposit rights are understood with specific dollar thresholds for disputing deductions. Next housing plan accounts for reference management.

## Exit Criteria
Done when: (1) tenant knows their specific jurisdiction rights with statute references, (2) evidence is documented and organized, (3) formal communications are drafted and sent, (4) negotiation strategy is prepared with specific targets, (5) exit plan is in place with deposit maximization and reference protection.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| RIGHTS CHECK | Can't determine local tenant protections | Adjust -- contact local legal aid or tenant rights organization. Call the local housing authority. Most have a hotline for tenant questions. Use state law as the baseline while researching local additions |
| DOCUMENT | No evidence was collected from the beginning of the issue | Adjust -- start documenting now. Take current photos, send a written summary of the history to the landlord ("as you know, I first reported this issue on [estimated date]"), and have witnesses write statements about conditions they've seen |
| COMMUNICATE | Landlord becomes threatening or hostile after demand letter | Escalate -- if threats include illegal action (changing locks, shutting off utilities, physical intimidation), contact police for the criminal aspects and a tenant attorney for the civil aspects. Document every threat |
| COMMUNICATE | Landlord ignores all communications | Adjust -- proceed with agency complaints and legal remedies. Silence is not a defense. Send a final notice stating that you're interpreting silence as refusal and will proceed accordingly |
| NEGOTIATE | Landlord hires an attorney who sends aggressive letters | Adjust -- don't panic. Attorney letters are a negotiation tactic. Respond factually, stick to your documented position, and consult legal aid. Many aggressive letters are bluffs hoping you'll fold |
| EXIT PLAN | Landlord wrongfully withholds security deposit | Escalate -- send a demand letter citing the security deposit statute and penalty provisions. If no response within 14 days, file in small claims court. In many states, wrongful withholding entitles you to 2-3x the deposit plus attorney fees |

## State Persistence
- Jurisdiction-specific rights database (state and local laws applicable to this person)
- Communication log (every letter, email, and notice with dates and delivery confirmation)
- Evidence inventory (photos, videos, documents, third-party reports with dates)
- Timeline of events (chronological record from issue start to resolution)
- Negotiation history (what was offered, what was countered, what was agreed)
- Lease terms and key dates (renewal, termination window, security deposit return deadline)
- Agency complaint tracking (where filed, reference numbers, status, outcomes)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
