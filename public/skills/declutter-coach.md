# Declutter Coach

A room-by-room decluttering system that doesn't require you to "spark joy" or throw everything away. Takes your space (which rooms), time available, and decluttering goal (moving, downsizing, just want less stuff, preparing to sell house), then builds a realistic plan. Uses the "keep / donate / trash / undecided" framework with a 30-day undecided box rule. Includes disposal logistics: where to donate, what has resale value, how to recycle electronics and hazardous materials. Designed for people drowning in stuff who get overwhelmed at the thought of starting.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESS    --> Survey the situation (rooms, volume, goals, emotional readiness)
PHASE 2: STRATEGY  --> Build the room-by-room attack plan with sequencing
PHASE 3: SORT      --> Category-by-category sorting guide for each room
PHASE 4: DISPOSE   --> Where everything goes (donate, sell, recycle, trash)
PHASE 5: ORGANIZE  --> Arrange what stays so it doesn't re-clutter
PHASE 6: MAINTAIN  --> Habits and systems to prevent re-accumulation
```

## Inputs
- space: object -- Which rooms or areas need decluttering, approximate size of home, storage areas (attic, basement, garage, storage unit)
- goal: string -- Why you're decluttering: moving, downsizing, selling the house, new baby needs a room, just overwhelmed, divorce/estate settlement, hoarding recovery
- timeline: object -- How much time you have (moving in 3 weeks vs. no deadline), hours per week you can dedicate, whether you have help
- emotional_factors: object -- (Optional) Sentimental attachments, deceased loved one's belongings, anxiety about letting go, perfectionism that prevents starting
- constraints: object -- (Optional) Physical limitations (can't lift heavy boxes), no car for donation runs, no local donation centers, roommates or family members who disagree about what goes

## Outputs
- room_plan: object -- Sequenced room-by-room plan with estimated time per room and difficulty rating
- sorting_guide: object -- Category-specific decision criteria for each room (what to keep, donate, trash, sell, undecided)
- disposal_map: object -- Where to take everything: donation centers, resale options, recycling facilities, hazardous waste disposal, bulk trash pickup
- organization_plan: object -- How to arrange what stays so it's functional and stays that way
- maintenance_system: object -- Weekly/monthly habits to prevent re-cluttering
- progress_tracker: object -- Checklist format to mark rooms and categories as completed

## Execution

### Phase 1: ASSESS
**Entry criteria:** At least one room identified and a general goal stated.
**Actions:**
1. Classify the clutter situation honestly:
   - **Light:** Surfaces are cluttered, closets are stuffed, but rooms are functional. 1-2 weekend project.
   - **Moderate:** Some rooms are partially unusable, can't find things easily, guests can't stay in the guest room. Multi-week project.
   - **Heavy:** Multiple rooms are significantly impacted, pathways are narrowed, emotional overwhelm is real. Month-plus project, possibly needs professional help.
   - **Crisis:** Hoarding-level accumulation, safety hazards, health concerns. Recommend professional organizer or hoarding specialist before proceeding with self-guided plan.
2. Understand the goal's urgency: "moving in 3 weeks" is a fundamentally different project than "I'd like less stuff eventually." Urgent timelines mean speed over perfection -- you're sorting into "goes on the truck" and "doesn't go on the truck."
3. Assess emotional readiness: if belongings are tied to grief, identity, or anxiety, acknowledge that this is hard and that it's OK to go slowly. The "undecided box" exists for exactly this reason.
4. Inventory the scope: list every room and area that needs attention. Estimate the volume (a closet is a 2-hour job, a garage might be 2 full days). Multiply estimates by 1.5 because everyone underestimates.
5. Identify the "quick win" room: the one that will make the biggest visible difference with the least emotional difficulty. Start there. Momentum matters more than logic.

**Output:** Clutter classification, timeline assessment, emotional readiness check, room inventory with time estimates, and recommended starting point.
**Quality gate:** Situation is classified honestly. Time estimates include the 1.5x buffer. Quick-win room is identified. Crisis situations are flagged with professional resources.

### Phase 2: STRATEGY
**Entry criteria:** Assessment complete.
**Actions:**
1. Sequence the rooms from easiest to hardest, not biggest to smallest. Starting with the basement full of 20 years of memories is how people quit on day one.
   - **Easy rooms:** Bathroom (mostly expired products), laundry room, linen closet. These are low-emotion, high-impact.
   - **Medium rooms:** Kitchen (gadgets and expired food), kids' rooms (outgrown items), living room (surface clutter).
   - **Hard rooms:** Master bedroom closet (clothing identity), home office (paper avalanche), garage/attic/basement (everything you couldn't deal with before).
   - **Hardest:** Sentimental storage: deceased loved one's belongings, childhood memorabilia, photos.
2. Break each room into timed sessions: no single session should exceed 3 hours. After 3 hours, decision fatigue sets in and everything becomes "I'll deal with it later."
3. For each room, define the "done" state: what does this room look like when it's decluttered? Be specific. "The closet has space between hangers" is better than "the closet is organized."
4. Plan the sorting station: designate a staging area with four bins or zones: Keep, Donate, Trash, Undecided. The Undecided box gets sealed, dated, and stored. If you haven't opened it in 30 days, donate the contents without looking inside.
5. Schedule sessions: assign rooms to specific days/weekends. Build in rest days. Burnout is the number one reason decluttering projects fail.

**Output:** Sequenced room plan with session lengths, done-state definitions, sorting station setup, and calendar schedule.
**Quality gate:** Sequence goes easy to hard. No session exceeds 3 hours. Every room has a clear "done" definition. Rest days are included.

### Phase 3: SORT
**Entry criteria:** Room sequence established.
**Actions:**
1. For each room, provide category-specific sorting criteria:
   - **Clothing:** If you haven't worn it in 12 months and it's not formalwear or seasonal, it goes. Doesn't fit? Goes. Keeping it for "when I lose weight"? Goes. Stained, pilled, stretched? Trash.
   - **Kitchen:** Duplicate gadgets (how many spatulas do you actually use?), expired food and spices (check dates), single-use appliances gathering dust, mismatched containers without lids.
   - **Paper:** Shred anything with personal info older than 7 years (tax docs) or 1 year (bank statements). Digitize what matters. Recycle the rest. You don't need the manual for a toaster you don't own.
   - **Books:** Keep the ones you'll reread or reference. "I might read it someday" books have been sitting there for 3 years. Donate them so someone actually reads them.
   - **Sentimental items:** You don't have to throw away grandma's dishes. But you also don't need 14 boxes of them. Keep the meaningful pieces, photograph the rest, let them go.
   - **Kids' stuff:** Keep current-size clothing plus one size up. Outgrown toys get donated while they're still in good shape. Art projects: keep 5-10 favorites per year, photograph the rest.
   - **Electronics:** If it doesn't work, recycle it properly. If it works but you haven't used it in 2 years, sell or donate it. Random cables for devices you no longer own? Recycle.
2. Provide the "five-second rule" for decisions: pick up the item, if you can't immediately say why you need it within 5 seconds, it goes in Undecided. Don't agonize.
3. Address the common sticking points:
   - "But I paid a lot for it" -- sunk cost. It's not giving you value sitting in a box. Selling it recovers some cost. Keeping it recovers none.
   - "Someone gave it to me" -- the gift was the thought, not the object. You honored it by receiving it. You're allowed to release it.
   - "I might need it someday" -- if you replace it for under $20 and haven't needed it in a year, let it go.

**Output:** Room-by-room sorting guide with category-specific criteria, decision shortcuts, and scripts for common emotional blocks.
**Quality gate:** Criteria are specific and actionable, not vague. Emotional blocks are addressed directly. Sentimental items are handled with respect, not dismissed.

### Phase 4: DISPOSE
**Entry criteria:** Sorting categories established.
**Actions:**
1. **Donate items** -- map out local options:
   - Goodwill, Salvation Army, local thrift stores (call first about what they accept).
   - Women's shelters (professional clothing, toiletries, household goods).
   - Animal shelters (old towels, blankets, newspapers).
   - Libraries (books, DVDs, audiobooks).
   - Habitat for Humanity ReStore (tools, building materials, appliances, furniture).
   - Buy Nothing groups on Facebook (hyper-local, no transportation needed, people pick up).
   - Freecycle.org for larger items.
2. **Sell items** -- assess what's worth the effort:
   - Worth selling (>$30 resale): electronics under 3 years old, designer clothing, quality furniture, tools, musical instruments, sporting equipment.
   - Not worth selling (<$30): most clothing, books, kitchen gadgets, decor. Donate instead; the time spent listing isn't worth $5.
   - Platforms: Facebook Marketplace (furniture, large items), Poshmark/ThredUp (clothing), eBay (collectibles, electronics), Craigslist (free stuff you need gone fast).
3. **Recycle** -- beyond the regular bin:
   - Electronics: Best Buy, Staples, or municipal e-waste events. Never trash electronics.
   - Batteries: Home Depot, Lowe's, or municipal collection.
   - Paint, chemicals, cleaners: hazardous waste collection days (check municipal website).
   - Textiles too worn to donate: H&M and other retailers have textile recycling programs.
   - Prescription medications: pharmacy take-back programs, DEA collection events.
4. **Trash** -- last resort:
   - Broken items that can't be recycled or donated. Truly worn-out goods.
   - Schedule bulk pickup with your municipality for large items (furniture, mattresses).
   - Rent a dumpster for major cleanouts (typically $300-500 for a weekend).
5. **Shred** -- anything with personal information: bank statements, old tax docs, medical records, pre-approved credit offers.

**Output:** Disposal map with specific local options per category, resale value assessment, recycling locations, and bulk trash logistics.
**Quality gate:** Every category of removed item has a designated destination. Hazardous materials have proper disposal paths. Resale value assessment is realistic about effort vs. return.

### Phase 5: ORGANIZE
**Entry criteria:** Sorting and disposal plan complete.
**Actions:**
1. For each room, design a "home" for everything that stays. Every item needs a place it lives. If it doesn't have a place, it ends up on the counter.
2. Apply the frequency principle: things you use daily go in the most accessible spots. Things you use monthly go on higher shelves or in the back. Things you use annually go in storage.
3. Recommend storage solutions only after decluttering, not before. Buying organizers before removing excess is putting lipstick on clutter. Simple solutions first: shelf dividers, drawer organizers, clear bins with labels, over-door hooks.
4. The "one in, one out" rule: from now on, if something new comes in, something comparable leaves. New shirt? Donate an old one. New kitchen gadget? Which one is it replacing?
5. Flat surface management: counters, tables, and desks are clutter magnets. Define what's allowed to live on each surface. Everything else has a drawer, shelf, or cabinet it belongs in.
6. Paper flow system: mail is sorted at the door (trash, action, file). Action items go in one spot. Filing happens weekly. No more paper piles.

**Output:** Room-by-room organization plan with specific storage solutions, flat surface rules, and paper management system.
**Quality gate:** Every kept item has a designated home. Storage solutions are recommended for what remains, not what was removed. System is maintainable by the actual person, not an idealized version of them.

### Phase 6: MAINTAIN
**Entry criteria:** Organization complete.
**Actions:**
1. **Daily habit (5 minutes):** Before bed, do a 5-minute reset -- put things back where they belong. Not a deep clean, just returning items to their homes.
2. **Weekly check (15 minutes):** Pick one area per week for a quick scan. Is stuff accumulating? Deal with it now while it's small.
3. **Monthly assessment (30 minutes):** Walk through the house with a donation bag. Grab anything that's drifted into "I don't use this anymore" territory.
4. **Seasonal purge (2-3 hours):** Once per season, do a focused session on one room. Swap seasonal clothing, reassess kitchen gadgets, clear out expired items.
5. **Shopping guardrails:** Before buying anything non-consumable, wait 48 hours. If you still want it after 48 hours, decide where it will live in your home before purchasing.
6. **Gift management:** Communicate preferences to family (experience gifts, consumables, donations to charity). Politely decline gifts that will become clutter. You're allowed to do this.

**Output:** Maintenance schedule with daily, weekly, monthly, and seasonal routines plus shopping and gift management guidelines.
**Quality gate:** Routines are realistic time commitments. Shopping guardrails address the root cause of re-cluttering. System accounts for real life, not ideal conditions.

## Exit Criteria
Done when: (1) every targeted room has a sorting plan with specific criteria, (2) disposal map covers donate, sell, recycle, and trash with local options, (3) organization plan gives every kept item a home, (4) maintenance system includes daily through seasonal routines, (5) emotional considerations are addressed without dismissing them, (6) timeline is realistic for the stated availability.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Situation is hoarding-level (safety hazards, blocked exits, health risks) | Escalate -- recommend professional organizer specializing in hoarding, provide IOCDF resources, do not proceed with self-guided plan |
| ASSESS | Person is being forced to declutter by someone else (spouse, parent) and isn't ready | Adjust -- redirect to the small-win approach. Start with one drawer. Build agency and momentum rather than compliance |
| STRATEGY | Timeline is impossible (moving in 5 days, 4-bedroom house untouched) | Adjust -- switch to triage mode: pack essentials, donate/trash obvious items, box everything else and sort after the move |
| SORT | Grief-connected items (deceased loved one's belongings) | Adjust -- slow down significantly. No timelines on grief. Suggest keeping a memory box of key items, photographing the rest, and giving yourself permission to take months |
| DISPOSE | No car, no local donation centers, no ability to haul things | Adjust -- schedule donation pickups (Salvation Army, Vietnam Veterans, local charities), use Buy Nothing groups where people come to you, request bulk trash pickup from municipality |
| MAINTAIN | Re-cluttering happens within weeks | Adjust -- identify the source: is it shopping? Gifts? Mail? Paper? Target the specific inflow rather than re-doing the whole declutter |

## State Persistence
- Room progress tracker (which rooms are done, in progress, or untouched)
- Donation and disposal log (what went where, receipts for tax deductions)
- Undecided box inventory (what's in the 30-day box, when the timer expires)
- Maintenance compliance (are the daily/weekly routines happening?)
- Clutter hotspot patterns (which areas re-clutter fastest -- these need systemic solutions, not just willpower)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.