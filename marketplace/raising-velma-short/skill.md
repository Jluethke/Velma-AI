# Raising the system Short

Cut a Raising the system vertical short (Reels / Shorts) from the owner's real footage,
his own voice, and the silent dashboard plates made by `wk2-dashboard-video`. This
is the second half of the `raising-velma-content` chain. Every rule below exists
because the owner rejected a cut that broke it.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY --> Group every clip by shoot day. Mark which clips show him
                       on camera. Day = outfit.
PHASE 2: PICK      --> Read the day's transcripts end to end. Pick one idea per
                       short and the complete sentences that carry it.
PHASE 3: AUTHOR    --> Write edl/<name>.json for edit_v3.py. Voice is the spine;
                       picture is plates, b-roll, screen, or the same day's face.
PHASE 4: GATE      --> rv_check.py <name>: rules, render, transcript, 1 fps sheet.
PHASE 5: REVIEW    --> Watch it as a random viewer. Fix, re-gate.
PHASE 6: DELIVER   --> SendUserFile (compress under 30 MB). Package to out/final
                       only after the owner approves.
```

## Inputs

- `ask`: string. The owner's literal request.
- `footage`: dir. Default `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\footage` (junction to the F: Raisingthe system tree).
- `plates`: list. Silent dashboard clips from `wk2-dashboard-video`
  (`gen_collection.mp4`, `gen_decode.mp4`, `gen_systemcheck.mp4`).

## Outputs

- `edl`: `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\edl\<name>.json`
- `mp4`: `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\out\Raisingthe system_<NAME>.mp4`
- `review`: the gate transcript and frame sheet.

## Hard rules

1. Always the pipeline. Every cut goes through `edit_v3.py` EDLs (auto word-pop
   captions, one CTA, loop, style). Never a bare ffmpeg cut.
2. One shoot day per short for on-camera picture. He wears a different outfit each
   day. Hands-only shots, b-roll, screen and OBS recordings, and dashboard plates are
   outfit-neutral and can go anywhere.
3. One sentence, one take. Never splice two takes or two clips into one sentence.
   Cut only between complete sentences. Check every window against the words.json.
4. No bloopers. No flubbed takes, no repeated takes, no "TAKE n" counters.
5. Hook: the big question in the first 2 to 3 s, his own line or a `kw` card
   (each line 15 characters or fewer).
6. Kallaway beats: stakes, big question, headfake, rehook near the midpoint,
   contrast. Only true claims. No invented deadline, price, or number.
7. The creep (fake-CCTV break-in, `look: cctv`, no text labels, the system "Jinkies."
   only) opens EVERY short. It is exempt from the outfit rule: it is a CCTV bumper,
   and a new creep is filmed each week. Creeps live in `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\edl\_creeps.json`
   (each entry is the FULL creep as cut, never trimmed); `set_creep.py <creep_id> <shorts...>`
   swaps them, `set_creep.py --list` shows which short uses which creep.
8. Picture over talk. When he talks about reading the car, signals, codes, or the
   dashboard, the picture is the dashboard plates. His face on screen for about
   half the runtime or less.
9. Exactly one share card between 25% and 60% of the runtime. At most two the system
   reaction lines. Never the word "bouncer". No patent language.
10. A REAL loop: the payoff line, then the creep's CCTV empty-driveway lead-in as a `seam`
    segment, so the replay runs straight into the creep. `loop_into_first` alone loops nothing.
    `set_creep.py` adds the seam; the gate fails any short without it.
11. Pacing: short punchy sentences with breathing room. Dense run-on narration
    reads "too fast". One idea per short, 15 to 35 s.

## Shoot days (current footage)

- 2026-10-03, pink hoodie: IMG_2567 (intro; only take 11 91.0-95.62 and 26.74-28.98
  are clean), IMG_2568, IMG_2570 (unboxing).
- 2026-10-04, beanie, plaid, maroon jacket: IMG_2589 (opening selfie only; the rest
  is the laptop screen), IMG_2590 (screen + real rev audio).
- 2026-10-05, plaid shirt: IMG_2611 (the creep), IMG_2612, IMG_2613, IMG_2614, IMG_2616.
- 2026-10-06, red beanie and grey Monmouth hoodie: IMG_2647 (walk-up), IMG_2654
  (30-min session). OBS session recording `obs_read.mp4` syncs at IMG_2654 + ~177 s.
- Outfit-neutral: IMG_2571, IMG_2626, IMG_2627, IMG_2629, IMG_2631, IMG_2649,
  IMG_2651, IMG_2653, D40FBB56 (burned-in caption, lower third), the plates.
- Never use IMG_2630, IMG_2569, or velma_broll.mp4 (mock gauges, owner rejected).

## Gate before sending

`python F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\scripts\rv_check.py <name>` fails the cut on a mixed-day picture,
a take counter, a CTA count other than one, or a missing loop or hook. It then renders,
transcribes the render (read it: a mixed sentence shows up as text), and writes a
1 fps sheet. Read both as a first-time viewer before sending.

---

## Worked Example

Illustrative only.

Given typical inputs for Cut a Raising the system vertical short from the owner's real footage, his own voice,, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
