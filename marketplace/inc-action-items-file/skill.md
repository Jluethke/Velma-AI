# Incident File Postmortem Action Items

**One-line description:** Turns the reviewed postmortem's candidate actions into tracked tickets in GitHub Issues or Jira, each with one owner, a type, a priority, a due date and a checkable done condition, all labeled with the incident ID so they can be queried later.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `postmortem_doc` (object, required): From `inc-postmortem-blameless` with review status "reviewed".
- `issue_tracker` (string, required): One of `github`, `jira`.
- `tracker_project` (string, required): For github, `<owner>/<repo>`; for jira, the project key, for example `OPS`.

---

## Outputs

- `action_items` (object[]): {key_or_number, url, title, type (Prevent, Mitigate, Detect, Respond), owner, priority, due_date, done_condition, incident_label}.

---

## Phase 1: Finalize Each Action

### Entry Criteria
- `postmortem_doc` review status is "reviewed".

### Actions
1. For each candidate action, fill these fields; reject any action missing one:

| Field | Rule |
|---|---|
| title | starts with a verb and names the system: "Add circuit breaker to checkout pricing client" |
| type | Prevent, Mitigate, Detect or Respond |
| owner | one named person, not a team |
| priority | from the organization's priority scheme; if none, the postmortem review assigns it and records the choice |
| due_date | set in the review; no default is invented here |
| done_condition | a check someone else can run: a test name, an alert firing in a drill, a runbook link that exists |

2. Merge duplicates. Split any action with "and" in the title into two.
3. Do NOT file actions such as "be more careful" or "remember to"; they have no done condition. Send them back to the postmortem owner.

### Output
Final action list.

### Quality Gate
- Every action has all six fields filled.
- No title contains "and" joining two tasks.

---

## Phase 2: Create the Tickets

### Entry Criteria
- Final action list exists.

### Actions
1. Create a label from the incident ID, lowercased, for example `inc-20261020-1406`, plus a shared label such as `incident-followup`.
2. GitHub (authenticated with `gh auth status`):
   ```
   gh label create inc-20261020-1406 --repo <owner>/<repo> --description "Follow-up for INC-20261020-1406"
   gh label create incident-followup --repo <owner>/<repo>   # skip if it already exists
   gh issue create --repo <owner>/<repo> --title "<title>" --body-file action-1.md \
     --label inc-20261020-1406 --label incident-followup --assignee <github-user>
   ```
   Put type, priority, due date, done condition and the postmortem link in `action-1.md`. GitHub Issues has no built-in due date field; if the repository uses a GitHub Project with a date field, set it there and record how.
3. Jira (REST API v2 accepts a plain-text description; v3 requires Atlassian Document Format):
   ```
   curl -sS -u "$JIRA_USER:$JIRA_API_TOKEN" -H "Content-Type: application/json" \
     -X POST "https://<site>.atlassian.net/rest/api/2/issue" \
     -d '{"fields":{"project":{"key":"OPS"},"issuetype":{"name":"Task"},"summary":"<title>","description":"<body>","labels":["inc-20261020-1406","incident-followup"],"duedate":"<YYYY-MM-DD>"}}'
   ```
   The response contains `key` and `self`. Setting the assignee requires the user's `accountId`; check the Jira Cloud REST docs. The `duedate` field must be on the project's create screen or the API rejects it.
4. Create one ticket at a time and read each response before the next. Do NOT loop blindly; a rejected field fails every ticket the same way.

### Output
Created tickets with keys or numbers.

### Quality Gate
- Every action has a ticket URL from a command response.
- GitHub: `gh issue list --repo <owner>/<repo> --label inc-20261020-1406 --state open` lists them all. Jira: a JQL search `labels = inc-20261020-1406` returns them all.

---

## Phase 3: Link Back

### Entry Criteria
- All tickets exist.

### Actions
1. Add each ticket link to the postmortem's Action Items section.
2. Post the list in the incident channel with owners tagged.
3. Fill `action_items`.

### Output
`action_items`.

### Quality Gate
- The postmortem lists the same number of tickets as `action_items`.

---

## Worked Example

Illustrative only. GitHub repository `shop/checkout`.

- Phase 1: Four actions finalized; "Add circuit breaker and fallback" split into "Add circuit breaker to pricing client" and "Return cached price as fallback when the circuit is open".
- Phase 2: `gh issue create --repo shop/checkout --title "Add circuit breaker to pricing client" --body-file action-1.md --label inc-20261020-1406 --label incident-followup --assignee dana` prints `https://github.com/shop/checkout/issues/812`. Four issues created; `gh issue list --label inc-20261020-1406` lists #812 to #815.
- Phase 3: Links added to the postmortem; owners tagged in the channel.

---

## Exit Criteria

DONE when every reviewed action exists as a ticket with one owner, type, priority, due date and done condition, labeled with the incident ID and linked from the postmortem.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner refuses an action | **Return**: to the postmortem owner to reassign in review. |
| Phase 2 | `gh` reports "could not add label" | **Adjust**: create the label first with `gh label create`, then retry. |
| Phase 2 | Jira 400 on a field | **Adjust**: read the `errors` object in the response, fix that field, and retry the one ticket. |
| Phase 2 | No permission to create issues | **Stop**: ask the project admin; do not file in a different project. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
