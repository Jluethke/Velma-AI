# Behavioral Model Assembly

Assemble all inferred components (state machine, acceptance logic, integrity algorithms, signal routing) into a complete behavioral firmware model. The assembled model predicts the controller's output for any input sequence. Validate against held-out captured data and score each component by evidence strength.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load all inferred components and held-out validation data
REASON  --> Combine into unified predictive model
PLAN    --> Validate predictions against real data, score confidence
ACT     --> Output behavioral model, confidence map, open questions
```

## Inputs

- `state_machine`: object -- Inferred state machine from state-machine-inference
- `acceptance_logic`: object -- Command acceptance conditions per state
- `checksum_algorithms`: list[object] -- Proven integrity algorithms from integrity-field-extraction
- `routing_graph`: object -- Inter-controller signal routing from signal-routing-graph
- `signal_ranges`: list[object] -- Observed signal bounds from io-observation-inventory

## Outputs

- `behavioral_model`: object -- Complete specification: for any input message sequence, the predicted output message sequence, including state transitions and integrity fields
- `confidence_map`: object -- For each model component: evidence strength (number of observations, correlation coefficient, match rate, number of observed transitions)
- `open_questions`: list[object] -- Behaviors that could not be resolved from available data, with the specific observation needed to close each one

---

## Execution

### OBSERVE: Load Components

1. Load all inferred components. Verify they reference the same controller and the same bus configuration.
2. Reserve 20-30% of the captured data as a held-out validation set (frames the model has never seen during inference).
3. Verify that the held-out set covers multiple operating modes (not just one steady-state condition).

### REASON: Assemble the Unified Model

1. **Wire the state machine to the acceptance logic.** Each state defines which commands are accepted and which are rejected. The acceptance conditions become guard clauses on state transitions.

2. **Wire the routing graph to the state machine inputs.** The state machine's input triggers come from other controllers' messages. The routing graph tells us which signal on which message is the trigger for each transition.

3. **Wire the integrity algorithms to the output generator.** Every message the model predicts must include valid checksum and counter fields, computed by the proven algorithms.

4. **Define output generation per state.** For each state in the state machine:
   - Which messages does the controller transmit?
   - At what rate?
   - What signal values? (Constant, function of inputs, or function of internal state)
   - How are integrity fields computed?

5. **Build the prediction function.** Given a sequence of input messages (with timestamps):
   - Determine the current state from the state machine
   - Apply acceptance logic to any command inputs
   - Compute output signal values based on state and input signals
   - Generate output messages with correct integrity fields
   - Advance the state machine on transitions

### PLAN: Validate and Score

1. **Run prediction on held-out data.** Feed the held-out input messages to the model and compare predicted outputs to actual outputs:
   - Match rate for discrete signals (predicted value == actual value)
   - RMSE for continuous signals (predicted value near actual value)
   - State match rate (predicted state == inferred actual state)

2. **Score each component by evidence strength:**
   - Checksum algorithms: match rate (should be 100%)
   - Counter formats: sequence continuity rate
   - State machine: number of observed transitions per edge
   - Acceptance logic: number of accept/reject observations per condition
   - Signal routing: correlation coefficient for each edge

3. **Identify weak components.** Any component with fewer than 10 supporting observations or r < 0.80 is flagged as low-confidence.

4. **List open questions.** For each low-confidence component or unobserved state:
   - What specific observation would close it?
   - What input condition is needed to reach the unobserved state?
   - How long would the observation take?

### ACT: Deliver

1. Format the behavioral model as a specification document: state machine + output tables + acceptance conditions + integrity algorithms, all cross-referenced.
2. Format the confidence map: a table of every component with its evidence metric and confidence classification (high/medium/low).
3. Format open questions as a prioritized list: highest-impact unknowns first.

## Exit Criteria

1. The model predicts held-out data with > 90% accuracy on discrete signals
2. Every component has a confidence score
3. Open questions are listed with specific closure observations
4. The model is self-contained: it can predict outputs without referencing the original captures

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| REASON | Components reference different controllers | Abort; components must be from the same controller |
| PLAN | Held-out prediction accuracy < 50% | Model is structurally wrong; return to state-machine-inference with more data |
| PLAN | No held-out data available | Use leave-one-out cross-validation on the training data instead |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
