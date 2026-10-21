# Post a GitLab Merge Request Review with Inline Threads

**One-line description:** Posts each review comment as a GitLab merge request discussion anchored with the MR's `diff_refs` (base, start and head SHAs) through the Discussions API with `glab api`, adds the summary note, approves only when the verdict is APPROVE, and verifies the thread count, since GitLab blocks merging on unresolved threads rather than on a "request changes" state in many configurations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone whose `origin` is the GitLab project.
- `pr_number` (integer, required): Merge request IID.
- `head_sha` (string, required): The commit the comments were written against.
- `review_comments` (object[], required): Comments from `prr-severity-comments`.
- `review_verdict` (string, required): `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`.
- `verdict_rationale` (string, required): Summary body.

---

## Outputs

- `posted_review_url` (string): Web URL of the merge request's summary note.

---

## Phase 1: Read Diff Refs and Project ID

### Entry Criteria
- `glab auth status` shows a logged-in account with at least Developer or Reporter access as the project requires for commenting.

### Actions
1. Read the MR: `glab api projects/:id/merge_requests/<pr_number>` run inside `repo_dir` (`glab api` replaces `:id` with the current project; confirm with `glab api --help` that your version supports the placeholder, else use the URL-encoded path such as `acme%2Fshop`).
2. From the response record `diff_refs.base_sha`, `diff_refs.start_sha`, `diff_refs.head_sha`, and `web_url`.
3. Confirm `diff_refs.head_sha` equals `head_sha`. If not, stop: the MR has new commits.
4. Read whether the project requires resolved threads before merge: `glab api projects/:id` field `only_allow_merge_if_all_discussions_are_resolved`. Record it; it decides how blocking comments block.

### Output
Diff refs, MR web URL, thread-resolution setting.

### Quality Gate
- `diff_refs.head_sha` equals `head_sha`.
- All three diff ref SHAs are recorded.

---

## Phase 2: Create One Discussion per Inline Comment

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each inline comment, create a discussion with a text position:
   ```
   glab api --method POST projects/:id/merge_requests/<pr_number>/discussions \
     -f body="<comment body>" \
     -f "position[position_type]=text" \
     -f "position[base_sha]=<base_sha>" \
     -f "position[start_sha]=<start_sha>" \
     -f "position[head_sha]=<head_sha>" \
     -f "position[new_path]=<path>" \
     -f "position[old_path]=<old path or same path>" \
     -f "position[new_line]=<line>"
   ```
   For a comment on a deleted line use `position[old_line]` instead of `new_line`. Check `glab api --help` for the field flag spelling in your version (`-f`/`--raw-field` and `-F`/`--field`).
2. Record each response's discussion `id`. A 400 response with a position error means the line is not in the diff: put that comment into the summary note instead.
3. Do not mark your own blocking threads as resolved.

### Output
Discussion IDs per comment.

### Quality Gate
- Every inline comment has a discussion `id` or was moved to the summary with the error recorded.

---

## Phase 3: Summary, Approval and Verification

### Entry Criteria
- Phase 2 complete.

### Actions
1. Post the summary as a note: `glab mr note <pr_number> -m "<verdict_rationale>"`. Include file-level comments and any comment moved from Phase 2.
2. Act on the verdict:

| `review_verdict` | Action |
|---|---|
| APPROVE | `glab mr approve <pr_number>` |
| REQUEST_CHANGES | Do not approve. Blocking threads stay unresolved. If `only_allow_merge_if_all_discussions_are_resolved` is false, state in the summary that the blocking threads must be resolved before merge, and if your GitLab version offers a "request changes" review state, use it through the web UI or the documented API |
| COMMENT | Do not approve; summary only |

3. If you approved earlier and now request changes, revoke: `glab mr revoke <pr_number>`.
4. Verify: `glab api projects/:id/merge_requests/<pr_number>/discussions --paginate` and count discussions whose first note's author is you and whose `position` is set; it must equal the number created. For APPROVE, check `glab api projects/:id/merge_requests/<pr_number>/approvals` lists you in `approved_by`.
5. Set `posted_review_url` to the summary note's URL (`<web_url>#note_<note id>`).

### Output
`posted_review_url`.

### Quality Gate
- The discussion count with positions equals the number created in Phase 2.
- For APPROVE, `approved_by` contains your username; for other verdicts it does not.

---

## Worked Example

Illustrative. MR `!77`, verdict REQUEST_CHANGES, 1 inline comment.

- Phase 1: `glab api projects/:id/merge_requests/77` gives `diff_refs` base `7c1d2e3...`, start `7c1d2e3...`, head `9f3c1e0...` (equals `head_sha`); `only_allow_merge_if_all_discussions_are_resolved` = true.
- Phase 2: discussion POST with `position[new_path]=invoices/views.py`, `position[new_line]=4` returns `{"id": "6a9c1f...", "notes": [{"position": {...}}]}`.
- Phase 3: `glab mr note 77 -m "REQUEST_CHANGES: 1 blocking ..."`; no approval; the unresolved thread blocks merge because of the project setting. Discussion count with position = 1.

---

## Exit Criteria

DONE when every inline comment is a positioned discussion on the reviewed head (or moved into the summary with the reason), the summary note is posted, approval matches the verdict, and counts are verified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `:id` placeholder not supported | **Adjust**: use the URL-encoded project path in the API URL. |
| Phase 1 | Head moved | **Return**: rerun the review on the new head before posting. |
| Phase 2 | 400 position invalid | **Adjust**: move the comment into the summary note. |
| Phase 3 | `glab mr approve` fails with 401 or 403 | **Stop**: you are not an eligible approver; post the summary and name the required approvers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
