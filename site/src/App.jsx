import { useMemo, useState, useEffect, useId } from 'react';
import runPy from '../../run.py?raw';
import readme from '../../README.md?raw';
import testPy from '../../tests/test_extract.py?raw';
import expected from '../../fixtures/expected.json';
import { extract, ignoredTags, toCsv, fillRates, ruleLines, pyRepr, cell, RULES, COLUMNS } from './extract.js';

const REPO = 'https://github.com/JesunAhmadUshno/ThesisFinder---Find-your-thesis-paper-website-information';
const blob = (p) => `${REPO}/blob/main/${p}`;
const pct = (x) => `${Math.round(x * 100)}%`;

// Fixtures are imported raw at build time, in the order run.py's known answers list them.
const rawFixtures = import.meta.glob('../../fixtures/*.html', { query: '?raw', import: 'default', eager: true });
const FIXTURES = Object.keys(expected).map((name) => ({ name, html: rawFixtures[`../../fixtures/${name}`] }));

const LINES = ruleLines(runPy);
const SRC = runPy.split(/\r?\n/);
const nTests = (testPy.match(/^def test_/gm) || []).length;
// Requirements as the README lists them ("2. pandas library (pip install pandas)" -> "pandas").
const REQS = (readme.split(/^# Requirements/m)[1] || '').split(/^#/m)[0].split('\n')
  .map((l) => l.match(/^\d+\.\s+(.+?)(?:\s+library)?(?:\s+\(.*\))?\s*$/)).filter(Boolean).map((m) => m[1]);

const parse = (html) => new DOMParser().parseFromString(html, 'text/html'); // parsed, never injected: scripts do not run
const pyDict = (r) => `{${COLUMNS.map((k) => `${pyRepr(k)}: ${Array.isArray(r[k]) ? cell(r[k]) : pyRepr(r[k])}`).join(', ')}}`;

const SECTIONS = [['top', 'Overview', '◎'], ['pipeline', 'Pipeline', '⇢'], ['play', 'Playground', '▶'], ['rules', 'Rules', '✓'], ['batch', 'Batch', '▦'], ['caveats', 'Caveats', '!']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">ThesisFinder</a>
      <a className="m" href={blob('run.py')}>run.py</a>
      <a className="m" href={blob('tests/test_extract.py')}>Tests</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <span className="spacer" />
      <span className="status"><i /> {nTests} offline tests</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

export default function App() {
  useReveal();
  const [html, setHtml] = useState(FIXTURES[0].html);
  const [source, setSource] = useState(FIXTURES[0].name);
  const doc = useMemo(() => parse(html), [html]);
  const row = useMemo(() => extract(doc), [doc]);
  const ignored = useMemo(() => ignoredTags(doc), [doc]);
  const page = { html, source, setHtml, setSource, row, ignored };
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Pipeline />
      <Playground {...page} />
      <Rules row={row} ignored={ignored} />
      <Batch current={page} />
      <Caveats />
      <Dock />
      <footer>
        Every number on this page is computed at build time or in your browser from <code>run.py</code>, <code>README.md</code> and <code>fixtures/</code>.
        The sample pages are synthetic, written for this repo; nothing here is a recorded scrape of a real site.
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <header className="card hero window" id="top" data-title="ThesisFinder.app">
      <div className="head">
        <p className="eyebrow">Paper metadata scraper · Python script</p>
        <span className="pill warn">● single script · {nTests} offline tests · no recorded runs</span>
      </div>
      <h1>ThesisFinder turns a list of paper URLs into a <em>tidy</em> metadata table, reading the title, DOI and authors from each page's HTML tags.</h1>
      <p className="sub">
        <code>run.py</code> reads a CSV of URLs, fetches each page, applies four BeautifulSoup rules and writes <code>paper_info.csv</code>.
        Below, the same four rules run in your browser on sample pages or HTML you paste, so you can see exactly what the script would keep and what it would miss.
      </p>
      <div className="chips" aria-label="Requirements listed in the README">
        {REQS.map((r) => <span key={r} className="pill info">{r}</span>)}
      </div>
      <div className="actions">
        <a className="btn primary" href="#play">Try the extractor</a>
        <a className="btn ghost" href={blob('run.py')}>Read run.py</a>
        <span className="hint">Run the tests with <code>python tests/test_extract.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{LINES.total}</div><div className="cap">lines in run.py, the whole tool</div></div>
        <div className="tile"><div className="num">{RULES.length}</div><div className="cap">extraction rules, one per output column</div></div>
        <div className="tile"><div className="num">{FIXTURES.length}</div><div className="cap">synthetic test pages with known answers</div></div>
        <div className="tile"><div className="num">{LINES.timeout}s</div><div className="cap">request timeout, so one dead URL cannot stall the batch</div></div>
      </div>
    </header>
  );
}

const NODES = [
  { k: 'read', t: 'paper.csv', d: `pd.read_csv · line ${LINES.read}` },
  { k: 'fetch', t: 'requests.get', d: `timeout ${LINES.timeout}s · line ${LINES.fetch}` },
  { k: 'parse', t: 'BeautifulSoup', d: `html.parser · line ${LINES.parse}` },
  { k: 'website', t: `${RULES.length} rules`, d: `lines ${LINES.website} to ${LINES.author}` },
  { k: 'frame', t: 'pd.DataFrame', d: `one row per URL · line ${LINES.frame}` },
  { k: 'write', t: 'paper_info.csv', d: `to_csv · line ${LINES.write}` },
];

function useNarrow(q = '(max-width: 560px)') {
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => { const mq = matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}

function Pipeline() {
  const [sel, setSel] = useState('website');
  const narrow = useNarrow();
  const bw = 190, bh = 74;
  // Wide: snake layout, top row left to right, bottom row right to left. Narrow: one column.
  const W = narrow ? 230 : 660, H = narrow ? 6 * 100 - 12 : 270;
  const pos = narrow ? (i) => ({ x: 20, y: 6 + i * 100 }) : (i) => (i < 3 ? { x: 10 + i * 230, y: 14 } : { x: 10 + (5 - i) * 230, y: 176 });
  const lineOf = (k) => (k === 'website' ? [LINES.website, LINES.DOI, LINES.title, LINES.author] : [LINES[k]]);
  return (
    <section id="pipeline" className="card window reveal" data-title="run.py — pipeline">
      <p className="eyebrow">How it works</p>
      <h2>Six steps from a list of links to a spreadsheet.</h2>
      <p className="sub">Each box is labelled with the line of <code>run.py</code> it comes from, found in the source when this page was built. Select a box to read that line.</p>
      <svg className={`chart pipe${narrow ? ' narrow' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="run.py pipeline: paper.csv, requests.get, BeautifulSoup, four rules, DataFrame, paper_info.csv" style={{ marginTop: 16 }}>
        <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)" /></marker></defs>
        {NODES.slice(0, -1).map((n, i) => {
          const a = pos(i), b = pos(i + 1);
          if (narrow || i === 2) return <path key={n.k} d={`M${a.x + bw / 2} ${a.y + bh} V${b.y - 4}`} stroke="var(--muted)" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />;
          const y = a.y + bh / 2, x1 = i < 2 ? a.x + bw : a.x, x2 = i < 2 ? b.x : b.x + bw;
          return <line key={n.k} x1={x1 + (i < 2 ? 4 : -4)} x2={x2 + (i < 2 ? -6 : 6)} y1={y} y2={y} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arr)" />;
        })}
        {NODES.map((n, i) => {
          const p = pos(i), on = sel === n.k;
          return (
            <g key={n.k} className="node" tabIndex={0} role="button" aria-pressed={on} aria-label={`${n.t}, ${n.d}`} onClick={() => setSel(n.k)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(n.k))}>
              <rect x={p.x} y={p.y} width={bw} height={bh} rx="12" fill={on ? 'var(--primary-pale)' : 'var(--surface-strong)'} stroke={on ? 'var(--primary)' : 'var(--border)'} strokeWidth={on ? 2 : 1} />
              <text x={p.x + 16} y={p.y + 32} className="t">{n.t}</text>
              <text x={p.x + 16} y={p.y + 55}>{n.d}</text>
            </g>
          );
        })}
      </svg>
      <pre className="src" aria-live="polite">{lineOf(sel).map((l) => `${String(l).padStart(3)}  ${SRC[l - 1].trim()}`).join('\n')}</pre>
    </section>
  );
}

function Playground({ html, source, setHtml, setSource, row, ignored }) {
  const ids = { pick: useId(), text: useId() };
  const missed = ignored.citation_doi.length + ignored.citation_author.length > 0;
  return (
    <section id="play" className="card window reveal" data-title="extract_from_html — live">
      <div className="head">
        <div>
          <p className="eyebrow">Live playground</p>
          <h2>Paste a page, get the row the script would write.</h2>
          <p className="sub">
            A JavaScript port of <code>extract_from_html</code> parses the HTML with your browser's DOMParser and applies the same four rules, with the same keys and empty fallbacks.
            The build fails if it disagrees with Python on any sample page. It cannot fetch a URL for you: browsers block cross-site reads (CORS), so open the paper, view source, and paste.
          </p>
        </div>
        <span className="pill info">runs in your browser</span>
      </div>
      <div className="controls" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="field">
          <label htmlFor={ids.pick}>Sample page <span>synthetic, written for this repo</span></label>
          <select id={ids.pick} value={source} onChange={(e) => { const f = FIXTURES.find((x) => x.name === e.target.value); setSource(e.target.value); if (f) setHtml(f.html); }}>
            {FIXTURES.map((f) => <option key={f.name} value={f.name}>fixtures/{f.name}</option>)}
            <option value="custom">Your own HTML (edit below)</option>
          </select>
        </div>
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor={ids.text}>Page HTML <span>{html.length.toLocaleString('en-US')} chars</span></label>
          <textarea id={ids.text} spellCheck="false" value={html} onChange={(e) => { setHtml(e.target.value); setSource('custom'); }} />
        </div>
        <div>
          <h3>extract_from_html(html) returns</h3>
          <pre className="out">{pyDict(row)}</pre>
          <h3 style={{ marginTop: 14 }}>Row in paper_info.csv</h3>
          <pre className="out">{toCsv([row]).split('\n')[1]}</pre>
          {missed && (
            <p className="hint warnbox">
              This page also carries {ignored.citation_doi.length ? <>citation_doi <b>{ignored.citation_doi[0]}</b></> : null}
              {ignored.citation_doi.length && ignored.citation_author.length ? ' and ' : ''}
              {ignored.citation_author.length ? <>{ignored.citation_author.length} citation_author tag{ignored.citation_author.length > 1 ? 's' : ''}</> : null}, which run.py does not read.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Rules({ row, ignored }) {
  return (
    <section id="rules" className="card window reveal" data-title="selectors — as shipped">
      <p className="eyebrow">Rules inspector</p>
      <h2>Four selectors, lit up for the page in the playground.</h2>
      <p className="sub">Each rule is the exact BeautifulSoup call in <code>run.py</code>. A miss means the column comes back empty for this page.</p>
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table>
          <thead><tr><th>Column</th><th>Selector</th><th>Line</th><th>This page</th><th>What it misses</th></tr></thead>
          <tbody>
            {RULES.map((r) => {
              const hit = row[r.key].length > 0;
              return (
                <tr key={r.key}>
                  <td className="mono">{r.key}</td>
                  <td className="mono">{r.selector}</td>
                  <td><a href={`${blob('run.py')}#L${LINES[r.key]}`}>L{LINES[r.key]}</a></td>
                  <td><span className={`pill ${hit ? 'good' : 'bad'}`}>{hit ? (r.key === 'author' ? `hit · ${row.author.length}` : 'hit') : 'miss'}</span></td>
                  <td className="hint" style={{ minWidth: 220 }}>{r.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Standard tags on this page that no rule reads: citation_doi {ignored.citation_doi.length}, citation_author {ignored.citation_author.length}.
      </p>
    </section>
  );
}

function Batch({ current }) {
  const [picked, setPicked] = useState(() => FIXTURES.map((f) => f.name));
  const [extra, setExtra] = useState([]);
  const rows = useMemo(() => [
    ...FIXTURES.filter((f) => picked.includes(f.name)).map((f) => ({ src: f.name, ...extract(parse(f.html)) })),
    ...extra,
  ], [picked, extra]);
  const fr = fillRates(rows);
  const csv = toCsv(rows);
  const toggle = (n) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  const download = () => {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'paper_info.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section id="batch" className="card window reveal" data-title="paper.csv → paper_info.csv">
      <div className="head">
        <div>
          <p className="eyebrow">Batch run</p>
          <h2>Run the whole list and see which columns come back empty.</h2>
          <p className="sub">
            Pick sample pages, or add the page from the playground, and the extractor runs over each one like the loop in <code>run_batch</code>.
            The CSV is built the way pandas writes it, with the author list printed as a Python list. With all {FIXTURES.length} samples it matches <code>fixtures/expected_paper_info.csv</code> byte for byte; the build checks that.
          </p>
        </div>
        <span className="pill info">{rows.length} row{rows.length === 1 ? '' : 's'}</span>
      </div>
      <fieldset className="picks">
        <legend className="hint">Rows to include</legend>
        {FIXTURES.map((f) => (
          <label key={f.name} className="pick"><input type="checkbox" checked={picked.includes(f.name)} onChange={() => toggle(f.name)} /> {f.name}</label>
        ))}
      </fieldset>
      <div className="actions" style={{ marginTop: 12, marginBottom: 16 }}>
        <button className="btn ghost" onClick={() => setExtra((e) => [...e, { src: `pasted page ${e.length + 1}`, ...current.row }])}>Add playground page</button>
        {extra.length > 0 && <button className="btn ghost" onClick={() => setExtra([])}>Clear added pages</button>}
        <button className="btn primary" onClick={download} disabled={!rows.length}>Download paper_info.csv</button>
      </div>
      <div className="grid2">
        <div>
          <h3>Fill rate per column</h3>
          <div className="bars" style={{ marginTop: 12 }}>
            {COLUMNS.map((k) => (
              <div className="bar-row" key={k}>
                <div className="lab"><span className="mono">{k}</span><b>{rows.length ? pct(fr[k]) : 'n/a'}</b></div>
                <div className="track"><div className="fill" style={{ width: `${fr[k] * 100}%`, background: fr[k] >= 0.8 ? 'var(--good)' : fr[k] >= 0.5 ? 'var(--warn)' : 'var(--bad)' }} /></div>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>Share of rows where the column is non-empty. The samples were written to show misses, so these rates say nothing about real publisher pages.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Page</th><th>DOI</th><th>title</th><th>authors</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.src}-${i}`}>
                  <td className="mono">{r.src}</td>
                  <td className={r.DOI ? 'ok' : 'no'}>{r.DOI ? '✓' : '–'}</td>
                  <td className={r.title ? 'ok' : 'no'}>{r.title ? '✓' : '–'}</td>
                  <td className={r.author.length ? 'ok' : 'no'}>{r.author.length || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <h3 style={{ marginTop: 20 }}>paper_info.csv preview</h3>
      <pre className="out">{csv}</pre>
    </section>
  );
}

function Caveats() {
  const start = SRC.findIndex((l) => l.startsWith('def extract_from_html'));
  const end = SRC.findIndex((l, i) => i > start && l.includes('return paper_info'));
  const gaps = [
    ['Narrow coverage, unmeasured', 'The DOI rule reads only name="DOI" and the author rule only one site-specific class, so common citation_doi and citation_author tags are ignored. No hit rate on real pages has been measured.'],
    ['Docs used to disagree with the code', 'The README named Extract.py and the keys doi/authors; the script is run.py and writes DOI/author. The README is now corrected.'],
    ['Thin error handling', `A failed request now gives an empty row after ${LINES.timeout}s, but HTTP error pages (404, paywalls) are still parsed as if they were the paper, and there is no retry or rate limit.`],
    ['Browser port is a port', 'DOMParser and BeautifulSoup\'s html.parser can build different trees from badly broken HTML. The build checks agreement only on the committed sample pages.'],
  ];
  return (
    <section id="caveats" className="card window reveal" data-title="README.md — source and caveats">
      <p className="eyebrow">Source and limitations</p>
      <h2>What the script does, line for line, and where it falls short.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h3>run.py, lines {start + 1} to {end + 1}</h3>
          <pre className="src tall">{SRC.slice(start, end + 1).join('\n')}</pre>
        </div>
        <div className="bars">
          {gaps.map(([t, d]) => (
            <div className="tile" key={t}><h3>{t}</h3><p className="hint" style={{ margin: '6px 0 0', fontSize: 13 }}>{d}</p></div>
          ))}
        </div>
      </div>
      <div className="docs" style={{ marginTop: 20 }}>
        <a href={blob('run.py')}><b>run.py</b><small>The whole tool</small></a>
        <a href={blob('tests/test_extract.py')}><b>Tests</b><small>{nTests} offline tests, no network</small></a>
        <a href={blob('docs/research-review.md')}><b>Research review</b><small>Graded gaps and what each needs</small></a>
      </div>
    </section>
  );
}
