# LEGACY -- superseded by: python3 scripts/pipeline.py fetch
# Kept for reference; the pipeline no longer calls it.
"""Split the Google Form submissions into "new" and "update" researcher batches.

Reads the form responses sheet, keeps every submission newer than LAST_UPDATE,
downloads each submitted photo, and writes:

    assets/researchers_new.json     researchers to append to the directory
    assets/researchers_update.json  edits to researchers already in it

Both files are consumed by check_new_submissions.py / merge_new_submissions.py
(see update_researchers.sh). Bump LAST_UPDATE after every successful run.
"""

import io
import os
import re
import json
import argparse
from datetime import datetime

import requests
import pandas as pd
from PIL import Image

# ---- CONFIG ----
SHEET_ID = "1TTl82-dODXtCMNZr47TUPj939tiIzZP7zmFuAVx9RgE"
GID = "825523298"  # change if you want a different tab
LAST_UPDATE = "03/16/2026"  # only submissions from this date on are processed
PHOTO_SIZE = (200, 200)
# ----------------

# Paths are anchored to src/ so the script runs from anywhere, but the paths
# stored inside the JSON stay relative ("./assets/...") for the website.
SRC_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = "./assets/researchers.csv"
RESEARCHERS_PATH = "./assets/researchers_en.json"
NEW_PATH = "./assets/researchers_new.json"
UPDATE_PATH = "./assets/researchers_update.json"
IMAGES_DIR = "./assets/images"
TMP_DIR = "./assets/tmp"
DEFAULT_PHOTO = "./assets/images/default.jpg"

TIMESTAMP_FORMAT = "%m/%d/%Y %H:%M:%S"

# The form asks the same questions twice (once to add, once to update), so
# pandas suffixes the second block of columns with ".1".
ADD_COLUMNS = {
    "name": "Name",
    "affiliation": "Affiliation",
    "position": "Position",
    "scholar": "Google Scholar Profile Link",
    "linkedin": "LinkedIn Profile",
    "twitter": "Twitter Profile",
    "website": "Personal Website",
    "interests": "Research Interests",
    "photo": "Personal Photo",
}

UPDATE_COLUMNS = {
    "name": "Name.1",
    "affiliation": "Affiliation.1",
    "position": "Position.1",
    "scholar": "Google Scholar Profile",  # not a duplicate header, so no ".1"
    "linkedin": "LinkedIn Profile.1",
    "twitter": "Twitter Profile.1",
    "website": "Personal Website.1",
    "interests": "Research Interests.1",
    "photo": "Personal Photo.1",
}


def read_json(file):
    with open(file, 'r', encoding='utf-8') as fin:
        data = json.load(fin)
    return data


def write_json(file, data):
    with open(file, 'w', encoding="utf-8") as fout:
        json.dump(data, fout, ensure_ascii=False)


def abs_path(path):
    """Resolve a "./assets/..." path against src/."""
    return os.path.join(SRC_DIR, path)


def text(value):
    """Normalise a cell into a stripped string ("" for blanks/NaN)."""
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def slugify(name):
    return name.replace(' ', '-').lower()


def parse_timestamp(value):
    try:
        return datetime.strptime(text(value), TIMESTAMP_FORMAT)
    except ValueError:
        return None


def download_google_sheet_csv(sheet_id, gid, output_path):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export"
    params = {
        "format": "csv",
        "gid": gid
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    os.makedirs(os.path.dirname(abs_path(output_path)), exist_ok=True)

    with open(abs_path(output_path), "wb") as f:
        f.write(response.content)

    print(f"Downloaded sheet to {output_path}")


# Photo helpers live in lib.py now; re-exported so google_scholar.py keeps working.
from lib import (download_and_resize_image, download_image_gdrive,  # noqa: F401
                 gdrive_file_id)


def build_researcher(response, columns):
    """Turn one form response into a researcher entry."""
    name = text(response[columns["name"]])
    interests = text(response[columns["interests"]])

    return {
        "name": name,
        "affiliation": text(response[columns["affiliation"]]),
        "position": text(response[columns["position"]]),
        "hindex": -1,
        "photo": download_and_resize_image(
            response[columns["photo"]], f"{IMAGES_DIR}/{slugify(name)}.jpg"
        ),
        "scholar": text(response[columns["scholar"]]),
        "linkedin": text(response[columns["linkedin"]]),
        "website": text(response[columns["website"]]),
        "twitter": text(response[columns["twitter"]]),
        "interests": [i.strip() for i in interests.split(",") if i.strip()],
        "citedby": 0,
        "lastupdate": "",
    }


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--since", default=LAST_UPDATE, metavar="MM/DD/YYYY",
                        help=f"process submissions from this date on (default: {LAST_UPDATE})")
    parser.add_argument("--refresh", action="store_true",
                        help="re-download the sheet even if the CSV is already there")
    return parser.parse_args()


def main():
    args = parse_args()
    last_update = datetime.strptime(args.since, "%m/%d/%Y")

    if args.refresh or not os.path.exists(abs_path(CSV_PATH)):
        download_google_sheet_csv(SHEET_ID, GID, CSV_PATH)

    researchers = read_json(abs_path(RESEARCHERS_PATH))
    responses = pd.read_csv(abs_path(CSV_PATH), header=0)

    known_names = {entry["name"].strip() for entry in researchers}
    added_names = set()

    new_researchers = []
    to_update_researchers = []

    for idx in range(len(responses)):
        response = responses.iloc[idx]

        timestamp = parse_timestamp(response["Timestamp"])
        if timestamp is None:
            print(f"> [Skip] row {idx + 2}: unreadable timestamp {response['Timestamp']!r}")
            continue
        if timestamp < last_update:
            continue

        is_add = text(response["Add or Update"]).lower() == "add"
        name = text(response[ADD_COLUMNS["name"] if is_add else UPDATE_COLUMNS["name"]])

        if not name:
            print(f"> [Skip] row {idx + 2}: no name given")
            continue

        if is_add:
            if name in known_names:
                print(f"> [Skip] {name} is already in the directory")
                continue
            if name in added_names:
                print(f"> [Skip] {name} was submitted twice in this batch")
                continue
            print(f"> [Add] {name}")
            added_names.add(name)
            new_researchers += [build_researcher(response, ADD_COLUMNS)]
        else:
            if name not in known_names:
                print(f"> [Warn] {name} is not in the directory, the update will be a no-op")
            print(f"> [Update] {name}")
            to_update_researchers += [build_researcher(response, UPDATE_COLUMNS)]

    write_json(abs_path(NEW_PATH), new_researchers)
    write_json(abs_path(UPDATE_PATH), to_update_researchers)
    print(f"\n{len(new_researchers)} to add, {len(to_update_researchers)} to update "
          f"(submissions since {args.since})")


if __name__ == "__main__":
    main()
