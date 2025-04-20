import os
import requests
from urllib.parse import urljoin

# Create assets directory if it doesn't exist
if not os.path.exists('assets'):
    os.makedirs('assets')

# Base URL for Uno card images
base_url = "https://raw.githubusercontent.com/spopli/uno-cards/main/assets/"

# Card types and their variations
cards = {
    'numbers': {
        'colors': ['red', 'blue', 'green', 'yellow'],
        'values': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    },
    'special': {
        'colors': ['red', 'blue', 'green', 'yellow'],
        'values': ['skip', 'reverse', 'draw2']
    },
    'wild': {
        'colors': ['black'],
        'values': ['wild', 'wild_draw4']
    }
}

def download_image(url, filename):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded: {filename}")
        else:
            print(f"Failed to download: {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {str(e)}")

# Download all card images
for card_type, variations in cards.items():
    for color in variations['colors']:
        for value in variations['values']:
            if card_type == 'wild':
                filename = f"assets/wild_{value}.png"
                url = urljoin(base_url, f"wild_{value}.png")
            else:
                filename = f"assets/{color}_{value}.png"
                url = urljoin(base_url, f"{color}_{value}.png")
            
            download_image(url, filename)

print("Download complete!") 