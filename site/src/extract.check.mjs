// Known-answer check, run by `npm run build`. It runs the browser extractor over every
// committed fixture and compares with what run.py itself produced (fixtures/expected.json and
// expected_paper_info.csv, written by fixtures/make_expected.py). Any drift fails the build.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DOMParser } from 'linkedom';
import { extract, toCsv, fillRates, ruleLines, pyRepr } from './extract.js';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const expected = JSON.parse(read('fixtures/expected.json'));
const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

const rows = Object.entries(expected).map(([name, want]) => {
  const got = extract(parse(read(`fixtures/${name}`)));
  assert.deepEqual(got, want, `extractor drifted from run.py on ${name}`);
  return got;
});
assert.equal(toCsv(rows), read('fixtures/expected_paper_info.csv'), 'CSV drifted from pandas to_csv');

// pyRepr spot checks against values Python's repr() gives.
assert.equal(pyRepr("it's"), `"it's"`);
assert.equal(pyRepr(`a'b"c`), `'a\\'b"c'`);
assert.equal(pyRepr('tab\there'), "'tab\\there'");

// Fill rates recomputed by hand from expected.json.
const fr = fillRates(rows);
for (const k of Object.keys(fr)) assert.equal(fr[k], rows.filter((r) => r[k].length).length / rows.length);

const lines = ruleLines(read('run.py'));
for (const [k, v] of Object.entries(lines)) assert.ok(v > 0, `could not locate ${k} in run.py`);

console.log(`extract.check: ${rows.length} fixtures match run.py; CSV matches pandas; fill`, Object.entries(fr).map(([k, v]) => `${k} ${v * 100}%`).join(', '), `; run.py rules at lines ${lines.website}/${lines.DOI}/${lines.title}/${lines.author}`);
