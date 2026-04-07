# Will and Estate Basics

Helps you create a will, name beneficiaries correctly, pick the right executor, and understand what probate actually is -- without paying $3,000 for an attorney to do what you can handle yourself (for straightforward situations). This is for regular people with regular lives: a house, some savings, a retirement account, maybe some kids who need guardians. If you own a business, have a blended family, or your net worth triggers estate taxes, you still need a lawyer -- but this skill gets 80% of people through the process and helps the other 20% show up to the attorney meeting prepared instead of clueless.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY    --> What do you actually own and owe?
PHASE 2: DECISIONS    --> Who gets what, and who's in charge?
PHASE 3: DRAFT        --> Create the will document with proper language
PHASE 4: EXECUTE      --> Sign it correctly so it's actually legal
PHASE 5: PROTECT      --> Store it safely and plan for probate
```

## Inputs
- personal_info: object -- Name, state of residence, marital status, children (names and ages), any prior marriages, dependents (elderly parents, disabled family members)
- assets: object -- Home (value, how title is held), bank accounts, retirement accounts (401k, IRA), investment accounts, vehicles, life insurance, valuable personal property, business interests
- debts: object -- Mortgage, car loans, student loans, credit card debt, any other obligations
- family_situation: object -- Marital status, children from current and prior relationships, anyone with special needs, family members you want to include or exclude, any anticipated conflicts over inheritance
- existing_documents: object -- (Optional) Prior will, trust, power of attorney, beneficiary designations on accounts, life insurance policies

## Outputs
- asset_inventory: object -- Complete list of what passes through the will vs. what passes outside the will (beneficiary designations, joint ownership)
- distribution_plan: object -- Who gets what, with contingencies for "what if they die first"
- will_template: string -- Complete will document template customized to the person's situation
- executor_guide: object -- What the executor needs to know and do, with a practical checklist
- probate_overview: object -- What probate involves in the person's state, how to minimize it, and timeline

## Execution

### Phase 1: INVENTORY
**Entry criteria:** Basic personal and financial information provided.
**Actions:**
1. Separate assets into two critical categories -- most people don't know this distinction exists, and it's the most important concept in estate planning:
   - **Probate assets (pass through the will):** Assets in your name alone with no beneficiary designation -- individually owned bank accounts, solely owned real estate, personal property (furniture, jewelry, vehicles titled only in your name), business interests.
   - **Non-probate assets (pass OUTSIDE the will, regardless of what the will says):** Joint accounts with survivorship rights (go to the surviving owner), retirement accounts with named beneficiaries (go to the beneficiary), life insurance with named beneficiaries, payable-on-death (POD) and transfer-on-death (TOD) accounts, property in a trust. Your will does NOT control these. If your will says "everything to my spouse" but your IRA beneficiary is your ex, the ex gets the IRA. Period.
2. List every asset and classify it. For each one note: approximate value, how it's titled (sole, joint, TOD/POD), and whether a beneficiary is designated. This exercise alone is worth the time -- most people find at least one surprise (an old account with a wrong beneficiary, a forgotten life insurance policy, a property with outdated title).
3. List every debt and understand what happens to it. Key rules:
   - **Secured debt (mortgage, car loan):** Stays with the asset. If you leave the house to your kid, the mortgage goes too unless life insurance or other assets cover it.
   - **Unsecured debt (credit cards, medical bills, personal loans):** Paid from the estate before anyone inherits. If the estate can't cover the debt, creditors are out of luck -- your heirs don't inherit your credit card debt (exception: if they're joint account holders or co-signers, or in community property states for spousal debt).
   - **Student loans:** Federal loans die with you. Private loans may have death discharge provisions or may pass to co-signers.
   - **Tax debt:** IRS can collect from the estate. This doesn't go away.
4. Calculate the net estate. Total assets minus total debts. This gives you a sense of what you're actually distributing. Also check: is your estate above the federal estate tax exemption ($13.61 million in 2024 for individuals, $27.22 million for married couples)? If yes, you need an estate attorney for tax planning. If no (which is most people), estate taxes aren't your problem.
5. Identify the items that will cause the most conflict. It's rarely the big assets -- the house and retirement accounts usually go to the spouse or are split evenly. The fights happen over: personal items with sentimental value (Mom's ring, Dad's tools, the family photos), unequal distributions that feel like favoritism, and surprises (finding out a sibling was secretly given money, or that a new partner is inheriting everything). Addressing these proactively in the will prevents them from becoming court battles.

*Note: This skill provides general estate planning education. It is not legal advice and does not replace consultation with a qualified estate attorney, especially for complex situations. Estate law varies by state.*

**Output:** Complete asset and debt inventory classified as probate vs. non-probate, beneficiary designation audit, net estate calculation, and conflict risk assessment.
**Quality gate:** Every asset is classified as probate or non-probate. All beneficiary designations are current and intentional. Debts are listed with survival analysis. Potential conflict areas are identified.

### Phase 2: DECISIONS
**Entry criteria:** Asset inventory complete.
**Actions:**
1. Decide on the distribution plan. Common approaches:
   - **Everything to spouse, then equally to children:** The most common plan. Simple and usually fair. But "equally" needs defining -- is it equal shares of everything, or does the child who lives in the family home get the house while others get equivalent value?
   - **Specific bequests plus residuary:** "My guitar goes to Alex, my watch goes to Sam, and everything else is split equally among my children." This handles sentimental items directly and avoids fights.
   - **Per stirpes vs. per capita:** If your adult child dies before you, does their share go to their kids (per stirpes -- most common and usually what people want) or get redistributed among your surviving children (per capita)? Decide this explicitly.
   - **Disinheritance:** If you're intentionally leaving someone out, name them in the will and state they're excluded. A complete omission can be challenged as an oversight. "I intentionally make no provision for [name]" is harder to contest.
2. Handle the minor children situation. If you have kids under 18, the will is where you name their guardian. This is the single most important reason for young parents to have a will. Consider:
   - **Physical guardian:** Who raises the kids. Values alignment, parenting style, location, existing relationship with the kids, age and health, willingness.
   - **Financial guardian/trustee:** Who manages the money for the kids. Can be the same person as the physical guardian but doesn't have to be. Sometimes the best parent figure isn't the best money manager.
   - **Trust for minors:** Don't leave money directly to kids under 18 -- they can't legally manage it. Create a simple trust within the will (testamentary trust) specifying: who manages the money (trustee), what it can be used for (health, education, support, maintenance), and when the children receive control (age 18? 21? 25? Many people stagger: 1/3 at 21, 1/3 at 25, remainder at 30).
   - **Name alternates.** What if your first-choice guardian can't serve? Always have a backup.
3. Select your executor (called "personal representative" in some states). This person will:
   - File the will with probate court
   - Inventory all assets and debts
   - Notify creditors and pay valid debts
   - File final tax returns
   - Distribute assets according to the will
   - Handle any disputes among beneficiaries
   The ideal executor is: organized, responsible, trustworthy with money, geographically close enough to handle in-person requirements, and emotionally stable enough to do paperwork while grieving. It's a significant responsibility that can take 6-18 months. Ask the person before naming them. Name an alternate.
4. Make the hard decisions now. Things people avoid but shouldn't:
   - **Unequal distribution:** Maybe one child is wealthy and another struggles. Maybe one child provided care during your illness. Unequal isn't unfair if you explain the reasoning in a letter (not in the will itself -- wills are public record).
   - **Excluding a child with addiction:** You can leave their share in a trust with a trustee who controls distribution, rather than giving them a lump sum.
   - **Blended families:** Spouse vs. children from a prior marriage is the most contested estate scenario. If you want your spouse to live in the house but your children to eventually inherit it, that requires specific planning (life estate, trust, or other arrangement). Get an attorney for this.
   - **Charitable giving:** If you want to leave something to a charity, name the specific legal entity and include their tax ID if possible.
5. Address digital assets. Your will should include direction about: email accounts, social media profiles, cloud storage, domain names, cryptocurrency, and any online businesses or creative work. Name a "digital executor" (can be the same person) who understands technology enough to handle these assets.

**Output:** Complete distribution plan with primary and contingent beneficiaries, guardian designations for minors, executor selection with alternates, special situation handling, and digital asset plan.
**Quality gate:** Every asset has a designated beneficiary or distribution plan. Guardian choices have been discussed with the nominated individuals. Executor has agreed to serve. Potential conflict areas have explicit instructions.

### Phase 3: DRAFT
**Entry criteria:** All distribution decisions made.
**Actions:**
1. Determine if you can DIY or need a lawyer. DIY is appropriate when: you're in a simple situation (married with kids, leaving everything to spouse then kids equally), your estate is under the tax threshold, you have no blended family complications, no business ownership, and no one is likely to contest the will. Use a reputable service: Nolo's Quicken WillMaker, LegalZoom, Trust & Will, or your state bar's self-help resources. Cost: $20-200 vs. $1,000-3,000 for an attorney.
2. Build the will with these standard sections:
   - **Declaration:** Your name, state of residence, statement that this is your will, that you're of sound mind, and that this revokes all prior wills.
   - **Family identification:** Spouse's name, children's names and birth dates (including any you're intentionally excluding).
   - **Specific bequests:** Named items to named people ("My 1965 Fender Stratocaster to my son David").
   - **Residuary clause:** What happens to everything else ("All remaining assets to my spouse; if my spouse predeceases me, equally to my children, per stirpes").
   - **Minor children provisions:** Guardian designation, trust terms, trustee appointment.
   - **Executor appointment:** Name and alternate, powers granted (power to sell property, manage investments, hire professionals).
   - **No-contest clause (optional):** If anyone challenges the will, they forfeit their inheritance. Not enforceable in all states but can discourage frivolous challenges.
   - **Signature block and witness attestation.**
3. Use clear, unambiguous language. Common mistakes:
   - "My jewelry to my daughters" -- which pieces to which daughter? Be specific or say "divided equally among my daughters by mutual agreement."
   - "My house" -- use the legal description and address. You might own more than one property by the time you die.
   - "Everything to my kids" -- define "kids." Does this include stepchildren? Adopted children? Children born after the will is written? State law varies on these definitions.
4. Include contingency provisions for every bequest. What if the person dies before you? What if the executor can't serve? What if the guardian is unable to take the children? Every single designation needs a "if [person] is unable or unwilling to serve/receive, then [alternate]." Wills without contingencies create the exact legal mess they were supposed to prevent.
5. Review for state-specific requirements. Each state has rules about: whether you can completely disinherit a spouse (most states don't allow it -- the spouse can "elect against" the will and take a statutory share, typically 1/3 to 1/2), community property vs. common law property (affects what you can give away), and specific language required for valid execution. Check your state bar's website for a self-help guide.

**Output:** Complete will draft with all standard sections, clear beneficiary language, contingency provisions, and state-specific compliance notes.
**Quality gate:** Every bequest has specific, unambiguous language. Every designation has a contingency. The draft complies with the person's state requirements. The person has reviewed the draft and confirms it matches their wishes.

### Phase 4: EXECUTE
**Entry criteria:** Will is drafted and reviewed.
**Actions:**
1. Understand the execution requirements for your state. Most states require:
   - **Witnesses:** Typically 2 witnesses who are NOT beneficiaries in the will. They must watch you sign and then sign themselves, acknowledging that you appeared to be of sound mind and weren't under duress. Some states require witnesses to be "disinterested" (receive nothing under the will).
   - **Notarization:** Not required for the will itself in most states, BUT a notarized "self-proving affidavit" (attached to the will) means the witnesses don't need to appear in probate court later to confirm they witnessed the signing. This is strongly recommended.
   - **Your signature:** Sign with your usual signature, not a special legal version. Date the signature.
2. Choose your witnesses carefully. They must be: adults (18+), mentally competent, and preferably not beneficiaries. Good choices: neighbors, colleagues, professionals (your accountant, insurance agent). They don't need to read the will -- they just need to see you sign it and confirm you seemed to know what you were doing.
3. Do NOT make handwritten changes after signing. Crossing things out, writing in margins, or attaching sticky notes doesn't legally modify a will -- and can invalidate it entirely. If you need to make changes, create a formal codicil (amendment) with the same witness and notarization requirements as the original will. For significant changes, it's better to draft a new will entirely (which automatically revokes the old one when properly executed).
4. Holographic (handwritten) wills. About 25 states recognize wills that are entirely handwritten and signed by you, even without witnesses. These are better than nothing in an emergency but MUCH easier to contest. If you're writing a will by hand because you're in a hurry, replace it with a properly witnessed will as soon as possible.
5. Execute the will in a single ceremony. Gather your witnesses (and notary if using a self-proving affidavit). State clearly: "This is my last will and testament. I've read it, it reflects my wishes, and I'm signing it voluntarily." Sign every page (not just the last one -- prevents page substitution). Have witnesses sign. Have the notary notarize the self-proving affidavit. Date everything.

**Output:** Execution ceremony checklist, witness selection guidance, self-proving affidavit template reference, and completed will confirmation.
**Quality gate:** The correct number of witnesses for the state is confirmed. Witnesses are disinterested (not beneficiaries). Self-proving affidavit is executed if possible. The will is signed and dated.

### Phase 5: PROTECT
**Entry criteria:** Will is properly executed.
**Actions:**
1. Store the original will safely. Options:
   - **With your attorney:** Most secure for retrieval. The attorney's records can be found even if the firm changes names.
   - **Home safe or fireproof box:** Accessible but vulnerable to fire, flood, or being unfindable. Tell your executor exactly where it is and how to access it.
   - **NOT in a safe deposit box:** In many states, safe deposit boxes are sealed at death and require a court order to open. Your executor needs the will to get the court order, but the will is in the box. Classic catch-22.
   - Some courts allow you to file the will with the probate court for safekeeping during your lifetime.
2. Distribute copies strategically. Give copies to: your executor, your spouse/partner, your attorney (if the attorney doesn't have the original), and possibly adult children. Mark copies clearly as "COPY" so no one mistakes them for originals. Keep a record of who has copies.
3. Understand probate basics for your state. Probate is the court process of validating the will and supervising asset distribution. Key facts:
   - **Duration:** 6 months to 2+ years depending on estate complexity and state.
   - **Cost:** Typically 3-7% of the estate value (court fees, attorney fees if one is hired, executor compensation).
   - **Public record:** Once filed, wills are public documents. Anyone can read them.
   - **What avoids probate:** Joint accounts, beneficiary designations, POD/TOD accounts, property in trust, assets below the state's small estate threshold.
   - **Small estate procedures:** Most states have simplified probate (affidavit process) for estates below a threshold ($50,000-$200,000 depending on the state). This is faster and cheaper.
4. Create the executor's instruction packet. Separate from the will, keep an organized file with:
   - Location of the will and all legal documents
   - Complete asset and debt inventory
   - List of all accounts with institutions (not passwords -- just enough to find them)
   - Insurance policies with company names and policy numbers
   - Contact information: attorney, accountant, financial advisor, insurance agent
   - Digital estate instructions (password manager access, digital executor instructions)
   - Funeral/memorial wishes (keep this outside the will -- wills are often not read until after the funeral)
   - People to notify
5. Schedule regular reviews. Review your will when: you get married or divorced, a child is born or adopted, an executor or guardian dies or becomes unsuitable, you move to a different state, you acquire or sell significant assets, tax laws change significantly, or every 3-5 years regardless. An outdated will can be worse than no will at all -- it might direct assets to the wrong people or appoint an executor who's no longer appropriate.

**Output:** Storage plan with location and access instructions, copy distribution list, probate overview specific to the person's state, executor instruction packet outline, and review schedule.
**Quality gate:** Original will is stored in a location the executor can access. At least 2 people know where the will is. Executor has or will receive the instruction packet. The next review date is scheduled. Funeral wishes are documented separately from the will.

## Exit Criteria
Done when: (1) all assets are inventoried and classified as probate/non-probate, (2) distribution decisions are made with contingencies, (3) will is drafted with clear language and state compliance, (4) will is properly executed with witnesses and preferably notarized, (5) will is stored safely with executor and family informed of location.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Can't find all accounts or don't know what you own | Adjust -- check: last year's tax return (shows interest, dividend, and capital gains income from accounts you may have forgotten), credit report (shows all debt), mail and email (statements from financial institutions), and ask your spouse if applicable |
| DECISIONS | Can't agree with spouse on distribution | Adjust -- each spouse can have their own will. Focus on what you agree on (usually guardian for kids and the big assets). For disagreements, consider a mediator or family counselor before an attorney |
| DECISIONS | Blended family creates impossible-to-resolve conflicts | Escalate -- this is attorney territory. Trusts, life estates, and other planning tools can balance the interests of a current spouse with children from prior relationships. DIY will-making doesn't handle this well |
| DRAFT | State has unusual requirements you're unsure about | Adjust -- contact your state bar association's lawyer referral service for a brief consultation (many offer 30-minute consultations for $50 or less). Or use a state-specific will kit from Nolo |
| EXECUTE | Can't find two disinterested witnesses | Adjust -- ask neighbors, coworkers, or any other adult who isn't named in the will. Your bank may also notarize and witness documents. Some states allow interested witnesses but their inheritance may be reduced |
| PROTECT | Executor is unwilling or unable to serve when the time comes | Adjust -- this is why you name an alternate executor. If both the primary and alternate can't serve, the court will appoint an administrator. Update the will with a new executor as soon as possible |

## State Persistence
- Will version history (date created, date updated, what changed)
- Asset inventory (updated when major changes occur)
- Beneficiary designation tracker (account, current beneficiary, last verified date)
- Executor and guardian contact information and confirmation of willingness
- Copy distribution log (who has a copy, which version)
- Review schedule with triggers (life events and calendar-based)
- State-specific law references (statutes relevant to this person's will)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
