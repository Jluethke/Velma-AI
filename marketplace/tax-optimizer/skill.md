# Tax Optimizer

**One-line description:** Analyze a client's tax situation to identify deductions, credits, timing strategies, and quantify potential tax savings with audit-risk assessment and state-specific optimization.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filing_status` (string, required): Single, Married Filing Jointly, Married Filing Separately, Head of Household, Qualifying Widow(er)
- `income_sources` (object, required): Breakdown of income by type (W-2 wages, self-employment, capital gains, dividends, rental, other) with amounts
- `dependents` (array, optional): List of dependents with age, relationship, and SSN status (used for child tax credit, EITC eligibility)
- `current_deductions` (object, optional): Deductions currently claimed (mortgage interest, property tax, charitable, medical, education)
- `expense_records` (object, optional): Documented expenses by category (business, medical, charitable, education, energy improvements) with supporting documentation status
- `prior_year_return` (object, optional): Prior year tax return data for comparison and carryover items (capital losses, unused credits, AMT status)
- `current_year_income_projection` (number, optional): Estimated total income for current year
- `tax_bracket` (number, optional): Current marginal tax bracket (if known; otherwise will be calculated)
- `state_of_residence` (string, required): State for state-specific credits, deductions, and filing requirements

---

## Outputs

- `tax_profile` (object): Structured summary of client's tax situation (filing status, income total, family composition, current tax position, state-specific factors)
- `deductions_analysis` (object): Identified deductions with itemized vs. standard comparison, recommended approach, and state-specific deductions
- `credits_analysis` (object): Eligible tax credits with phase-out thresholds, estimated values, and audit-risk assessment
- `timing_strategies` (array): Recommended timing moves (accelerate/defer income, bunching, loss harvesting, contribution deadlines) with confidence levels
- `savings_estimate` (object): Quantified tax savings by category, total potential savings, and conservative/optimistic scenarios with assumptions
- `optimization_recommendations` (array): Prioritized list of actionable recommendations with implementation steps, deadlines, documentation requirements, confidence levels, and audit-risk assessment

---

## Execution Phases

### Phase 1: Gather and Structure Tax Profile with State Context

**Entry Criteria:**
- Filing status is provided
- At least one income source is documented
- State of residence is provided

**Actions:**
1. Consolidate all income sources and calculate total income
2. Document filing status and dependent count
3. Identify income type complexity (simple W-2 only vs. business/investment/rental income)
4. Note any prior-year carryover items (capital losses, unused credits, prior AMT status)
5. Determine applicable standard deduction for filing status and age
6. Identify state-specific filing requirements and income thresholds for state tax liability
7. Flag if client is subject to Alternative Minimum Tax (AMT) based on prior year or projected income and deductions
8. Identify if client is self-employed and requires quarterly estimated tax payments

**Output:**
- `tax_profile` object with: filing_status, total_income, income_complexity_level (simple/moderate/complex), dependent_count, standard_deduction_amount, carryover_items, state_of_residence, state_filing_required (yes/no), amt_subject (yes/no/uncertain), estimated_tax_required (yes/no), marginal_tax_bracket

**Quality Gate:**
- Total income is calculated and verified against all income sources
- Standard deduction matches current year IRS tables for filing status and age
- All income sources are accounted for
- State filing requirement is correctly determined
- AMT subject status is flagged if prior year AMT or if deductions exceed 60% of income

---

### Phase 2: Identify Deductions (Federal and State)

**Entry Criteria:**
- Tax profile is complete
- Expense records or current deductions are provided
- State of residence is known

**Actions:**
1. List all potential federal itemized deductions (mortgage interest, property tax, charitable, medical, education, business expenses)
2. Identify state-specific deductions available in client's state (state income tax deduction, state-specific charitable credits, etc.)
3. Calculate total itemized deductions (federal + state)
4. Apply SALT cap ($10,000 combined state and local taxes) and other limitations (medical expense threshold 7.5% AGI, charitable AGI limits, etc.)
5. Compare itemized total to standard deduction
6. Identify deductions client is currently missing or underutilizing
7. For each deduction, assess documentation status (documented/partially documented/undocumented)
8. Flag deductions subject to phase-out or limitations

