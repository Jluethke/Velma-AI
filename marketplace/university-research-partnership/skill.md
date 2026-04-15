# University Research Partnership

**One-line description:** The faculty researcher and the industry partner each submit their real research goals, IP expectations, and constraints before the partnership is formalized — AI aligns on a structure that advances the research without giving away the university's IP or locking the company into obligations it cannot meet.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both faculty and industry partner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_university_and_company` (string, required): University and company names.
- `shared_research_topic` (string, required): Research area or project being discussed.

### Faculty Researcher Submits Privately
- `faculty_research_objectives` (object, required): What the research aims to produce — findings, publications, data, technology.
- `faculty_publication_and_academic_freedom_requirements` (string, required): What publication rights and academic freedom you require — what the university will not compromise on.
- `faculty_ip_concerns` (object, required): What IP could emerge from this research and how you expect it to be owned and licensed.
- `faculty_resource_needs` (object, required): Funding, equipment, graduate student support, company data access — what you need from the partner.
- `faculty_concerns_about_the_partnership` (array, required): What worries you — company directing the research, restricting publications, claiming IP beyond what is fair?

### Industry Partner Submits Privately
- `company_research_objectives` (object, required): What problem are you trying to solve? What would a successful research outcome look like for the business?
- `company_ip_expectations` (object, required): What IP do you expect to own, license, or have right of first refusal on from this research?
- `company_funding_and_resource_commitment` (object, required): What you are prepared to provide — funding, data, equipment, employee time.
- `company_confidentiality_requirements` (object, required): What information shared with the university must remain confidential and for how long?
- `company_concerns_about_academic_timeline_and_control` (array, required): What worries you — slow pace, publication of competitive information, researcher attention divided across projects?

## Outputs
- `research_objective_alignment` (object): Where faculty and company objectives overlap and where they diverge.
- `ip_framework` (object): Who owns what — background IP, foreground IP, joint developments — and licensing terms.
- `publication_and_confidentiality_agreement` (object): What can be published, what requires review, what is confidential and for how long.
- `resource_and_funding_agreement` (object): What the company provides, payment schedule, what the university provides.
- `governance_and_oversight_structure` (object): How the partnership is managed — steering committee, milestone reviews, decision authority.
- `partnership_agreement_framework` (object): Key terms ready for the university technology transfer office and company counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm faculty's research objectives and company's IP expectations present.
**Output:** Readiness confirmation.
**Quality Gate:** Faculty's research goals and company's commercial objectives both present.

---

### Phase 1: Assess Objective and IP Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare faculty and company research objectives — are they solving the same problem or adjacent ones that can be satisfied by the same project? 2. Map IP expectations — what the company expects to own vs. what the university will not give up. 3. Assess publication requirements against company confidentiality needs — where is the conflict? 4. Check resource commitments against faculty's needs — is the company offering enough to make this viable?
**Output:** Objective alignment, IP conflict map, publication-confidentiality tension, resource adequacy.
**Quality Gate:** IP conflicts are specific — "company expects exclusive license to all foreground IP; university policy requires non-exclusive license with right of first negotiation."

---

### Phase 2: Design the IP and Publication Framework
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define background IP — what each party owns coming in and how it can be used. 2. Define foreground IP — what is created in the research, who owns it, what license the other party gets. 3. Build the publication framework — review periods, what triggers confidentiality review, what the maximum delay is. 4. Design the confidentiality structure — what company information is protected and for how long.
**Output:** Background IP definition, foreground IP ownership and licensing, publication framework, confidentiality structure.
**Quality Gate:** Every IP category has a specific ownership and licensing term. Publication review period is a specific number of days.

---

### Phase 3: Build the Partnership Agreement
**Entry Criteria:** IP framework built.
**Actions:** 1. Define the resource and funding commitment — amount, payment triggers, what it funds. 2. Build the governance structure — steering committee, milestone reviews, dispute resolution. 3. Define the research team — who is on it, student involvement, company participation. 4. Assemble the partnership framework for legal drafting.
**Output:** Funding and resource terms, governance structure, team definition, agreement framework.
**Quality Gate:** Funding has specific payment schedule. Governance has named roles and meeting cadence.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present research objective alignment. 2. Deliver IP framework. 3. Deliver publication and confidentiality agreement. 4. Deliver resource and funding terms. 5. Present governance structure and partnership agreement framework.
**Output:** Full synthesis — objectives, IP, publication, funding, governance, agreement framework.
**Quality Gate:** Both parties can brief their legal teams with a shared understanding of what the deal is.

---

## Exit Criteria
Done when: (1) research objectives are aligned, (2) IP ownership and licensing are specific, (3) publication framework has specific timelines, (4) funding commitment is specific, (5) governance structure is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
