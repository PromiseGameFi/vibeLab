import urllib.request
import json
import os

url = "https://cdn.syndication.twimg.com/tweet-result?id=2024656766441836697&token=1"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Tweet Text:")
        print(data.get('text', 'No text found'))
except Exception as e:
    print(f"Error: {e}")