**Output:**
- `deductions_analysis` object with: itemized_deductions_list [{deduction_name, amount, documentation_status, audit_risk_level}], itemized_total, standard_deduction, recommended_approach (itemize or standard), missed_opportunities [{opportunity, estimated_value, implementation_complexity}], limitations_and_phase_outs [{limitation, impact_on_deductions}], state_specific_deductions [{deduction_name, amount, state}]

**Quality Gate:**
- Itemized vs. standard comparison is accurate
- All documented expenses are categorized
- Phase-out rules and SALT cap are applied correctly
- Documentation status is assessed for each deduction
- State-specific deductions are identified and included

---

### Phase 3: Identify Tax Credits (Federal and State)

**Entry Criteria:**
- Tax profile is complete
- Dependent information is available
- Education and energy expense data (if applicable) is provided
- State of residence is known

**Actions:**
1. Check federal credit eligibility: child tax credit (age, relationship, income phase-out)
2. Check federal credit eligibility: education credits (AOTC, Lifetime Learning, American Opportunity) with income phase-out
3. Check federal credit eligibility: EITC (income limits, dependent status, earned income requirement)
4. Check federal credit eligibility: energy credits (home improvements, electric vehicle, solar)
5. Check federal credit eligibility: other credits (adoption, saver's credit, dependent care, residential energy)
6. Identify state-specific credits available in client's state (state education credits, state dependent credits, state energy credits, etc.)
7. Calculate phase-out reductions for each credit based on income
8. For each credit, assess audit risk (high/medium/low) based on documentation requirements and IRS scrutiny
9. Rank credits by value, certainty of eligibility, and audit risk

**Output:**
- `credits_analysis` object with: eligible_credits [{credit_name, estimated_value, phase_out_threshold, phase_out_impact, documentation_required, audit_risk_level, confidence_level}], total_credits_available, phase_out_impact_total, state_specific_credits [{credit_name, estimated_value, state}], high_risk_credits [{credit_name, risk_reason}]

**Quality Gate:**
- All credits are checked against current income and phase-out thresholds
- Credit values are current-year amounts
- Eligibility is clearly documented with assumptions noted
- Audit risk is assessed for each credit
- State-specific credits are identified and included

---

### Phase 4: Analyze Timing Strategies and Estimated Tax Obligations

**Entry Criteria:**
- Tax profile is complete
- Income projection for current year is available
- Deductions and credits are identified
- Self-employment status is known

**Actions:**
1. Project year-end income and compare to prior year and tax bracket thresholds
2. Identify discretionary deductions that can be timed (charitable, medical, business expenses) with specific timing windows
3. Evaluate income acceleration/deferral opportunities (bonus timing, business income recognition, retirement contributions) with implementation feasibility
4. Identify capital loss harvesting opportunities (if investment losses exist) with wash-sale rule considerations
5. Review retirement contribution deadlines (401k Dec 31, IRA April 15, SEP, Solo 401k) with contribution limits
6. Evaluate bunching strategy if itemizing: calculate whether concentrating deductions in high-income years exceeds standard deduction threshold; identify which expenses can be bunched
7. Assess estimated tax payment timing if self-employed: calculate required quarterly payments and identify underpayment penalty risk
8. For each timing strategy, estimate tax impact and assess implementation complexity (high/medium/low)

**Output:**
- `timing_strategies` array with: [{strategy_name, action, timing, estimated_impact, implementation_complexity, feasibility_assessment, confidence_level}], estimated_tax_payment_schedule (if applicable) [{quarter, payment_amount, due_date}], underpayment_penalty_risk (yes/no/uncertain)

**Quality Gate:**
- Timing recommendations are realistic given client's control over income/expenses
- Deadlines are accurate for current tax year (verified against IRS calendar)
- Impact estimates are quantified with supporting assumptions
- Estimated tax payment schedule is accurate if self-employed
- Bunching strategy includes specific expenses that can be timed

---

### Phase 5: Calculate Savings Estimate with Scenario Analysis

**Entry Criteria:**
- Deductions analysis is complete
- Credits analysis is complete
- Timing strategies are identified
- Estimated tax obligations are calculated (if applicable)

**Actions:**
1. Calculate tax savings from additional deductions (vs. current approach): multiply additional deductions by marginal tax rate
2. Calculate tax savings from identified credits: sum all eligible credits
3. Calculate tax savings from timing strategies (income deferral, loss harvesting, bunching): quantify by strategy
4. Calculate estimated tax payment savings (if applicable): compare required payments to current withholding
5. Apply marginal tax rate to deduction savings; note that credits are dollar-for-dollar
6. Sum all savings categories: total_savings = deductions_savings + credits_savings + timing_savings + estimated_tax_savings
7. Create conservative scenario: assume only high-confidence opportunities (confidence_level = high) are implemented
8. Create optimistic scenario: assume all opportunities (confidence_level = high/medium) are implemented; note assumptions
9. Identify which savings are certain (documented, no phase-out risk) vs. conditional (dependent on future events or IRS interpretation)

**Output:**
- `savings_estimate` object with: deductions_savings, credits_savings, timing_savings, estimated_tax_savings, total_savings, marginal_rate_used, conservative_scenario {total_savings, included_opportunities}, optimistic_scenario {total_savings, included_opportunities, assumptions}, certain_vs_conditional [{category, certain_amount, conditional_amount, condition_description}]

**Quality Gate:**
- All savings are quantified with supporting calculations
- Marginal tax rate is correctly applied to deductions
- Credits are not multiplied by marginal rate
- Scenarios account for implementation uncertainty and confidence levels
- Assumptions for optimistic scenario are explicitly documented

---

### Phase 6: Prioritize, Recommend, and Assess Implementation Risk

**Entry Criteria:**
- All analyses are complete
- Savings estimates are calculated
- Confidence levels and audit risk assessments are available

**Actions:**
1. Rank opportunities by: (a) estimated savings, (b) implementation ease, (c) certainty of eligibility, (d) audit risk level
2. Group recommendations into: immediate actions (before year-end with specific deadlines), next-year planning (January-April), ongoing strategies (multi-year)
3. For each recommendation, document: action required (specific steps), deadline (date), estimated savings, implementation complexity (high/medium/low), confidence level (high/medium/low), audit risk level (high/medium/low), documentation requirements (list specific records needed)
4. Identify any conflicts or trade-offs between recommendations (e.g., bunching deductions vs. income deferral); for conflicts, provide decision framework
5. Create implementation roadmap with timeline, sequencing, and dependencies
6. Flag any recommendations requiring professional help (CPA, tax attorney, financial advisor) with justification
7. For each recommendation, specify what documentation client must retain to support it (receipts, invoices, statements, appraisals, etc.)

**Output:**
- `optimization_recommendations` array with: [{rank, recommendation, action_required (specific steps), deadline, estimated_savings, implementation_complexity, confidence_level, audit_risk_level, documentation_required [{document_type, purpose}], professional_help_needed (yes/no), professional_type_if_needed}], implementation_roadmap [{phase, timeline, actions, dependencies}], conflicts_and_trade_offs [{conflict_description, decision_framework}]

**Quality Gate:**
- Recommendations are actionable with specific, numbered steps
- Deadlines are realistic and accurate (verified against IRS calendar)
- Implementation roadmap is sequenced logically with dependencies noted
- All recommendations are tied to quantified savings
- Documentation requirements are specific (not generic "tax records")
- Audit risk is assessed for each recommendation
- Conflicts are identified with decision criteria provided

---

## Exit Criteria

The skill is complete when:
- Tax profile is documented with all income sources, family composition, state context, and AMT/estimated tax status
- Deductions analysis compares itemized vs. standard, identifies missed opportunities, applies state-specific deductions, and assesses documentation status
- Credits analysis lists all eligible federal and state credits with phase-out impacts and audit-risk assessment
- Timing strategies are identified with quantified impact and feasibility assessment; estimated tax payment schedule is provided if applicable
- Total tax savings estimate is calculated with conservative and optimistic scenarios; assumptions are explicitly documented
- Prioritized recommendations are provided with: specific action steps, accurate deadlines, documentation requirements, confidence levels, audit-risk assessment, and professional help flags
- Implementation roadmap is sequenced with clear dependencies and timeline
- Each recommendation includes specific documentation requirements (not generic "tax records")
- A client with basic tax knowledge could follow the recommendations and implement them with confidence, knowing the audit risk and documentation burden

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Income sources are incomplete or unclear | **Adjust** -- request detailed income statement; use conservative estimates for missing items; flag as assumption in tax_profile |
| Phase 1 | Filing status is ambiguous (e.g., recently married) | **Adjust** -- clarify filing status for current year; calculate impact of status change; document assumption |
| Phase 1 | State of residence is unclear (e.g., moved mid-year) | **Adjust** -- determine state filing requirement based on residency dates; note multi-state filing implications |
| Phase 1 | Prior year AMT status is unknown | **Adjust** -- flag as uncertain; recommend requesting prior year return; use conservative assumption (assume AMT subject if deductions exceed 60% of income) |
| Phase 2 | Expense records are disorganized or missing | **Adjust** -- use current deductions as baseline; mark missing expenses as undocumented; recommend documentation for future years; flag audit risk |
| Phase 2 | Client is subject to SALT cap or other limitations | **Adjust** -- apply limitations correctly; quantify impact on itemization decision; note in deductions_analysis |
| Phase 2 | State-specific deductions are unclear | **Adjust** -- research state tax authority guidance; document source; flag if interpretation is uncertain |
| Phase 3 | Client is in phase-out range for multiple credits | **Adjust** -- calculate precise phase-out impact for each credit; prioritize credits by value after phase-out |
| Phase 3 | Credit eligibility is unclear (e.g., dependent status, education expenses) | **Adjust** -- document assumptions; recommend verification with tax professional; flag confidence level as medium/low |
| Phase 3 | State-specific credits are unclear | **Adjust** -- research state tax authority guidance; document source; flag if interpretation is uncertain |
| Phase 4 | Income projection is highly uncertain | **Adjust** -- create multiple scenarios (conservative, mid, optimistic); recommend quarterly review; note in timing_strategies |
| Phase 4 | Timing strategy requires business/investment decisions outside tax scope | **Adjust** -- document tax impact; recommend consulting business advisor; flag as dependent on external decision |
| Phase 4 | Self-employment status is unclear | **Adjust** -- clarify whether client has self-employment income; if yes, calculate estimated tax payments; if no, note in tax_profile |
| Phase 5 | Savings estimate exceeds reasonable expectations (e.g., >50% of current tax liability) | **Adjust** -- verify calculations; break down by category; flag any aggressive positions; reduce confidence level for outlier items |
| Phase 5 | Conservative and optimistic scenarios are too similar | **Adjust** -- expand assumptions; identify which items differ between scenarios; ensure scenarios reflect meaningful uncertainty |
| Phase 6 | Recommended actions conflict with each other (e.g., bunching deductions vs. income deferral) | **Adjust** -- document trade-offs; provide decision framework (e.g., "Choose bunching if income will be lower next year; choose deferral if income will be higher"); flag as requiring client decision |
| Phase 6 | Recommendation requires documentation client cannot obtain | **Adjust** -- note in documentation_required; flag as high-risk; recommend alternative approach or professional help |
| Phase 6 | Recommendation has high audit risk and low confidence | **Adjust** -- flag prominently; recommend professional review before implementation; consider excluding from primary recommendations |

---

## Reference Section: Tax Optimization Domain Knowledge

### Key Thresholds and Limits (2024)
- Standard Deduction: Single $14,600 | MFJ $29,200 | HOH $21,900 | Age 65+ add $1,850 (Single/HOH) or $1,500 (MFJ)
- SALT Cap: $10,000 (combined state and local taxes)
- Child Tax Credit Phase-out: Begins at $400,000 (MFJ) / $200,000 (Single); $50 reduction per $1,000 over threshold
- EITC Income Limits: Varies by filing status and dependent count (Single with 1 dependent: $46,560; MFJ with 1 dependent: $52,918)
- Medical Expense Deduction: Only amounts exceeding 7.5% of AGI
- Charitable Deduction: Generally limited to 50-60% of AGI depending on asset type
- Capital Loss Carryover: $3,000 per year; unlimited carryforward
- AMT Exemption (2024): Single $85,900 | MFJ $133,900; phases out at 25% of income above threshold

### Deduction Bunching Strategy
- Concentrate discretionary deductions in high-income years to exceed standard deduction threshold
- Applicable when itemized deductions are close to standard deduction (within 10-20%)
- Requires flexibility in timing of charitable gifts, medical procedures, or business expenses
- Example: If standard deduction is $29,200 and itemized deductions are $28,000, bunching $1,500 of charitable gifts into current year (vs. spreading over 2 years) creates $29,500 itemized deductions, exceeding standard deduction by $300

### Income Timing Opportunities
- Bonus deferral (if employer allows; must be agreed before year-end)
- Retirement contribution deadlines: 401k Dec 31, IRA/SEP April 15 (with extension), Solo 401k Dec 31
- Estimated tax payments (quarterly for self-employed: April 15, June 15, Sept 15, Jan 15)
- Business income recognition (accrual vs. cash basis; must be consistent year-to-year)
- Dividend timing (ex-dividend date determines tax year)

### Credit Optimization Rules
- Child Tax Credit: $2,000 per qualifying child under 17; $1,600 per dependent age 17+; partially refundable (up to $1,700)
- AOTC: Up to $2,500 per student; 40% refundable (up to $1,000); requires Form 8863
- EITC: Up to $3,733 (varies by filing status and dependent count); requires Form 8812; high audit rate
- Credits are generally more valuable than deductions (dollar-for-dollar reduction vs. marginal rate reduction)
- Some credits are refundable (EITC, AOTC partial); others are non-refundable

### State-Specific Considerations
- State income tax deductibility (subject to SALT cap)
- State-specific credits (education, energy, dependent care, property tax); varies significantly by state
- State filing requirements based on income and residency
- Multi-state filing implications (if client moved during year or has income in multiple states)
- State estimated tax payments (if state income tax applies)

### Alternative Minimum Tax (AMT) Screening
- AMT applies if tentative minimum tax exceeds regular tax
- Common triggers: large deductions (SALT, mortgage interest, charitable), depreciation, incentive stock options
- AMT exemption (2024): Single $85,900 | MFJ $133,900; phases out at 25% of income above threshold
- If client is AMT-subject, many deductions are disallowed or limited; credits may be non-refundable
- Recommend AMT calculation if: prior year AMT, deductions exceed 60% of income, or income exceeds $200,000

### Estimated Tax Payment Obligations
- Self-employed clients must pay quarterly estimated taxes if expected tax liability exceeds $1,000
- Quarterly payment due dates: April 15, June 15, Sept 15, Jan 15
- Underpayment penalty applies if payments are less than 90% of current year tax or 100% of prior year tax (110% if prior year AGI > $150,000)
- Safe harbor: pay 100% of prior year tax (or 110% if prior year AGI > $150,000) to avoid penalty
- Recommend calculating required payments and comparing to current withholding

### Business Structure Optimization (Self-Employed Clients)
- Sole proprietor: Self-employment tax on all net income (15.3% on 92.35% of net income); no separate entity
- S-Corp: Can reduce self-employment tax by taking reasonable salary + distributions; requires payroll processing; more complex
- C-Corp: Double taxation (corporate + individual); generally not optimal for small business
- LLC: Pass-through entity; can elect S-Corp or C-Corp taxation; flexible
- Recommendation: S-Corp election may save 15-25% on self-employment tax if net income exceeds $60,000; requires cost-benefit analysis

### Documentation and Audit Risk Assessment
- High audit risk: EITC (especially with dependent claims), home office deduction, charitable deductions >$5,000, business losses, rental property losses
- Medium audit risk: Education credits, energy credits, medical expenses, capital loss harvesting
- Low audit risk: Standard deduction, W-2 income, child tax credit (with proper documentation)
- Documentation requirements: Keep receipts, invoices, statements, appraisals, charitable acknowledgments, mileage logs for 3-7 years

---

**Skill Version:** 2.0
**Last Updated:** 2024
**Requires Expertise In:** Tax law, IRS regulations, financial analysis, state tax law
**Recommended For:** Tax professionals, CPAs, financial advisors, individual tax planning
**Confidence Level:** High for federal tax optimization; medium for state-specific optimization (varies by state)