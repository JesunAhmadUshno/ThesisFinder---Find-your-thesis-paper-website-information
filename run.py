
import time

import requests
from bs4 import BeautifulSoup


# Define a function to extract paper information from a URL
def extract_paper_info(url):
    # Make HTTP GET request. A dead or slow URL yields an empty row instead of
    # stopping the whole batch.
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException:
        return extract_from_html('')
    return extract_from_html(response.content)


# Parse one page's HTML (bytes or str) into the paper_info row.
# Split out from extract_paper_info so it can be tested without the network.
def extract_from_html(html):
    # Parse HTML content
    soup = BeautifulSoup(html, 'html.parser')
    # Extract paper information
    paper_info = {}
    title_tag = soup.find('title')
    if title_tag is not None:
        paper_info['website'] = title_tag.text.strip()
    else:
        paper_info['website'] = ''
    doi_tag = soup.find('meta', {'name': 'DOI'})
    if doi_tag is not None and 'content' in doi_tag.attrs:
        paper_info['DOI'] = doi_tag['content']
    else:
        paper_info['DOI'] = ''
    title_tag = soup.find('meta', {'name': 'citation_title'})
    if title_tag is not None and 'content' in title_tag.attrs:
        paper_info['title'] = title_tag['content']
    else:
        paper_info['title'] = ''
    authors_tags = soup.find_all('span', {'class': 'authors-affiliations__name'})
    if authors_tags is not None:
        paper_info['author'] = [a.text for a in authors_tags]
    else:
        paper_info['author'] = []
    return paper_info


def run_batch(csv_in='paper.csv', csv_out='paper_info.csv'):
    import pandas as pd

    # Read in the CSV file
    df = pd.read_csv(csv_in)

    # Iterate over the URLs in the CSV file and extract paper information
    paper_info_list = []
    for url in df['url']:
        paper_info = extract_paper_info(url)
        paper_info_list.append(paper_info)

    # Convert the list of paper information dictionaries to a pandas DataFrame
    paper_df = pd.DataFrame(paper_info_list)

    # Write the paper information to a new CSV file
    paper_df.to_csv(csv_out, index=False)


BANNER = (r""" /$$$$$$$$ /$$$$$$$  /$$      /$$ /$$$$$$$$
| $$_____/| $$__  $$| $$$    /$$$| $$_____/
| $$      | $$  \ $$| $$$$  /$$$$| $$      
| $$$$$   | $$$$$$$/| $$ $$/$$ $$| $$$$$   
| $$__/   | $$__  $$| $$  $$$| $$| $$__/   
| $$      | $$  \ $$| $$\  $ | $$| $$      
| $$      | $$  | $$| $$ \/  | $$| $$$$$$$$
|__/      |__/  |__/|__/     |__/|________/""")


def blink_message(window, message):
    for i in range(5):
        window.clear()
        window.addstr(0, 0, message)
        window.refresh()
        time.sleep(0.5)
        window.clear()
        window.refresh()
        time.sleep(0.5)

def main():
    import curses  # imported here so the module still imports where curses is missing (Windows)

    # Initialize curses
    stdscr = curses.initscr()
    curses.noecho()
    curses.cbreak()

    # Set up the window
    height, width = stdscr.getmaxyx()
    window = curses.newwin(1, len("Job Done")+1, int(height/2), int(width/2-len("Job Done")/2))

    # Run the animation
    blink_message(window, "Job Done")

    # Clean up curses
    curses.nocbreak()
    curses.echo()
    curses.endwin()

if __name__ == '__main__':
    run_batch()
    print(BANNER)
    print ("ThesisFinder By Jesun")
    print ("Version: 1.0")
    main()
