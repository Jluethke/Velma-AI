# Statistical Safety Argument

Construct the statistical argument that the autonomous system is acceptably safe: define the safety target, compute the required test volume, and assess the residual risk.

## Inputs

- `scenario-library`: Test scenarios with results
- `validation-objectives`: Safety target and confidence level

## Outputs

- `safety-argument`: Statistical safety argument with evidence, assumptions, and residual risk quantification
- `test-completeness`: Assessment of whether sufficient testing has been performed to support the safety claim

## Process

1. Define the safety target. Common formulation: the system shall have a fatality rate below X per mile (or per hour). The target is often derived from human driver performance: the system must be at least as safe as an attentive human driver, or N times safer. In the US, the human fatality rate is approximately 1.1 per 100 million miles. A target of 10x safer requires demonstrating a rate below 0.11 per 100 million miles. This is the statistical challenge: proving a very low rate requires enormous evidence.
2. Compute the required test volume for a purely statistical argument. To demonstrate a failure rate below lambda with confidence C, you need approximately -ln(1-C)/lambda miles (or scenarios) with zero failures. For lambda = 10^-8 per mile (10x safer than human) at 95% confidence: need 3*10^8 miles. This is infeasible with real-world driving alone (billions of miles). This is why simulation is essential: accelerate testing by running millions of scenarios in simulation, each representing a miles-equivalent of driving.
3. Construct a structured safety argument that combines evidence types. Pure mileage-based argument: we drove/simulated N miles with zero fatalities, therefore the rate is below X. Scenario-based argument: we tested all scenario types in the ODD, each with parameter variation, and the system passed all. Analysis-based argument: the system architecture has redundancy and fault detection that provides a calculated residual risk below the target. Combine these into a multi-pronged argument: simulation covers breadth (millions of scenarios), real-world testing validates that simulation results transfer, analysis fills gaps where testing cannot reach. The argument is stronger when all three prongs agree.
4. Assess residual risk and known limitations. After all testing and analysis, quantify the residual risk: the probability that the system encounters a scenario it cannot handle, multiplied by the probability of harm. The residual risk includes: scenarios in ODD Area 3 (unknown hazardous, see SOTIF analysis), hardware failures not covered by redundancy, environmental conditions beyond the ODD that the system fails to detect and reject. Document these honestly. The safety case is an argument, not a proof; it must be transparent about what is known, what is assumed, and what remains uncertain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
