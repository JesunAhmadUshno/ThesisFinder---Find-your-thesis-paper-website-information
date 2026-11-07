# ThesisFinder---Find-your-thesis-paper-website-information

Live dashboard: https://jesunahmadushno.github.io/ThesisFinder---Find-your-thesis-paper-website-information/

This Python script extracts paper information from a CSV file containing URLs and writes the extracted information to a new CSV file. The script uses the pandas library to read and write CSV files and the requests and BeautifulSoup libraries to make HTTP requests and parse HTML content.

The dashboard runs the same four extraction rules in your browser on sample pages or HTML you paste. It cannot fetch URLs itself (browsers block cross-site reads), and its sample pages are synthetic, written for this repo.

# Requirements
1. Python 3.x
2. pandas library (pip install pandas)
3. requests library (pip install requests)
4. BeautifulSoup library (pip install beautifulsoup4)

Or install the tested versions in one step: `pip install -r requirements.txt`

# Usage
1. Save a CSV file named paper.csv with a `url` column in the same directory as run.py.
2. Open a terminal and navigate to the directory containing run.py.
3. Run the script by typing `python run.py` and pressing Enter.
4. The script will extract paper information from the URLs in the CSV file and write it to a new CSV file named paper_info.csv, then show a short "Job Done" animation (this part uses curses, which is not available on Windows by default).

A URL that fails to load (no connection, or no answer within 15 seconds) gives an empty row instead of stopping the run.

# Functions
## extract_paper_info(url)
Fetches the URL and returns `extract_from_html(response.content)`.

## extract_from_html(html)
Parses one page's HTML (bytes or str) and returns a dictionary with these keys:

- website (string): the text of the page's `<title>` tag, stripped of surrounding whitespace. This is the page title, not just the site name.
- DOI (string): the `content` of `<meta name="DOI">`. The match is exact and case-sensitive, so `citation_doi` or `doi` tags are not read.
- title (string): the `content` of `<meta name="citation_title">`.
- author (list): the text of every `<span class="authors-affiliations__name">`, kept as is (not stripped).

Missing tags give an empty string, or an empty list for author.

## Example
```python
from run import extract_from_html

with open('fixtures/full.html', 'rb') as f:
    print(extract_from_html(f.read()))
# {'website': 'Example Journal of Placeholder Studies | Article', 'DOI': '10.0000/example.full',
#  'title': 'A Fully Tagged Example Paper', 'author': ['Ada Example', 'Ben Sample', ' Cy Placeholder ']}
```
This output comes from the committed sample page `fixtures/full.html` (see `fixtures/expected.json`).

# CSV File Format
The input CSV needs a `url` column:

```
url
https://www.example.com/paper/123
https://www.example.com/paper/456
```

The output paper_info.csv has the columns website, DOI, title, author. The author cell holds the Python list as text, for example `['Ada Example', 'Ben Sample']`.

# Tests
`python -m pytest -q tests` (or `python tests/test_extract.py`). The tests run offline against the synthetic pages in `fixtures/`. To regenerate the known answers after changing the rules, run `python fixtures/make_expected.py` (needs pandas).
