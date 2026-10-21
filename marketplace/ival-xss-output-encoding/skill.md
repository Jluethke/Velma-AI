# XSS Fix With Context-Aware Output Encoding

**One-line description:** Fixes each cross-site scripting sink by identifying the exact output context (HTML body, quoted attribute, URL attribute, inline script data, CSS) and applying that context's encoder: template autoescaping in Jinja2, Django and Go `html/template`, JSX text in React, `JSON` in a `script type="application/json"` block for data, a scheme allowlist for URLs, and DOMPurify or nh3 only where user HTML is a requirement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go` (server); the browser framework is found in Phase 1.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `xss`.

---

## Outputs

- `xss_fixes` (object): `fixed` (file, line, context, encoder applied), `kept_html` (sinks that keep user HTML, with sanitizer config), `test_file`, `test_run`.

---

## Phase 1: Classify Each Sink by Output Context

### Entry Criteria
- One or more `xss` rows in `sink_map.sinks`.

### Actions
1. Confirm autoescaping is on, because every later step assumes it:

| Engine | Check | Required state |
|---|---|---|
| Flask / Jinja2 | `rg -n "autoescape" --type py`; Flask enables autoescape for `.html`, `.htm`, `.xml`, `.xhtml` (and `.svg` in recent versions) templates | No `autoescape=False`; templates with other extensions are not autoescaped, so rename them to `.html` |
| Plain Jinja2 `Environment` | `Environment(autoescape=select_autoescape(["html", "xml"]))` | `Environment()` without `autoescape` is OFF by default |
| Django | search for `autoescape off`, the `safe` filter, `mark_safe` and `format_html` (command below) | autoescape on by default; each hit is a sink |
| Go | `rg -n "\"text/template\"" --type go` | HTML output must use `html/template`; `text/template` never escapes |
| React | `dangerouslySetInnerHTML` hits | JSX text `{value}` is escaped; this prop is not |
| Vue / Angular | `v-html`, `[innerHTML]`, `bypassSecurityTrust*` | Mustache text and Angular interpolation are escaped; these are not |

   Django search command: `rg -n "autoescape off|\|\s*safe|mark_safe|format_html" -g "*.html" -g "*.py"`

2. For each sink, write its context using this table:

| Where the value lands | Context |
|---|---|
| Between tags: `<p>{{ v }}</p>` | html_body |
| Inside a quoted attribute: `<input value="{{ v }}">` | html_attr |
| `href`, `src`, `action`, `formaction` | url_attr |
| Inside `<script>`: `var x = '{{ v }}'` | js |
| `style` attribute or `<style>` | css |
| Event handler attribute `onclick="..."` | js_in_attr |
| User-supplied HTML that must render as HTML (rich text) | rich_html |

### Output
Sink table with context.

### Quality Gate
- Every `xss` sink has exactly one context.
- Autoescape state is recorded for every template engine found.

---

## Phase 2: Apply the Encoder for Each Context

### Entry Criteria
- Context table exists.

### Actions
1. Apply exactly the fix for the context:

| Context | Fix | Do NOT |
|---|---|---|
| html_body | remove `\|safe`, `mark_safe`, `Markup(...)`, `template.HTML(...)`, `dangerouslySetInnerHTML`; let autoescape or JSX text do it | write your own `replace("<", "&lt;")` |
| html_attr | keep the value inside double quotes in the template; autoescape escapes quotes | use unquoted attributes `value={{ v }}` |
| url_attr | parse the URL and allow only `http:` and `https:` (plus `mailto:` if needed); otherwise output `#` or drop the link. Python: `urllib.parse.urlsplit(v).scheme in {"http","https"}`; JS: `new URL(v, location.origin).protocol` | trust autoescape here: `javascript:alert(1)` contains no characters it escapes |
| js | do not put values inside script code. Emit data as JSON in a data block and read it: Jinja2 `{{ data\|tojson }}` inside `<script type="application/json" id="d">`; Django `{{ data\|json_script:"d" }}`; Go `html/template` escapes JS context itself; client: `JSON.parse(document.getElementById("d").textContent)` | `'{{ v }}'` inside script, or `JSON.stringify` output placed raw into HTML (a `</script>` in the value ends the block) |
| js_in_attr | move the handler to a script file with `addEventListener`; pass data via `data-*` attribute (html_attr) | encode for both layers by hand |
| css | allowlist the value (for example a color from a fixed list) | insert user text into `style` |
| rich_html | sanitize on output with a maintained sanitizer: browser/Node `DOMPurify.sanitize(html)` (Node needs `jsdom` with `isomorphic-dompurify` or `DOMPurify(new JSDOM("").window)`); Python `nh3.clean(html, tags={...}, attributes={...})`. Record the allowed tags in `kept_html` | use `bleach` in new code (deprecated by its maintainers in 2023); write a regex sanitizer |

