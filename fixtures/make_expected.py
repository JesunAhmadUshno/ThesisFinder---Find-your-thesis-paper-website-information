"""Regenerate the known answers for the synthetic fixtures.

Runs run.py's own code (extract_from_html, and run_batch with the network
swapped for the local fixture files) and writes:
  fixtures/expected.json            one paper_info dict per fixture
  fixtures/expected_paper_info.csv  what run_batch writes for fixtures/paper.csv

Both the Python tests and the site's build-time check compare against these
files. Needs pandas, beautifulsoup4 and requests. Usage: python fixtures/make_expected.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import run  # noqa: E402


def fixture_for(url):
    return os.path.join(HERE, url.rstrip('/').rsplit('/', 1)[-1] + '.html')


def main():
    import pandas as pd

    urls = list(pd.read_csv(os.path.join(HERE, 'paper.csv'))['url'])
    expected = {}
    for url in urls:
        with open(fixture_for(url), 'rb') as f:
            expected[os.path.basename(fixture_for(url))] = run.extract_from_html(f.read())
    with open(os.path.join(HERE, 'expected.json'), 'w', encoding='utf-8') as f:
        json.dump(expected, f, indent=2, ensure_ascii=False)
        f.write('\n')

    def offline_extract(url):
        with open(fixture_for(url), 'rb') as f:
            return run.extract_from_html(f.read())

    run.extract_paper_info = offline_extract
    run.run_batch(os.path.join(HERE, 'paper.csv'), os.path.join(HERE, 'expected_paper_info.csv'))


if __name__ == '__main__':
    main()
