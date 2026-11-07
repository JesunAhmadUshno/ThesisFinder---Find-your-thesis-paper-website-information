// A JavaScript port of run.py's extract_from_html plus the pandas to_csv step.
// It takes a parsed Document (the browser's DOMParser, or linkedom in the build check)
// and applies the same four rules with the same key names and empty fallbacks.
// extract.check.mjs compares it against fixtures/expected.json, written by run.py itself.

// Characters Python's str.strip() removes (str.isspace), which differ slightly from JS trim().
const PY_WS = '\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const STRIP = new RegExp(`^[${PY_WS}]+|[${PY_WS}]+$`, 'g');
export const pyStrip = (s) => s.replace(STRIP, '');

// soup.find('meta', {'name': X}): first <meta> whose name attribute equals X exactly (case-sensitive).
const findMeta = (doc, name) => [...doc.querySelectorAll('meta')].find((m) => m.getAttribute('name') === name);

export const RULES = [
  { key: 'website', selector: '<title>', py: "soup.find('title')", note: 'Text of the first <title>, stripped. This is the page title, not the site name.' },
  { key: 'DOI', selector: 'meta[name="DOI"]', py: "soup.find('meta', {'name': 'DOI'})", note: 'Exact, case-sensitive match on name="DOI". Misses the common citation_doi, doi and dc.identifier tags.' },
  { key: 'title', selector: 'meta[name="citation_title"]', py: "soup.find('meta', {'name': 'citation_title'})", note: 'The standard Highwire/Google Scholar tag, so most publisher pages carry it.' },
  { key: 'author', selector: 'span.authors-affiliations__name', py: "soup.find_all('span', {'class': 'authors-affiliations__name'})", note: 'One site-specific class. Text is kept raw (no strip). Ignores the standard citation_author tags.' },
];

export function extract(doc) {
  const title = doc.querySelector('title');
  const doi = findMeta(doc, 'DOI');
  const ct = findMeta(doc, 'citation_title');
  return {
    website: title ? pyStrip(title.textContent) : '',
    DOI: doi && doi.hasAttribute('content') ? doi.getAttribute('content') : '',
    title: ct && ct.hasAttribute('content') ? ct.getAttribute('content') : '',
    author: [...doc.querySelectorAll('span.authors-affiliations__name')].map((a) => a.textContent),
  };
}

// Standard tags the script does not read, reported so the page can say what was missed.
export function ignoredTags(doc) {
  const metas = (n) => [...doc.querySelectorAll('meta')].filter((m) => m.getAttribute('name') === n && m.getAttribute('content')).map((m) => m.getAttribute('content'));
  return { citation_doi: metas('citation_doi'), citation_author: metas('citation_author') };
}

// Python repr() of a str, as pandas writes it when a list lands in a CSV cell.
// ponytail: escapes ASCII controls and the common invisible Unicode spaces; other non-printables
// (str.isprintable() is False for many rare code points) would print raw. Extend the class if a page needs it.
const NP = [[0x00, 0x1f], [0x7f, 0xa0], [0xad, 0xad], [0x1680, 0x1680], [0x180e, 0x180e], [0x2000, 0x200f], [0x2028, 0x202f], [0x205f, 0x206f], [0x3000, 0x3000], [0xfeff, 0xfeff]];
const hex = (a) => '\\' + 'u' + a.toString(16).padStart(4, '0');
const NONPRINT = new RegExp(`[${NP.map(([a, b]) => hex(a) + '-' + hex(b)).join('')}]`, 'g');
export function pyRepr(s) {
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  const body = s.replace(/\\/g, '\\\\').replace(NONPRINT, (c) => {
    if (c === '\n') return '\\n';
    if (c === '\r') return '\\r';
    if (c === '\t') return '\\t';
    const n = c.charCodeAt(0);
    return n < 0x100 ? `\\x${n.toString(16).padStart(2, '0')}` : `\\u${n.toString(16).padStart(4, '0')}`;
  });
  return q + (q === "'" ? body.replace(/'/g, "\\'") : body) + q;
}

export const cell = (v) => (Array.isArray(v) ? `[${v.map(pyRepr).join(', ')}]` : v);

// Python csv QUOTE_MINIMAL, as used by DataFrame.to_csv: quote fields with a comma, quote or line break.
const csvField = (s) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export const COLUMNS = ['website', 'DOI', 'title', 'author'];
export function toCsv(rows) {
  return [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((k) => csvField(cell(r[k]))).join(','))].join('\n') + '\n';
}

// Share of rows where each column came back non-empty.
export function fillRates(rows) {
  return Object.fromEntries(COLUMNS.map((k) => [k, rows.length ? rows.filter((r) => r[k].length > 0).length / rows.length : 0]));
}

// Line numbers (1-based) of each rule in run.py, found in the source text rather than typed.
export function ruleLines(src) {
  const lines = src.split(/\r?\n/);
  const at = (needle) => lines.findIndex((l) => l.includes(needle)) + 1;
  return {
    total: lines[lines.length - 1] === '' ? lines.length - 1 : lines.length,
    fetch: at('requests.get('),
    parse: at("BeautifulSoup(html, 'html.parser')"),
    website: at("soup.find('title')"),
    DOI: at("{'name': 'DOI'}"),
    title: at("{'name': 'citation_title'}"),
    author: at('authors-affiliations__name'),
    read: at('pd.read_csv('),
    frame: at('pd.DataFrame('),
    write: at('.to_csv('),
    timeout: +(src.match(/timeout=(\d+)/) || [])[1] || null,
  };
}