2. Client-side DOM sinks: replace `el.innerHTML = v` with `el.textContent = v`; replace `insertAdjacentHTML` with `append(document.createTextNode(v))`.
3. Go: switch the import from `text/template` to `html/template` for any template rendering HTML; remove `template.HTML(userValue)` conversions.
4. Fix one template or component per commit; run its tests after each.

### Output
Encoded sinks.

### Quality Gate
- Rerun the Phase 1 searches; every remaining hit is listed in `kept_html` with a sanitizer call on the same value, or is a constant.
- `rg -n "\"text/template\"" --type go` prints no file that writes to an `http.ResponseWriter`.

---

## Phase 3: Prove It With Payload Tests

### Entry Criteria
- Fixes applied.

### Actions
1. For each fixed sink, render it with these payloads and assert the raw payload is not in the output as markup:

| Context | Payload | Assertion on rendered output |
|---|---|---|
| html_body | `<img src=x onerror=alert(1)>` | contains `&lt;img` and not `<img src=x` |
| html_attr | `" autofocus onfocus=alert(1) x="` | contains `&#34;` or `&quot;`, attribute count unchanged |
| url_attr | `javascript:alert(1)` | `href` is `#` or absent |
| js | `</script><script>alert(1)</script>` | rendered page has exactly one opening `<script` for that block |
| rich_html | `<p>ok</p><script>alert(1)</script><a href="javascript:x">l</a>` | `<p>ok</p>` kept, no `<script`, no `javascript:` |

2. Use the framework's test client (Flask `test_client`, Django `Client`, `httptest` for Go, React Testing Library `render(...).container.innerHTML` for components) and parse with an HTML parser when asserting attribute counts.
3. Run the tests, record the summary.
4. Mutation check: re-add `|safe` (or `dangerouslySetInnerHTML`) on one sink, confirm the test fails, revert.

### Output
`xss_fixes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. Flask app; `sink_map` row `templates/profile.html:14 <a href="{{ user.website }}">{{ user.bio|safe }}</a>`.

Phase 1: two sinks: `website` = url_attr, `bio` = rich_html (product requires bold and links).

Phase 2:
```python
def safe_url(v):
    return v if urlsplit(v).scheme in {"http", "https"} else "#"
app.jinja_env.filters["safe_url"] = safe_url
app.jinja_env.filters["clean_html"] = lambda h: Markup(nh3.clean(h, tags={"b", "i", "a", "p"}, attributes={"a": {"href"}}, url_schemes={"http", "https"}))
```
Template: `<a href="{{ user.website|safe_url }}">{{ user.bio|clean_html }}</a>`.

Phase 3: `5 passed`; with `|safe` restored on `bio`: `1 failed`.

---

## Exit Criteria

DONE when every XSS sink has a recorded context and the matching encoder, user HTML passes through a named sanitizer with recorded allowed tags, and payload tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Template engine not in the table | **Adjust**: read its documentation for autoescape default and bypass syntax; record both before fixing. |
| Phase 2 | Product requires user HTML but no sanitizer allowed-tag list exists | **Return**: ask the owner for the tag and attribute list; do not pick one. |
| Phase 2 | Value double-escaped after fix (`&amp;lt;`) | **Adjust**: find where it was escaped before storage and remove that; store raw, encode on output. |
| Phase 3 | Test passes with the mutation | **Stop**: the test renders a different template or component. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
