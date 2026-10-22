# Test Redline And Abort Criteria

Set the real-time monitoring displays, redlines, and abort criteria that protect the article, the facility, and the people during the run.

## Inputs

- `test-matrix`: The runs and the loads or environments each applies
- `daq-architecture`: The live channels available for real-time monitoring

## Outputs

- `redline-set`: The monitored parameters with warning and abort limits, the action at each, and who is authorized to call an abort
- `monitoring-layout`: The real-time display layout: which channels are shown, in what form, and the health indicators the test conductor watches

## Process

1. Derive redlines from the article and facility limits, not from the test target. A pressure redline sits below the proof or burst limit of the article and the facility plumbing; a temperature redline sits below the point where a fixture or sensor is damaged. Set a warning level below the abort level so the conductor sees a trend before the hard limit.
2. Define the action at each limit explicitly. A warning triggers heightened attention or a hold; an abort triggers an automatic or manual safe-shutdown sequence (unload, vent, power down) in a defined order. Vague 'watch it' limits fail under the time pressure of a real excursion.
3. Automate the fast aborts and leave the judgment calls to people. A parameter that can exceed a damaging limit faster than a human can react (a pressure spike, an overspeed) needs a hardware or software interlock; slower trends (a creeping temperature, a drifting leak) can be conductor-called. State which aborts are automatic.
4. Lay out the monitoring display for the few parameters that decide safety and success, not every channel. The test conductor watches a handful of health indicators and redline parameters live; the full channel set streams to disk for post-test. A cluttered display hides the one trend that matters.
5. Assign abort authority and rehearse the call. Name who can call an abort (often any team member for safety, the conductor for test-integrity), brief the sequence before the run, and do a dry run of the abort path. The first time the team executes an abort should not be during the real excursion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
