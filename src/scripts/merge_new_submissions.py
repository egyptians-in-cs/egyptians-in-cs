# LEGACY -- superseded by: python3 scripts/pipeline.py apply
# Kept for reference; the pipeline no longer calls it.
"""Merge the batches produced by populate.py into the researcher directory.

Updates are applied field by field onto the matching entry; new researchers are
appended. The merge is idempotent: running it twice on the same batch is a
no-op, since anyone already in the directory is skipped.
"""

import json
from tqdm import tqdm

RESEARCHERS_PATH = "./assets/researchers_en.json"
NEW_PATH = "./assets/researchers_new.json"
UPDATE_PATH = "./assets/researchers_update.json"

DEFAULT_PHOTO = "./assets/images/default.jpg"
BLANK_VALUES = ["", "NaN", "nan", "None"]
# Filled in later by google_scholar.py, so never taken from a form submission.
DERIVED_KEYS = ["hindex", "citedby"]


def write_json(path, data):
    with open(path, 'w') as fout:
        json.dump(data, fout)


def read_json(path):
    with open(path, 'r') as fin:
        data = json.load(fin)
    return data


def is_blank(value):
    return value is None or str(value).strip() in BLANK_VALUES


def apply_update(researcher, update):
    """Copy every field the submitter actually filled in onto an existing entry."""
    for key, value in update.items():
        if key in DERIVED_KEYS or is_blank(value):
            continue
        # A missing photo comes back as the placeholder; don't clobber a real one.
        if key == "photo" and value == DEFAULT_PHOTO:
            continue
        researcher[key] = value


if __name__ == "__main__":

    researchers_new = read_json(NEW_PATH)
    researchers_update = read_json(UPDATE_PATH)

    researchers = read_json(RESEARCHERS_PATH)
    by_name = {researcher["name"].strip(): researcher for researcher in researchers}

    for researcher_to_update in tqdm(researchers_update):
        name = researcher_to_update["name"].strip()
        researcher = by_name.get(name)
        if researcher is None:
            print(f"Skipped {name}: not in the directory, nothing to update")
            continue

        apply_update(researcher, researcher_to_update)
        print(f"Updated {name}")

    for researcher in tqdm(researchers_new):
        name = researcher["name"].strip()
        if name in by_name:
            print(f"Skipped {name}: already in the directory")
            continue

        researchers += [researcher]
        by_name[name] = researcher
        print(f"Added {name}")

    write_json(RESEARCHERS_PATH, researchers)
    print(f"\n{len(researchers)} researchers in {RESEARCHERS_PATH}")
