import os
import json
import requests
import pandas as pd
from PIL import Image
from io import BytesIO
from datetime import datetime

# ---- CONFIG ----
SHEET_ID = "1TTl82-dODXtCMNZr47TUPj939tiIzZP7zmFuAVx9RgE"
GID = "825523298"  # change if you want a different tab
OUTPUT_PATH = "./assets/researchers.csv"
# ----------------

def download_and_resize_image(url: str, output_path: str, size=(200, 200)) -> str:
    """
    Downloads an image from a URL, resizes it, and saves it.

    Args:
        url: Direct link to the image.
        output_path: Where to save the resized image (including filename).
        size: Tuple of (width, height). Defaults to (200, 200).
    """

    if is_nan(url) or url.strip() in ["", "NaN", "nan"]:
        print(f"No URL provided for image. Skipping download.")
        return "./assets/images/default.jpg"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))
        image = image.convert("RGB")  # ensure compatibility for JPG/PNG/etc
        if image.size[0] < size[0] or image.size[1] < size[1]:
            print(f"Image from {url} is smaller than the desired size {size}. Skipping resize.")
        else:
            image = image.resize(size, Image.LANCZOS)

    except Exception as e:
        print(f"Error downloading or processing image from {url}: {e}")
        return "./assets/images/default.jpg"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path)

    print(f"Saved resized image to {output_path}")
    return output_path

def is_nan(string):
    return string != string

def read_json(file):
    with open(file, 'r', encoding='utf-8') as fin:
        data = json.load(fin)
    return data 

def write_json(file, data):
    with open(file, 'w', encoding="utf-8") as fout:
        json.dump(data, fout, ensure_ascii=False)

def download_google_sheet_csv(sheet_id, gid, output_path):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export"
    params = {
        "format": "csv",
        "gid": gid
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "wb") as f:
        f.write(response.content)

    print(f"Downloaded sheet to {output_path}")

if __name__ == "__main__":

    if not os.path.exists(OUTPUT_PATH):
        download_google_sheet_csv(SHEET_ID, GID, OUTPUT_PATH)

    out_new_file = "./assets/researchers_new.json"
    out_update_file = "./assets/researchers_update.json"

    researchers = read_json('./assets/researchers_en.json')
    responses = pd.read_csv(OUTPUT_PATH, header=0)

    new_researchers = []
    to_update_researchers = []

    last_update = datetime.strptime("11/24/2025", "%m/%d/%Y")

    names = [entry["name"] for entry in researchers]

    for idx in range(len(responses)):
        response = responses.iloc[idx]
        add_flag = response["Add or Update"] == "Add"
        timestamp = datetime.strptime(response["Timestamp"], "%m/%d/%Y %H:%M:%S")
        if timestamp < last_update:
            continue
        
        if add_flag and not pd.isna(response["Name"]):
            name = response["Name"].strip()
            photo_link = response["Personal Photo Link"]
            scholar = str(response["Google Scholar Profile Link"]).strip()
            linkedin = response["LinkedIn Profile"]
            twitter = response["Twitter Profile"]
            website = response["Personal Website"]
            interests = [interest.strip() for interest in response["Research Interests"].split(",")] if not pd.isna(response["Research Interests"]) else []
            photo_path = f"./assets/images/{name.replace(' ', '-').lower()}.jpg"
            if name not in names:
                print(f"> [Add] {name}")
                new_researchers += [{
                    "name": name,
                    "affiliation": str(response["Affiliation"]).strip(),
                    "position": str(response["Position"]).strip(),
                    "hindex": -1,
                    "photo": download_and_resize_image(photo_link, photo_path),
                    "scholar": scholar,
                    "linkedin": "" if is_nan(linkedin) else linkedin,
                    "website": "" if is_nan(website) else website,
                    "twitter": "" if is_nan(twitter) else twitter,
                    "interests": interests,
                    "citedby": 0,
                    "lastupdate": ""
                }]
        elif not pd.isna(response["Name.1"]):
            name = response["Name.1"].strip()
            photo_link = response["Personal Photo Link.1"]
            scholar = str(response["Google Scholar Profile"]).strip()
            linkedin = response["LinkedIn Profile.1"]
            twitter = response["Twitter Profile.1"]
            website = response["Personal Website.1"]
            interests = [interest.strip() for interest in response["Research Interests.1"].split(",")] if not pd.isna(response["Research Interests.1"]) else []
            print(f"> [Update] {name}")
            photo_path = f"./assets/images/{name.replace(' ', '-').lower()}.jpg"
            to_update_researchers += [{
                    "name": name,
                    "affiliation": str(response["Affiliation.1"]).strip(),
                    "position": str(response["Position.1"]).strip(),
                    "hindex": -1,
                    "photo": download_and_resize_image(photo_link, photo_path),
                    "scholar": scholar,
                    "linkedin": "" if is_nan(linkedin) else linkedin,
                    "website": "" if is_nan(website) else website,
                    "twitter": "" if is_nan(twitter) else twitter,
                    "interests": interests,
                    "citedby": 0,
                    "lastupdate": ""
                }]
            
    write_json(out_new_file, new_researchers)
    write_json(out_update_file, to_update_researchers)
