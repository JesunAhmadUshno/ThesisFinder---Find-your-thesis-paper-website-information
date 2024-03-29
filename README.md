# ThesisFinder---Find-your-thesis-paper-website-information
This Python script extracts paper information from a CSV file containing URLs and writes the extracted information to a new CSV file. The script uses the pandas library to read and write CSV files and the requests and BeautifulSoup libraries to make HTTP requests and parse HTML content.

# Requirements
1. Python 3.x
2. pandas library (pip install pandas)
3. requests library (pip install requests)
4. BeautifulSoup library (pip install beautifulsoup4)
# Usage
1. Save the CSV file containing URLs in the same directory as the Extract.py file.
2. Open the command prompt and navigate to the directory containing the Extract.py file.
3. Run the script by typing python Extract.py and pressing Enter.
4. The script will extract paper information from the URLs in the CSV file and write the information to a new CSV file named paper_info.csv.
# Functions
extract_paper_info(url)
This function takes a URL as input and returns a dictionary containing paper information extracted from the URL.

## url (string): The URL to extract paper information from.
Returns a dictionary containing the following keys:

## website (string): The website name.
doi (string): The digital object identifier (DOI) of the paper.
title (string): The title of the paper.
authors (list): A list of the authors of the paper.

## Example
from Extract import extract_paper_info

url = 'https://www.example.com/paper/123'
paper_info = extract_paper_info(url)
print(paper_info)
{'website': 'Example', 'doi': '10.1234/example', 'title': 'An Example Paper', 'authors': ['John Doe', 'Jane Doe']}
CSV File Format
The CSV file containing URLs should have the following columns:

url (string): The URL to extract paper information from.
## Example:
https://www.example.com/paper/123
https://www.example.com/paper/456
https://www.example.com/paper/789
