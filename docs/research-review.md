# Research and engineering review

Reviewed on branch `site/live-dashboard`, November 2026. ThesisFinder is a product-style tool (one Python script), not a study, so it is graded on a PhD-style rubric adapted for engineering rigor. Grades: A (publishable/production), B (solid, minor gaps), C (works, real gaps), D (idea only, unverified), F (missing).

## Overall

| | Before this branch | After this branch |
|---|---|---|
| Overall grade | D | C |

Before: a clear purpose and a plausible implementation, but no tests, no sample data, no evaluation, a script that could not be imported, and a README that disagreed with the code. After: the parsing logic is importable and covered by offline tests with known answers, the docs match the code, and a failed request no longer aborts a batch. What keeps it at C is that nobody has measured how well the four rules work on real publisher pages.

## Rubric

| Criterion | Grade | Evidence | Fixed now | Remaining gap and what it needs |
|---|---|---|---|---|
| Question / purpose | B | README: turn a CSV of paper URLs into a table of title, DOI, authors. | README rewritten to say exactly what each column holds. | Name the target sites. Needs a decision from the owner on which publishers matter. |
| Hypotheses / design claims | D | Implicit claim: four tag rules recover metadata from paper pages. Never stated or tested. | Each rule's reach and blind spot is documented (README, dashboard rules inspector). | State a target, e.g. "DOI found on at least 90% of pages from publishers X, Y, Z". Needs the evaluation set below. |
| Method | C | `run.py`: requests + BeautifulSoup `html.parser`, four `find`/`find_all` rules, pandas to CSV. | Parsing split into `extract_from_html`, so method and fetch can be checked separately. | The DOI rule reads only `name="DOI"` and authors only one site-specific class; standard `citation_doi` and `citation_author` are ignored. Adding them changes outputs, so it waits for the owner's call; the fixtures `citation-tags.html` and `no-authors.html` already show the before state. |
| Baselines | F | None. | None (needs data). | Compare against a standard reader of Highwire/Dublin Core meta tags and against Crossref lookups by DOI. Needs the evaluation set plus free Crossref REST API calls (no key, polite rate limit). |
| Evaluation / statistics / uncertainty | F | No measured hit rate anywhere. The dashboard's fill rates are over 5 synthetic pages written to show misses, and it says they describe nothing real. | None (needs data). | A labelled set of about 100 to 200 real landing pages across publishers, saved HTML plus hand-checked title/DOI/authors, then per-field precision and recall with Wilson 95% intervals. A few hours of manual labelling, no compute cost. |
| Reproducibility | C | Before: no sample input, no pinned versions, results depend on live websites. | `requirements.txt` with tested pins; synthetic `fixtures/` with `expected.json` and `expected_paper_info.csv` written by the script's own code (`fixtures/make_expected.py`); CI runs the tests. | Live pages change, so any real evaluation must store the fetched HTML with a fetch date and hash. Needs storage for the saved pages (a few MB). |
| Testing / verification | C | Before: none, and `run.py` could not be imported (it read `paper.csv` at import time). | `tests/test_extract.py`: 5 offline tests (known answers per fixture, rule behaviour, empty page, failed URL, byte-exact CSV via pandas). The dashboard's JS port is checked against the same known answers on every build. | No test of real-site HTML; covered by the evaluation set above. |
| Robustness | C | Before: no timeout, no error handling; one dead URL stopped the batch. | `timeout=15` and `RequestException` gives an empty row. | HTTP error pages (404, paywall, bot checks) are still parsed as if they were the paper; no retry, no rate limit, no User-Agent. Needs a small change plus a decision on how errors should appear in the output (owner). |
| Threats to validity | D | Not discussed. | Listed here and on the dashboard: synthetic fixtures, site-specific author class, DOMParser vs `html.parser` tree differences on broken HTML. | Selection bias of any evaluation set (which publishers), and pages that render metadata with JavaScript (requests sees none of it). Needs the evaluation set to quantify; JavaScript pages would need a headless browser. |
| Related work | F | None cited. | None. | Position against existing tools: Zotero translators, Crossref/DataCite APIs, GROBID for PDFs, Google Scholar's Highwire meta tag guidance. Desk research only. |
| Limitations | C | Not stated before. | README and dashboard state CORS (no browser fetch), the case-sensitive DOI rule, raw author text, the curses/Windows caveat. | None beyond the gaps above. |
| Hygiene / licence | D | Scattered imports, curses at import, unpinned deps, no licence. | Imports tidied, curses imported only when animating, banner made a raw string (no escape warning), `.gitignore` added. | No LICENSE file. Needs the owner to choose a licence; nothing else is required. |

## What the dashboard shows and does not show

Every number on the dashboard comes from `run.py`, `README.md`, `tests/` or `fixtures/` at build time, or is computed in the browser from the page being inspected. There are no recorded runs against real websites in this repo, so the dashboard shows none. The fixture pages use fake titles, fake names and `10.0000/example.*` DOIs.
