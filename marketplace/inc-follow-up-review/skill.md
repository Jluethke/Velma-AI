# Incident Follow-Up Tracking Review

**One-line description:** Queries the tracker for every action item labeled with an incident ID, classifies each as done-and-verified, on track, overdue or stalled by fixed rules, checks that closed items meet their done condition, and produces a follow-up report for the review meeting.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `action_items` (object[], required): From `inc-action-items-file`; includes the incident label.
- `issue_tracker` (string, required): `github` or `jira`.
- `tracker_project` (string, required): `<owner>/<repo>` or the Jira project key.

---

## Outputs

- `follow_up_report` (object): {as_of_utc, counts by status, items (key, title, owner, due_date, status, evidence), closed_without_evidence, escalations}.

---

## Phase 1: Pull Current State

### Entry Criteria
- `action_items` is non-empty.

### Actions
1. Query by the incident label, not by memory:
   - GitHub:
     ```
     gh issue list --repo <owner>/<repo> --label <incident-label> --state all \
       --json number,title,state,assignees,updatedAt,closedAt,url --limit 100
     ```
   - Jira: `curl -sS -u "$JIRA_USER:$JIRA_API_TOKEN" -G "https://<site>.atlassian.net/rest/api/3/search/jql" --data-urlencode 'jql=labels = <incident-label>' --data-urlencode 'fields=summary,status,assignee,duedate,updated,resolutiondate'`. Jira Cloud has been moving search to this endpoint; if it returns 404 on your site, check the Jira Cloud REST docs for the current search endpoint.
2. Compare the count returned with the count in `action_items`. A difference means an item lost its label or was moved.
3. Get today's date in UTC with `date -u +%Y-%m-%d`.

### Output
Current state for each item.

### Quality Gate
- The tracker returned the same number of items as `action_items`, or the missing ones are listed.

---

## Phase 2: Classify

### Entry Criteria
- Current state is pulled.

### Actions
1. Apply the rules in order; the first match wins:

| Rule | Status |
|---|---|
| Closed, and the done condition's evidence is linked in the ticket (test name, PR merged, alert drill result) | done_verified |
| Closed, and no evidence of the done condition | closed_without_evidence |
| Open, due date is before today | overdue |
| Open, no update since the previous review | stalled |
| Open, otherwise | on_track |

2. For each closed item, open the linked evidence and check it: the test exists in the default branch (`gh search code` or `git grep <test name> origin/main`), the PR is merged (`gh pr view <n> --json state,mergedAt`), the alert rule exists in the rules repository.
3. Do NOT accept "closed as won't fix" as done. Record it with the reason and flag it for the review, since the risk it addressed remains.

### Output
Status per item with evidence.

### Quality Gate
- Every item has exactly one status.
- Every done_verified item has evidence that was opened and checked (command output quoted).

---

## Phase 3: Report and Escalate

### Entry Criteria
- Items are classified.

### Actions
1. Write `follow_up_report` with counts per status and the item table.
2. Escalate by rule: overdue or stalled Prevent-type items go to the owner's manager and the postmortem owner; closed_without_evidence items are reopened with a comment asking for the evidence (`gh issue reopen <n> --comment "<text>"`, or a Jira transition per the project's workflow).
3. Post the report in the team's reliability or operations review and link it from the postmortem.
4. Repeat this flow on the cadence set by the organization's reliability review; stop when every item is done_verified or explicitly accepted as risk by the service owner.

### Output
`follow_up_report`.

### Quality Gate
- Counts in the report add up to the number of items.
- Each escalation names a person and a date it was sent.

---

## Worked Example

Illustrative only. Label `inc-20261020-1406`, repository `shop/checkout`, four items.

- Phase 1: `gh issue list --repo shop/checkout --label inc-20261020-1406 --state all --json ...` returns #812 to #815. Count matches.
- Phase 2: #812 closed, linked PR #820; `gh pr view 820 --json state,mergedAt` shows MERGED; test `TestTimeoutOpensCircuit` found by `git grep` on origin/main: done_verified. #813 closed with no link: closed_without_evidence. #814 open, due yesterday: overdue. #815 open, updated this week: on_track.
- Phase 3: Counts: 1, 1, 1, 1. #813 reopened with a comment. #814 (Prevent) escalated to the owner's manager. Report linked from the postmortem.

---

## Exit Criteria

DONE when every action item has a rule-based status with checked evidence, escalations are sent, and the report is posted and linked from the postmortem.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Item count mismatch | **Adjust**: search by ticket key from `action_items` directly and restore the missing label. |
| Phase 2 | Evidence link is dead | **Adjust**: classify as closed_without_evidence and reopen. |
| Phase 3 | Owner left the team | **Return**: to the postmortem owner to reassign; record the change. |
| Phase 3 | Tracker API rate limited | **Retry**: wait for the reset time in the response headers, then rerun Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
