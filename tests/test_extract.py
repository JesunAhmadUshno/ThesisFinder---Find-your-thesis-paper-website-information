"""Offline tests for run.py: no network, no curses.

Runs with pytest or plain python (python tests/test_extract.py).
The CSV test needs pandas and is skipped without it.
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = os.path.join(ROOT, 'fixtures')
sys.path.insert(0, ROOT)
import run  # noqa: E402


def read(name):
    with open(os.path.join(FIX, name), 'rb') as f:
        return f.read()


def expected():
    with open(os.path.join(FIX, 'expected.json'), encoding='utf-8') as f:
        return json.load(f)


def test_fixtures_match_known_answers():
    for name, want in expected().items():
        assert run.extract_from_html(read(name)) == want, name


def test_rules_behave_as_documented():
    full = run.extract_from_html(read('full.html'))
    assert full['website'] == 'Example Journal of Placeholder Studies | Article'  # <title> text, stripped
    assert full['author'][2] == ' Cy Placeholder '  # author text is kept raw, not stripped
    cit = run.extract_from_html(read('citation-tags.html'))
    assert cit['DOI'] == '' and cit['author'] == []  # citation_doi / citation_author are not read
    assert run.extract_from_html(read('bare.html'))['DOI'] == ''  # DOI tag without content


def test_empty_page_gives_empty_row():
    assert run.extract_from_html('') == {'website': '', 'DOI': '', 'title': '', 'author': []}


def test_batch_csv_matches_known_answer():
    try:
        import pandas  # noqa: F401
    except ImportError:
        print('skip: pandas not installed')
        return
    original = run.extract_paper_info
    run.extract_paper_info = lambda url: run.extract_from_html(read(url.rsplit('/', 1)[-1] + '.html'))
    try:
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, 'paper_info.csv')
            run.run_batch(os.path.join(FIX, 'paper.csv'), out)
            with open(out, encoding='utf-8') as f, open(os.path.join(FIX, 'expected_paper_info.csv'), encoding='utf-8') as g:
                assert f.read() == g.read()
    finally:
        run.extract_paper_info = original


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for t in tests:
        t()
    print(f'{len(tests)} tests passed')
