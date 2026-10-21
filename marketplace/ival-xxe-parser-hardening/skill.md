# XXE and Entity Expansion Hardening for XML Parsers

**One-line description:** Finds every XML parser that reads untrusted data (including SVG, SAML, DOCX/XLSX, SOAP and RSS inputs) and configures it to refuse DTDs, external entities and entity expansion with the exact setting for each library (Python `defusedxml` and lxml `XMLParser` flags, Java `disallow-doctype-decl`, .NET `DtdProcessing.Prohibit`, Node libxmljs options, PHP flags), then proves it with external-entity and billion-laughs payloads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node`, `go`, `java`, `dotnet` or `php`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `xxe`.

---

## Outputs

- `xxe_fixes` (object): `parsers` (file, line, library, setting applied), `test_file`, `test_run`.

---

## Phase 1: Inventory Parsers and Hidden XML Inputs

### Entry Criteria
- `sink_map` exists (a zero `xxe` count still requires step 2).

### Actions
1. List direct parser calls from `sink_map` `xxe` rows. For `java`, `dotnet` and `php`, also run:
   - java: `rg -n "DocumentBuilderFactory|SAXParserFactory|XMLInputFactory|TransformerFactory|SchemaFactory|SAXReader|SAXBuilder|XMLReader|Unmarshaller" --type java`
   - dotnet: `rg -n "XmlDocument|XmlReader|XmlTextReader|XPathDocument|XDocument|DataSet\.ReadXml" --type cs`
   - php: `rg -n "simplexml_load|DOMDocument|XMLReader|LIBXML_NOENT|LIBXML_DTDLOAD" --type php`
2. Find XML hidden in other formats; each library below parses XML internally. Run all five:

```
rg -in "svg" <upload handler files>                                         # SVG upload
rg -n "openpyxl|python-docx|docx|xlsx|exceljs|apache\.poi|excelize" <src>   # DOCX / XLSX / PPTX
rg -in "saml" <src>                                                         # SAML
rg -in "soap|wsdl|zeep|suds" <src>                                          # SOAP / WSDL
rg -in "feedparser|rss-parser|gofeed" <src>                                 # RSS / Atom
```

3. Record library and version for each (`pip show lxml`, `npm ls libxmljs2`, `mvn dependency:tree`, `dotnet list package`).

### Output
Parser inventory.

### Quality Gate
- Every search in steps 1 and 2 for the stack has a recorded hit count.
- Every parser row names library and version.

---

## Phase 2: Apply the Safe Setting per Library

### Entry Criteria
- Inventory exists.

### Actions
1. Apply exactly one row per parser:

| Library | Safe configuration |
|---|---|
| Python stdlib `xml.etree`, `xml.dom.minidom`, `xml.sax` | replace imports with `defusedxml` equivalents: `import defusedxml.ElementTree as ET`; `ET.fromstring(data)`. defusedxml raises `EntitiesForbidden`, `DTDForbidden` (when `forbid_dtd=True`), `ExternalReferenceForbidden`. |
| lxml | `parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False, dtd_validation=False, huge_tree=False)`; `etree.fromstring(data, parser)`. Never call `etree.fromstring(data)` without the parser argument. |
| xmltodict | `xmltodict.parse(data, disable_entities=True)` (the default is `True` in current versions; set it explicitly) |
| Node `libxmljs2` | `parseXml(data, { noent: false, nonet: true, dtdload: false })`; `noent: true` turns entity substitution on, which is the vulnerability |
| Node `fast-xml-parser`, `xml2js` | do not resolve external entities; set `processEntities: false` in fast-xml-parser if entity text is not needed |
| Go `encoding/xml` | does not resolve external entities or DTDs; no change. Bound input size with `io.LimitReader`. |
| Java `DocumentBuilderFactory` | `dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); dbf.setXIncludeAware(false); dbf.setExpandEntityReferences(false);` |
| Java `SAXParserFactory` | `spf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);` |
| Java `XMLInputFactory` (StAX) | `xif.setProperty(XMLInputFactory.SUPPORT_DTD, false); xif.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);` |
| Java `TransformerFactory` / `SchemaFactory` | `setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, ""); setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "")` (or `ACCESS_EXTERNAL_SCHEMA` for SchemaFactory) |
| .NET `XmlReader` | `new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null }` |
| .NET `XmlDocument` | `doc.XmlResolver = null` before `Load`; prefer loading through the safe `XmlReader` above |
| PHP | never pass `LIBXML_NOENT` or `LIBXML_DTDLOAD`; libxml2 2.9 and later does not load external entities by default |

2. Create the parser in one factory function per stack and import it everywhere; do not configure at each call site.
3. Cap input size before parsing with the request body cap already set by the schema flow.
4. SVG uploads: also apply `ival-file-upload-validation` (SVG can carry script); the parser fix does not make SVG safe to serve inline.

### Output
Hardened parsers.

### Quality Gate
- `rg -n "import xml\.etree|from xml\.etree|from xml\.dom|import xml\.sax" --type py` prints nothing outside `defusedxml` usage (Python).
- `rg -n "noent:\s*true|LIBXML_NOENT|resolve_entities=True" <src>` prints nothing.
- Every Java and .NET parser construction is inside the factory (call-site count matches inventory).

---

## Phase 3: Payload Tests

### Entry Criteria
- Parsers hardened.

### Actions
1. External entity (local file) payload; assert the parse raises or the result does not contain the file text:

```xml
<?xml version="1.0"?>
<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/hostname">]>
<r>&x;</r>
```
   Use a temp file you create with known content (for example `IVAL_MARKER_7`) instead of `/etc/hostname` so the assertion is exact and portable.
2. Network entity payload: `<!ENTITY x SYSTEM "http://127.0.0.1:<port>/">` with a local listener; assert zero requests reach it.
3. Billion laughs payload (nested entity expansion, 10 levels of 10 references); assert the parser raises within the test framework's timeout and memory does not grow without bound.
4. Run for each parser entry point (including the SVG and DOCX paths), record summary.
5. Mutation check: remove one setting (for example `resolve_entities=False`), rerun, confirm the marker appears, revert.

### Output
`xxe_fixes`.

### Quality Gate
- Test summary shows 0 failed; the marker string never appears in parsed output; the listener count is 0.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `python`. `app/import.py:12` used `lxml.etree.fromstring(request.data)`; Phase 1 step 2 also found `openpyxl` reading uploaded XLSX.

Phase 2: `app/xmlsafe.py` exports `parse(data)` using the lxml parser row. openpyxl: its documentation states it uses defusedxml when installed; `pip install defusedxml` and confirm `python -c "import openpyxl.xml; print(openpyxl.xml.DEFUSEDXML)"` prints `True`.

Phase 3:
```
$ python -m pytest tests/test_xxe.py -q
.....                                                      [100%]
5 passed in 0.44s
```
Mutation (`resolve_entities=True`): `FAILED test_external_entity_not_resolved - AssertionError: 'IVAL_MARKER_7' in result`.

---

## Exit Criteria

DONE when every XML parser on untrusted input, including those inside SVG, office, SAML, SOAP and feed libraries, uses the library's safe setting from one factory, and the file, network and expansion payload tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Third-party library parses XML and exposes no parser settings | **Return**: report the library and version; check its security advisories and docs for a safe mode; owner decides whether to replace it. |
| Phase 2 | Business documents legitimately contain a DOCTYPE | **Adjust**: keep DTD parsing off and strip or reject the DOCTYPE; if internal entities are required, use defusedxml with `forbid_dtd=False` (still forbids external and expanding entities). |
| Phase 3 | Billion laughs test hangs the runner | **Adjust**: run it in a subprocess with a timeout; a hang counts as a failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
