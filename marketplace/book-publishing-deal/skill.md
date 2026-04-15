# Book Publishing Deal

**One-line description:** The author and the publisher each submit their real expectations, creative requirements, and business needs before signing — AI aligns on an advance, royalty structure, and creative process that gives the author what they need to write the book and the publisher what they need to sell it.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both author and publisher must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_book_title_and_genre` (string, required): Working title and genre/category.
- `shared_author_and_publisher` (string, required): Author name and publishing house.

### Author Submits Privately
- `author_book_vision` (string, required): What book are you writing? What is the core idea, audience, and what you want readers to experience?
- `author_financial_requirements` (object, required): Advance expectation, royalty floor, what you need to survive the writing period.
- `author_creative_control_requirements` (array, required): What editorial, cover, title, and marketing decisions must remain yours or require your approval?
- `author_concerns_about_the_publisher` (object, required): Marketing commitment, editorial process, timeline, how the publisher treats midlist authors, backlist treatment.
- `author_what_would_make_them_sign` (string, required): Beyond the advance — what combination of terms, support, and relationship would get you to commit to this publisher?

### Publisher Submits Privately
- `publisher_commercial_assessment` (object, required): What you believe this book can sell, at what price point, to what audience — the commercial thesis.
- `publisher_deal_structure` (object, required): Advance offer, royalty rates, subrights split, option clause, what the deal looks like.
- `publisher_marketing_commitment` (object, required): What marketing and publishing support you are actually committed to — print run, co-op, publicity, digital marketing.
- `publisher_editorial_vision` (object, required): What editorial changes you are expecting — structure, content, length, anything significant.
- `publisher_concerns_about_the_author` (object, required): Commercial risk, platform, delivery risk, prior publishing history, author's ability to promote.

## Outputs
- `deal_economics_alignment` (object): Whether the advance and royalty structure works for the author's financial needs and the publisher's P&L model.
- `rights_and_subrights_framework` (object): What rights are licensed, what the author retains, subrights splits.
- `editorial_and_creative_agreement` (object): What editorial process looks like, what requires author approval, how disagreements are resolved.
- `marketing_commitment` (object): Specific marketing commitments from the publisher — what they will and will not do.
- `delivery_and_schedule` (object): Manuscript delivery timeline, revision schedule, publication date commitment.
- `deal_term_sheet` (object): Key deal terms for publishing counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm author's requirements and publisher's deal structure present.
**Output:** Readiness confirmation.
**Quality Gate:** Author's financial needs and publisher's advance offer both present.

---

### Phase 1: Assess Economics and Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare advance expectations against offer — is there a deal on economics? 2. Check publisher's commercial projection against the author's vision — are they writing the same book? 3. Assess publisher's marketing commitment against author's expectations. 4. Identify editorial vision conflicts — does the publisher want a different book?
**Output:** Economics gap, vision alignment, marketing gap, editorial conflict.
**Quality Gate:** Advance gap is specific — "author expects $X; publisher offering $Y; based on comparable titles in genre the market range is $Z–$W."

---

### Phase 2: Design the Deal
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Build the advance and royalty structure — advance payment schedule, escalating royalties, digital rates. 2. Define subrights — what the publisher controls, what the author retains (audio, film, foreign). 3. Define creative control provisions — cover approval, title approval, editorial process. 4. Nail down the marketing commitment — what is in the contract vs. what is a promise.
**Output:** Advance and royalty structure, subrights division, creative control, marketing terms.
**Quality Gate:** Marketing commitment in the contract is specific — not "our best efforts" but named deliverables (first printing of X copies, co-op budget of $Y, publicity for Z months).

---

### Phase 3: Define Schedule and Option
**Entry Criteria:** Deal designed.
**Actions:** 1. Build the delivery and revision schedule — manuscript due date, revision rounds, final acceptance definition. 2. Define publication timeline — from acceptance to publication, what the author can hold the publisher to. 3. Define the option clause — what it covers, how long the publisher has to decide, right to match. 4. Define reversion rights — what triggers the author getting rights back.
**Output:** Delivery schedule, publication timeline, option terms, reversion rights.
**Quality Gate:** Publication timeline is a specific date commitment. Reversion triggers are named — "if out of print for X months and publisher does not reissue within Y months."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Schedule defined.
**Actions:** 1. Present deal economics alignment. 2. Deliver rights and subrights framework. 3. Deliver editorial and creative agreement. 4. Deliver marketing commitment. 5. Present delivery schedule and term sheet.
**Output:** Full synthesis — economics, rights, editorial, marketing, schedule, term sheet.
**Quality Gate:** Author understands what they are signing. Publisher has an author who understands the commercial expectations.

---

## Exit Criteria
Done when: (1) advance gap is resolved, (2) subrights are divided specifically, (3) marketing commitment is in the contract, (4) reversion rights are specific, (5) delivery schedule has dates.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
