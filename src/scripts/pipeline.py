#!/usr/bin/env python3
"""Researcher directory pipeline.

    python3 scripts/pipeline.py status              what state is the directory in
    python3 scripts/pipeline.py fetch               pull new form submissions -> review.json
    python3 scripts/pipeline.py review              show what is waiting to be applied
    python3 scripts/pipeline.py apply               merge the reviewed changes
    python3 scripts/pipeline.py refresh --dry-run   preview metric changes from Scholar
    python3 scripts/pipeline.py refresh             write them

fetch never touches researchers_en.json: it writes assets/review.json, which you
read (and edit) before running apply. Every submission it has already handled is
recorded in assets/pipeline_state.json, so there is no cutoff date to bump and
running any step twice is a no-op.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta

import pandas as pd

import scholar
from lib import (ADD_COLUMNS, UPDATE_COLUMNS, DERIVED_KEYS, DEFAULT_PHOTO, IMAGES_DIR,
                 CSV_PATH, REVIEW_PATH, RESEARCHERS_PATH, TIMESTAMP_FORMAT,
                 abs_path, download_and_resize_image, download_sheet_csv, is_blank,
                 name_key, read_json, read_state, slugify, split_interests,
                 strip_honorifics, text, write_json, write_state)

HINDEX_THRESHOLD = 5   # submissions below this default to "skip" in the review file
STALE_AFTER_DAYS = 30  # how old a metrics reading may get before refresh picks it up
REFRESH_BATCH = 25     # stalest entries per refresh run; Scholar blocks bulk access
MAX_CONSECUTIVE_BLOCKS = 3  # stop the run once Scholar starts refusing

FIELDS = ["name", "affiliation", "position", "scholar", "linkedin", "website",
          "twitter", "interests", "photo"]


def today():
    return datetime.now().strftime("%Y-%m-%d")


# ---------------------------------------------------------------- fetch

def build_submission(row, columns, download_photos=True):
    """Turn one form response into a researcher entry, with the name cleaned up."""
    raw_name = text(row[columns["name"]])
    name = strip_honorifics(raw_name)

    photo = DEFAULT_PHOTO
    if download_photos:
        photo = download_and_resize_image(row[columns["photo"]],
                                          f"{IMAGES_DIR}/{slugify(name)}.jpg")

    entry = {
        "name": name,
        "affiliation": text(row[columns["affiliation"]]),
        "position": text(row[columns["position"]]),
        "hindex": -1,
        "photo": photo,
        "scholar": text(row[columns["scholar"]]),
        "linkedin": text(row[columns["linkedin"]]),
        "website": text(row[columns["website"]]),
        "twitter": text(row[columns["twitter"]]),
        "interests": split_interests(row[columns["interests"]]),
        "citedby": 0,
        "lastupdate": "",
    }
    return entry, raw_name


def cmd_fetch(args):
    if not args.no_download:
        download_sheet_csv()

    responses = pd.read_csv(abs_path(CSV_PATH), header=0)
    researchers = read_json(RESEARCHERS_PATH)
    directory = {name_key(entry["name"]): entry for entry in researchers}

    state = read_state()
    processed = set(state["processed_timestamps"])

    items = []
    seen_in_batch = {}

    for index in range(len(responses)):
        row = responses.iloc[index]
        stamp = text(row["Timestamp"])
        sheet_row = index + 2  # 1-based, plus the header

        if not stamp:
            print(f"> row {sheet_row}: no timestamp, skipped")
            continue
        try:
            datetime.strptime(stamp, TIMESTAMP_FORMAT)
        except ValueError:
            print(f"> row {sheet_row}: unreadable timestamp {stamp!r}, skipped")
            continue
        if stamp in processed and not args.all:
            continue

        is_add = text(row["Add or Update"]).lower() == "add"
        columns = ADD_COLUMNS if is_add else UPDATE_COLUMNS
        if is_blank(row[columns["name"]]):
            print(f"> row {sheet_row}: no name in the {'add' if is_add else 'update'} block, skipped")
            continue

        entry, raw_name = build_submission(row, columns, download_photos=not args.no_photos)
        key = name_key(entry["name"])
        warnings = []

        if raw_name != entry["name"]:
            warnings.append(f"name cleaned up from {raw_name!r}")

        if is_add:
            action = "add"
            if key in directory:
                action, _ = "skip", warnings.append("already in the directory")
            elif key in seen_in_batch:
                action, _ = "skip", warnings.append(
                    f"duplicate of row {seen_in_batch[key]} in this batch")
            else:
                seen_in_batch[key] = sheet_row
        else:
            action = "update"
            if key not in directory:
                action, _ = "skip", warnings.append(
                    "no researcher with this name, nothing to update")

        if is_blank(entry["scholar"]):
            warnings.append("no Google Scholar link")
        if entry["photo"] == DEFAULT_PHOTO:
            warnings.append("no photo")
        if is_blank(entry["affiliation"]):
            warnings.append("no affiliation")

        # Look the h-index up now so the gate decision is visible while reviewing.
        if action == "add":
            try:
                found = scholar.hindex_for(entry["scholar"])
                if found is None:
                    # Not disqualifying: a few prominent researchers are in the
                    # directory on a Semantic Scholar or ResearchGate link. It does
                    # mean refresh can never update them, so decide deliberately.
                    warnings.append("no Google Scholar link: h-index unverified and "
                                    "refresh will always skip them")
                else:
                    entry["hindex"] = found
                    entry["lastupdate"] = today()
                scholar.pause()
            except scholar.Blocked as error:
                warnings.append(f"Scholar declined the h-index lookup ({error}); "
                                "check by hand or re-run later")
            except Exception as error:
                warnings.append(f"h-index lookup failed ({error})")

            if action != "skip" and 0 <= entry["hindex"] < HINDEX_THRESHOLD:
                action = "skip"
                warnings.append(f"h-index {entry['hindex']} is below the "
                                f"threshold of {HINDEX_THRESHOLD}")

        items.append({
            "action": action,
            "kind": "add" if is_add else "update",
            "sheet_row": sheet_row,
            "timestamp": stamp,
            "warnings": warnings,
            "data": entry,
        })
        print(f"> [{action}] {entry['name']}" + (f"  ({'; '.join(warnings)})" if warnings else ""))

    state["last_fetch"] = datetime.now().isoformat(timespec="seconds")
    write_state(state)

    review = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "instructions": ("Edit \"action\" on any item: add / update / skip. "
                         "Then run: python3 scripts/pipeline.py apply"),
        "items": items,
    }
    write_json(REVIEW_PATH, review, indent=2)

    counts = summarise(items)
    print(f"\n{len(items)} submission(s) -> {REVIEW_PATH}"
          f"  [{counts['add']} add, {counts['update']} update, {counts['skip']} skip]")
    if items:
        print("Review it, then run: python3 scripts/pipeline.py apply")


# ---------------------------------------------------------------- review

def summarise(items):
    counts = {"add": 0, "update": 0, "skip": 0}
    for item in items:
        counts[item["action"]] = counts.get(item["action"], 0) + 1
    return counts


def cmd_review(args):
    review = read_json(REVIEW_PATH, default=None)
    if not review or not review["items"]:
        print("Nothing pending. Run: python3 scripts/pipeline.py fetch")
        return

    print(f"{REVIEW_PATH} generated {review['generated']}\n")
    for item in review["items"]:
        entry = item["data"]
        print(f"[{item['action']:^6}] {entry['name']}  (row {item['sheet_row']}, {item['kind']})")
        print(f"          {entry['position'] or '?'} @ {entry['affiliation'] or '?'}"
              f"   h-index {entry['hindex']}")
        for warning in item["warnings"]:
            print(f"          ! {warning}")
        print()

    counts = summarise(review["items"])
    print(f"{counts['add']} add, {counts['update']} update, {counts['skip']} skip")


# ---------------------------------------------------------------- apply

def apply_update(researcher, submitted):
    """Copy every field the submitter actually filled in onto an existing entry."""
    changed = []
    for key in FIELDS:
        value = submitted.get(key)
        if key in DERIVED_KEYS or value in (None, "", []):
            continue
        # A missing photo comes back as the placeholder; don't clobber a real one.
        if key == "photo" and value == DEFAULT_PHOTO:
            continue
        if researcher.get(key) != value:
            changed.append(key)
            researcher[key] = value
    return changed


def cmd_apply(args):
    review = read_json(REVIEW_PATH, default=None)
    if not review or not review["items"]:
        print("Nothing to apply.")
        return

    researchers = read_json(RESEARCHERS_PATH)
    directory = {name_key(entry["name"]): entry for entry in researchers}
    state = read_state()
    processed = set(state["processed_timestamps"])

    added, updated, skipped = 0, 0, 0

    for item in review["items"]:
        entry = item["data"]
        key = name_key(entry["name"])

        if item["action"] == "skip":
            skipped += 1

        elif item["action"] == "add":
            if key in directory:  # someone else added them since the fetch
                print(f"= {entry['name']}: already in the directory, not added")
                skipped += 1
            else:
                entry.setdefault("standardized_interests", list(entry["interests"]))
                researchers.append(entry)
                directory[key] = entry
                added += 1
                print(f"+ {entry['name']}")

        elif item["action"] == "update":
            researcher = directory.get(key)
            if researcher is None:
                print(f"! {entry['name']}: not in the directory, nothing to update")
                skipped += 1
            else:
                changed = apply_update(researcher, entry)
                updated += 1
                print(f"~ {entry['name']}" + (f": {', '.join(changed)}" if changed
                                              else ": no change"))

        processed.add(item["timestamp"])

    if args.dry_run:
        print(f"\n[dry run] {added} to add, {updated} to update, {skipped} skipped; "
              "nothing written")
        return

    write_json(RESEARCHERS_PATH, researchers)
    state["processed_timestamps"] = sorted(processed)
    state["last_apply"] = datetime.now().isoformat(timespec="seconds")
    write_state(state)
    write_json(REVIEW_PATH, {"generated": review["generated"],
                             "instructions": review["instructions"], "items": []}, indent=2)

    print(f"\n{added} added, {updated} updated, {skipped} skipped -> "
          f"{len(researchers)} researchers")
    print("Run: python3 scripts/pipeline.py refresh --dry-run")


# ---------------------------------------------------------------- refresh

def needs_refresh(researcher, max_age_days):
    if not scholar.scholar_id(researcher.get("scholar", "")):
        return False  # nothing to look them up with
    last = text(researcher.get("lastupdate"))
    if not last:
        return True
    try:
        return datetime.strptime(last, "%Y-%m-%d") < datetime.now() - timedelta(days=max_age_days)
    except ValueError:
        return True


def staleness(researcher):
    """Sort key: never-updated first, then oldest reading first."""
    return text(researcher.get("lastupdate")) or "0000-00-00"


def cmd_refresh(args):
    researchers = read_json(RESEARCHERS_PATH)

    if args.name:
        wanted = [n.strip().lower() for n in args.name]
        due = [r for r in researchers
               if any(w in r["name"].lower() for w in wanted)
               and scholar.scholar_id(r.get("scholar", ""))]
    else:
        due = sorted([r for r in researchers if args.all or needs_refresh(r, args.max_age)],
                     key=staleness)
    total_due = len(due)
    due = due[:args.limit]

    no_link = sum(1 for r in researchers if not scholar.scholar_id(r.get("scholar", "")))
    print(f"{total_due} researcher(s) due, refreshing the {len(due)} stalest "
          f"({no_link} have no usable Scholar link)")
    if not due:
        return

    changes, blocked_in_a_row, stopped_early = [], 0, False

    for index, researcher in enumerate(due, start=1):
        author_id = scholar.scholar_id(researcher["scholar"])
        try:
            author = scholar.fetch_author(author_id)
            blocked_in_a_row = 0
        except scholar.Blocked as error:
            blocked_in_a_row += 1
            print(f"  [{index}/{len(due)}] {researcher['name']}: blocked ({error})")
            if blocked_in_a_row >= MAX_CONSECUTIVE_BLOCKS:
                print(f"\nScholar refused {blocked_in_a_row} lookups in a row - stopping here "
                      "rather than digging the hole deeper. Try again later.")
                stopped_early = True
                break
            scholar.pause()
            continue
        except Exception as error:
            print(f"  [{index}/{len(due)}] {researcher['name']}: lookup failed ({error})")
            scholar.pause()
            continue

        stats = scholar.metrics(author)
        before = (researcher.get("hindex", -1), researcher.get("citedby", 0))
        after = (stats["hindex"], stats["citedby"])

        researcher["hindex"] = stats["hindex"]
        researcher["citedby"] = stats["citedby"]
        researcher["lastupdate"] = today()

        # Fill only what the directory is missing; a submitted value always wins.
        if is_blank(researcher.get("affiliation")) and stats["affiliation"]:
            researcher["affiliation"] = stats["affiliation"]
        if is_blank(researcher.get("website")) and stats["website"]:
            researcher["website"] = stats["website"]
        if not researcher.get("interests") and stats["interests"]:
            researcher["interests"] = stats["interests"]
        if not researcher.get("standardized_interests"):
            researcher["standardized_interests"] = list(researcher.get("interests", []))
        if args.photos and researcher.get("photo") == DEFAULT_PHOTO and stats["photo_url"]:
            researcher["photo"] = download_and_resize_image(
                stats["photo_url"], f"{IMAGES_DIR}/{slugify(researcher['name'])}.jpg")

        marker = "" if before == after else f"   {before[0]} -> {after[0]} h, {before[1]} -> {after[1]} cited"
        print(f"  [{index}/{len(due)}] {researcher['name']}{marker}")
        if before != after:
            changes.append((researcher["name"], before, after))

        # Written as we go, so a block halfway through keeps what we already have.
        if not args.dry_run:
            write_json(RESEARCHERS_PATH, researchers)

        if index < len(due):
            scholar.pause()

    if args.dry_run:
        print(f"\n[dry run] {len(changes)} researcher(s) would change; nothing written")
        return

    write_json(RESEARCHERS_PATH, researchers)
    state = read_state()
    state["last_refresh"] = datetime.now().isoformat(timespec="seconds")
    write_state(state)

    print(f"\n{len(changes)} researcher(s) changed; {max(total_due - len(due), 0)} still due")
    if stopped_early:
        print("Stopped early - run it again once Scholar has cooled off.")


# ---------------------------------------------------------------- status

def cmd_status(args):
    researchers = read_json(RESEARCHERS_PATH)
    state = read_state()
    review = read_json(REVIEW_PATH, default={"items": []})

    keys = [name_key(r["name"]) for r in researchers]
    duplicates = {k for k in keys if keys.count(k) > 1}

    print(f"researchers            {len(researchers)}")
    print(f"duplicate names        {len(duplicates)}" +
          (f"  {sorted(duplicates)}" if duplicates else ""))
    print(f"no Scholar link        {sum(1 for r in researchers if not scholar.scholar_id(r.get('scholar', '')))}")
    print(f"no h-index             {sum(1 for r in researchers if r.get('hindex', -1) < 0)}")
    print(f"stale (>{STALE_AFTER_DAYS}d)          "
          f"{sum(1 for r in researchers if needs_refresh(r, STALE_AFTER_DAYS))}")
    print(f"placeholder photo      {sum(1 for r in researchers if r.get('photo') == DEFAULT_PHOTO)}")
    print(f"photo file missing     {sum(1 for r in researchers if not os.path.exists(abs_path(r.get('photo', ''))))}")
    print(f"no interests           {sum(1 for r in researchers if not r.get('interests'))}")
    print(f"submissions handled    {len(state['processed_timestamps'])}")
    print(f"pending review         {len(review['items'])}")
    print(f"last fetch / apply     {state.get('last_fetch', '-')} / {state.get('last_apply', '-')}")
    print(f"last refresh           {state.get('last_refresh', '-')}")


# ---------------------------------------------------------------- cli

def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    fetch = sub.add_parser("fetch", help="pull new submissions into review.json")
    fetch.add_argument("--no-download", action="store_true", help="use the CSV already on disk")
    fetch.add_argument("--no-photos", action="store_true", help="skip photo downloads")
    fetch.add_argument("--all", action="store_true",
                       help="re-read every row, including ones already handled")
    fetch.set_defaults(func=cmd_fetch)

    review = sub.add_parser("review", help="show what is waiting to be applied")
    review.set_defaults(func=cmd_review)

    apply_cmd = sub.add_parser("apply", help="merge the reviewed changes")
    apply_cmd.add_argument("--dry-run", action="store_true", help="report without writing")
    apply_cmd.set_defaults(func=cmd_apply)

    refresh = sub.add_parser("refresh", help="refresh h-index and citations from Google Scholar")
    refresh.add_argument("--all", action="store_true", help="consider everyone, not just stale entries")
    refresh.add_argument("--max-age", type=int, default=STALE_AFTER_DAYS,
                         help=f"days before an entry is stale (default {STALE_AFTER_DAYS})")
    refresh.add_argument("--limit", type=int, default=REFRESH_BATCH,
                         help=f"how many of the stalest to do in one run (default {REFRESH_BATCH})")
    refresh.add_argument("--photos", action="store_true",
                         help="also pull Scholar profile photos for entries still on the placeholder")
    refresh.add_argument("--name", action="append", metavar="SUBSTRING",
                         help="refresh only researchers whose name contains this "
                              "(repeatable); ignores staleness")
    refresh.add_argument("--dry-run", action="store_true", help="report without writing")
    refresh.set_defaults(func=cmd_refresh)

    status = sub.add_parser("status", help="directory health check")
    status.set_defaults(func=cmd_status)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
