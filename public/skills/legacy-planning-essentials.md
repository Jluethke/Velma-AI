# Legacy Planning Essentials

Helps you get your affairs in order so the people you love aren't left scrambling, guessing, or fighting when you're gone. Covers the practical stuff everyone puts off: writing a will, organizing your digital life (passwords, accounts, subscriptions, crypto), writing letters to the people who matter, and documenting your end-of-life wishes so your family isn't making impossible decisions in a hospital hallway. This isn't morbid -- it's one of the most caring things you can do for the people you love. Works whether you're 30 with a new baby or 70 and finally getting around to it.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY    --> Catalog everything you have: physical, financial, and digital
PHASE 2: DOCUMENTS    --> Get the critical legal documents created or updated
PHASE 3: DIGITAL LIFE --> Organize your online existence so it doesn't become a nightmare
PHASE 4: LETTERS      --> Write what matters to the people who matter
PHASE 5: WISHES       --> Document your end-of-life preferences clearly and completely
```

## Inputs
- personal_situation: object -- Age, marital status, dependents (children and their ages, elderly parents, pets), general health status, and what prompted this (new baby, health scare, "just finally doing it")
- assets_overview: object -- General sense of what you own: home, vehicles, bank accounts, retirement accounts, investment accounts, business ownership, life insurance, valuable personal property (jewelry, collections, art)
- digital_footprint: object -- Email accounts, social media presence, cloud storage, cryptocurrency, online banking, subscription services, business or creative work stored online, password management approach (or lack thereof)
- family_dynamics: object -- (Optional) Relationship complexities -- blended families, estranged relatives, minor children, special needs dependents, family members with addiction or financial irresponsibility, potential conflicts over inheritance
- existing_documents: object -- (Optional) Any estate documents already in place: will, trust, power of attorney, advance directive, life insurance beneficiary designations, retirement account beneficiaries

## Outputs
- asset_inventory: object -- Complete catalog of physical, financial, and digital assets with locations, account numbers (partial), and access information
- document_checklist: object -- Status of every critical legal document with action items for what's missing or outdated
- digital_estate_plan: object -- Organized digital asset inventory with access instructions and disposition wishes for each account
- personal_letters: array -- Templates and guidance for writing letters to loved ones, with prompts for different relationships
- end_of_life_directive: object -- Comprehensive wishes document covering medical, funeral, and practical matters

## Execution

### Phase 1: INVENTORY
**Entry criteria:** Person is ready to catalog their assets and affairs.
**Actions:**
1. Build the financial asset inventory. List every account and asset:
   - **Bank accounts:** Checking, savings, CDs, money market. Note: bank, approximate balance range, who's on the account (joint? POD/TOD beneficiary named?).
   - **Retirement accounts:** 401(k), IRA, Roth IRA, pension. Note: institution, approximate value, beneficiary designated (check -- many people set these up years ago and never updated after marriage, divorce, or kids).
   - **Investment accounts:** Brokerage, mutual funds, stocks, bonds. Note: institution, approximate value, type of ownership.
   - **Real estate:** Primary home, rental properties, vacation home, raw land. Note: how title is held (sole, joint tenants, tenants in common -- this matters enormously for what happens when you die).
   - **Insurance:** Life, disability, long-term care. Note: company, policy number, face value, beneficiary. Check if you have policies through work that you forgot about.
   - **Business interests:** Ownership stakes, partnerships, LLC memberships. Note: entity name, ownership percentage, buy-sell agreements.
   - **Other:** Vehicles, jewelry, art, collectibles, firearms, intellectual property, money owed to you.
2. Build the liability inventory. What you owe: mortgage, car loans, student loans, credit cards, personal loans, tax obligations, alimony/child support, business debts. Note which debts die with you (most credit card debt if solely in your name) and which survive (federal student loans die with you, private student loans with a cosigner don't; mortgage stays with the property).
3. List all sources of income and recurring payments: salary, Social Security, pension, rental income, business income, alimony received. Also list recurring obligations: subscription services, charitable giving commitments, alimony paid, insurance premiums. Your executor needs this list to know what to cancel and what to keep.
4. Create the "where to find things" master document. Physical locations: safe deposit box (which bank? who has the key?), home safe (combination?), filing cabinet, important papers location. This single document saves your family weeks of searching. Include: insurance policies, deed to the house, vehicle titles, tax returns (last 3 years), birth/marriage/divorce certificates, military discharge papers, Social Security card.
5. Identify beneficiary mismatches. Here's what most people don't know: beneficiary designations on retirement accounts and life insurance override your will. If your will says "everything to my spouse" but your 401(k) beneficiary is still your ex from 10 years ago, the ex gets the 401(k). Check every beneficiary designation today. Update any that don't match your current wishes.

**Output:** Complete asset and liability inventory, recurring income/expense list, "where to find things" master document, and beneficiary audit with discrepancies flagged.
**Quality gate:** Every financial account is listed with institution and beneficiary status. Real estate ownership type is specified. The "where to find things" document is something a stressed family member could actually use. Beneficiary designations are verified current.

### Phase 2: DOCUMENTS
**Entry criteria:** Asset inventory complete.
**Actions:**
1. Assess what legal documents exist and their status. The critical documents:
   - **Last Will and Testament:** Who gets what, who's the executor, who gets the kids (if minor children). Does it exist? When was it last updated? Does it still reflect your wishes? Major life events that require updates: marriage, divorce, birth of child, death of named beneficiary or executor, significant change in assets, moving to a different state.
   - **Durable Power of Attorney (Financial):** Who manages your money if you can't. Does it exist? Is the named person still appropriate and willing?
   - **Healthcare Power of Attorney:** Who makes medical decisions if you can't. Same questions.
   - **Advance Directive/Living Will:** What medical treatment you want (or don't want) if you can't communicate. Covered in detail in Phase 5.
   - **Trust (if applicable):** Revocable living trust to avoid probate, special needs trust for disabled dependents, irrevocable trust for tax planning. Not everyone needs a trust -- but if you own property in multiple states, have a complex family situation, or have significant assets, it's worth the conversation with an attorney.
2. For documents that don't exist: determine whether you can use a reputable online service (appropriate for simple situations -- single, married with no complications, modest assets) or need an attorney (recommended for: blended families, business ownership, special needs dependents, high net worth, property in multiple states, any situation where someone might contest the will).
3. Executor selection. Pick someone who is: organized, good with paperwork and deadlines, emotionally stable enough to handle the administrative burden while grieving, geographically close enough to handle in-person tasks (court appearances, property management), and -- critically -- willing to do it. Being named executor is not an honor, it's a job. Ask them before naming them. Name a backup executor in case the primary can't serve.
4. Guardian designation for minor children. This is the conversation nobody wants to have but every parent must. Consider: the guardian's parenting values and style, financial stability, age and health, willingness (ask them!), and the impact on the children (proximity to current school, friends, extended family). Name a backup. Consider whether the financial guardian (manages the money) should be someone different from the physical guardian (raises the kids) -- sometimes the best parent isn't the best money manager.
5. Store documents properly. Originals of wills should be with your attorney or in a secure location your executor knows about (NOT a safe deposit box -- these can be sealed at death and hard to access). Copies to: executor, healthcare agent, and attorney. Digital copies stored securely as backup. Tell at least 2 trusted people where the originals are.

*Note: This skill provides general educational information about legal documents. It is not legal advice and does not replace consultation with a qualified attorney. Laws vary by state and individual circumstances require professional guidance.*

**Output:** Document status checklist, action items for missing or outdated documents, executor and guardian recommendations, and storage plan.
**Quality gate:** Every critical document is accounted for (exists, needs creation, or needs update). Executor and guardian choices have been discussed with the named individuals. Document storage locations are documented and communicated.

### Phase 3: DIGITAL LIFE
**Entry criteria:** Legal documents assessed.
**Actions:**
1. Inventory every digital account. Categories:
   - **Financial:** Online banking, investment platforms, payment apps (Venmo, PayPal, Zelle), cryptocurrency wallets and exchanges.
   - **Email:** Every email account. These are the master keys -- most account recovery goes through email. Losing access to email means losing access to everything.
   - **Social media:** Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube. Each has different policies for deceased users (memorialization, deletion, data download).
   - **Cloud storage:** Google Drive, iCloud, Dropbox, OneDrive. May contain irreplaceable photos, documents, or creative work.
   - **Subscriptions:** Streaming services, software, apps, news, dating sites, gym memberships, meal kits -- anything with recurring charges that need to be cancelled.
   - **Creative/professional:** Website domains, hosting accounts, blogs, online businesses, freelance platforms, professional profiles.
   - **Gaming/virtual:** Game accounts with purchased content, virtual currencies, NFTs.
2. Set up a password management system if you don't have one. Use a reputable password manager (1Password, Bitwarden, LastPass). Store the master password and recovery key in your physical "where to find things" document or with your attorney. Without this, your digital estate is effectively locked forever. Two-factor authentication adds security but also adds access complexity for your executor -- document backup codes.
3. For each major platform, set up legacy/inactive account features where available:
   - **Google:** Inactive Account Manager (decides what happens after inactivity period).
   - **Facebook:** Legacy Contact (can manage memorialized account) or pre-authorize deletion.
   - **Apple:** Legacy Contact feature (provides access to iCloud data).
   - **Twitter/X:** Deactivation request by family with death certificate.
   - These features exist so your family doesn't have to lawyer up to access your photos.
4. Handle cryptocurrency and digital assets specifically. If you hold crypto: document which wallets and exchanges you use, where seed phrases/private keys are stored (NEVER digitally unless encrypted), what the approximate value is. If your private keys are lost, the crypto is gone forever -- there's no "forgot my password" option. Consider whether a crypto-savvy person should be designated to handle this.
5. Create disposition instructions for each digital account: memorialize (social media), delete (dating profiles, certain accounts), transfer ownership (business accounts, domains), download and preserve data (photos, creative work), and cancel (subscriptions). Be specific -- "delete my browser history" is a cliche, but "download all photos from Google Photos and give to [person]" is an actual instruction.

**Output:** Complete digital asset inventory, password management setup, platform-specific legacy settings configured, cryptocurrency access plan, and disposition instructions for each account.
**Quality gate:** Every account with financial value or irreplaceable content is documented. Password access method is documented and tested. Legacy contacts are set up on platforms that offer it. Crypto access (if applicable) is secured but accessible to the designated person.

### Phase 4: LETTERS
**Entry criteria:** Inventory and documents are in progress or complete.
**Actions:**
1. Understand why letters matter. Legal documents handle stuff. Letters handle feelings. When someone dies, the people left behind replay every conversation, wondering what was unsaid. A letter from you -- in your words, in your handwriting or voice -- becomes one of the most treasured things they'll ever own. This isn't about being dramatic. It's about not leaving things unsaid.
2. Write letters to key people using these prompts as starting points:
   - **To your spouse/partner:** What they've meant to you. Your favorite memories together. What you want for their future. Permission to be happy. Practical things only you would know to tell them (the weird noise the furnace makes, the neighbor who has the spare key).
   - **To your children (age-appropriate):** What you're most proud of about them. Stories from their childhood they might not remember. Advice you hope they'll carry. For young children: letters for future milestones -- graduations, weddings, parenthood. These are priceless.
   - **To your parents (if living):** Gratitude, forgiveness, or whatever needs to be said. Things you learned from them that you carry.
   - **To friends:** What their friendship meant. Shared memories. Inside jokes that would otherwise die with you.
   - **To your executor/family (practical):** Where things are, what matters, what doesn't, any secrets that need to come out (second family, hidden debt, estranged relatives they don't know about). Better in a letter than a surprise.
3. Choose format: handwritten (most personal, hardest to update), typed and printed (easier to update, still personal if signed), video (powerful but hard to watch repeatedly and technology changes), audio recording (intimate, easy to create on a phone). Consider multiple formats for different people.
4. Address the hard stuff if it applies. If there are relationships that need repair, acknowledgments that need making, or truths that need telling -- a letter can do what a conversation couldn't. You don't have to send these while you're alive. But writing them now means the words exist if you want them to.
5. Store letters with your estate documents. Seal them with the recipient's name. Include instructions in your will or with your executor: when to deliver (immediately, at a specific milestone, or on a specific date), and whether any should remain sealed permanently. Update these periodically -- the letter you write at 35 may not say what you'd say at 65.

**Output:** Letter-writing guide with prompts for each relationship, format recommendations, storage instructions, and delivery plan.
**Quality gate:** At least the 2-3 most important letters are drafted or have scheduled time to write them. Storage location is secure but accessible to the executor. Delivery instructions are documented.

### Phase 5: WISHES
**Entry criteria:** Letters are in progress and legal document status is known.
**Actions:**
1. Document medical wishes in detail. Beyond the legal advance directive, create a plain-language document that covers:
   - **Life-sustaining treatment:** CPR, ventilator/breathing machine, feeding tube, dialysis, blood transfusions. For each: do you want it? Under what circumstances? Permanently or only for a trial period?
   - **Quality of life thresholds:** At what point would you not want aggressive treatment? Examples: permanent unconsciousness, severe brain damage with no chance of recovery, terminal illness with less than 6 months to live. Be as specific as you can.
   - **Pain management:** Do you want full pain control even if it might hasten death? (Most people do. Document it clearly.)
   - **Organ and tissue donation:** Yes or no? Any restrictions? Register with your state's donor registry AND tell your family -- the family's wishes often override the registry in practice.
   - **Where you want to be:** Home, hospital, hospice facility? If home, is that realistic given your family's capacity?
2. Document funeral and memorial wishes:
   - **Disposition:** Burial, cremation, green burial, body donation to science, or other. If burial: where? If cremation: what to do with ashes?
   - **Service type:** Traditional funeral, celebration of life, private family only, no service, religious ceremony (which tradition), or something unique. Music, readings, speakers -- anything specific you want or don't want.
   - **Financial:** Have you prepaid anything? Is there a life insurance policy designated to cover costs? Average funeral costs $8,000-12,000. Cremation with a service runs $3,000-7,000. Direct cremation $1,000-3,000. Don't let your family overspend because they feel guilty.
   - **Practical:** Obituary -- do you want to draft it or leave guidance? Charities for memorial donations? Flowers or "in lieu of flowers"?
3. Document the practical stuff people forget:
   - **Pets:** Who takes them? What are their medical needs, feeding schedule, vet information, and behavioral quirks? This matters more than people think -- pets end up in shelters because nobody planned.
   - **Business matters:** If you own a business, what should happen? Succession plan, sell, close? Who has authority to make decisions in the interim?
   - **Personal property distribution:** The stuff that isn't in the will or isn't valuable enough to list -- but that causes the most family fights. Who gets Mom's ring? Who gets the photo albums? Dad's tools? Make a list. Be specific. This prevents more family conflict than any other single action.
   - **Digital presence:** Final social media post or profile status? Keep the account as a memorial or delete?
4. Have the conversation. Documents are useless if the people who need to act on them don't know they exist or what you want. Have an explicit conversation with: your healthcare agent, your executor, your spouse/partner, and your adult children. It's uncomfortable for about 15 minutes. Then it's a massive relief for everyone -- including you.
5. Review and update. Major life events trigger updates (same as legal documents). Also review every 5 years even if nothing has changed -- your feelings about end-of-life care, funeral preferences, and personal property distribution may evolve. Date every version so the most recent is clear.

*Note: This skill provides general guidance about end-of-life planning. It is not legal or medical advice. Consult qualified professionals for legal documents and medical directives specific to your state and situation.*

**Output:** Comprehensive end-of-life wishes document covering medical directives, funeral preferences, personal property distribution, pet care plan, and practical matters. Conversation guide for discussing wishes with key people.
**Quality gate:** Medical wishes are specific enough that a healthcare agent could make decisions confidently. Funeral preferences are documented with enough detail to be actionable. Personal property distribution addresses the items most likely to cause conflict. At least one conversation about these wishes has been had or is scheduled.

## Exit Criteria
Done when: (1) complete asset inventory exists with access information, (2) all critical legal documents are in place or have creation appointments scheduled, (3) digital estate is inventoried with access method and disposition instructions, (4) personal letters are written or in progress for key relationships, (5) end-of-life wishes are documented and communicated to the people who need to know.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Person doesn't know what accounts they have | Adjust -- check mail and email for statements, review credit report for accounts, check tax returns for interest/dividend income, search email for "welcome" or "account created" messages |
| INVENTORY | Spouse handles all finances and person has no visibility | Adjust -- this is a vulnerability. Begin with what the person does know and schedule a "financial fire drill" with the spouse to walk through everything together |
| DOCUMENTS | Person is procrastinating on legal documents | Adjust -- start with the single most critical document (usually will if there are minor children, or healthcare POA if there are health concerns). One document done is infinitely better than five documents planned |
| DOCUMENTS | Family situation is complex (blended family, estrangement, disputes) | Escalate -- this requires an estate attorney, not a template. The cost of professional help ($1,000-3,000) is a fraction of the cost of a contested estate (tens of thousands) |
| DIGITAL LIFE | No password management and can't remember passwords | Adjust -- start fresh. Create a password manager and begin adding accounts as you encounter them. Use browser's saved passwords as a starting inventory |
| LETTERS | Person is emotionally overwhelmed by the process | Adjust -- take a break. Start with the easiest letter (often to a friend). Use the prompts as a starting point, not a requirement. Even a few lines matter |
| WISHES | Family members disagree with the person's wishes | Adjust -- these are the person's wishes, not a vote. Document them clearly. Explain the reasoning. If family conflict is likely, an attorney can structure things to reduce challenges |

## State Persistence
- Asset inventory (updated when accounts change, assets acquired or sold)
- Document status tracker (what exists, when created, when last reviewed, where stored)
- Beneficiary designation log (account, current beneficiary, last verified date)
- Digital account inventory (account, platform, disposition wish, legacy contact status)
- Letter status (recipient, format, written/in progress/planned, storage location)
- End-of-life wishes (version date, who has been informed, when last reviewed)
- Conversation tracker (who you've discussed plans with, what was covered, any concerns raised)
- Review schedule (next review date, what triggered the last update)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
