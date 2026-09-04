#!/usr/bin/env python3
"""Snap every affiliation in locations.json to its city centre.

The map should show which city a researcher is in, not which building. Campus
level coordinates are more precision than the directory needs, so each
affiliation is rewritten to the centre of its city, looked up once from
OpenStreetMap's Nominatim service. All affiliations in a city then share one
point and the map clusters them into a single marker.

    python3 scripts/city_coords.py --dry-run   # show what would change
    python3 scripts/city_coords.py             # rewrite locations.json

Cities Nominatim cannot resolve keep their existing coordinates and are listed
at the end so they can be set by hand.
"""

import json
import time
import argparse

from lib import abs_path, http_get

LOCATIONS_PATH = "./assets/locations.json"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
# Nominatim asks for at most one request per second from a identifiable client.
REQUEST_DELAY = 1.1

# A city centre should be near the institutions in it. A match farther away than
# this (~55km) is the geocoder having picked a different city of the same name,
# so the affiliation keeps its own coordinates and gets reported instead.
MAX_PLAUSIBLE_MOVE = 0.5

# City names that are ambiguous without a region. Nominatim answers the plain
# name with the wrong place, so ask a more specific question.
CITY_QUERIES = {
    ("Mount Pleasant", "USA"): "Mount Pleasant, Isabella County, Michigan, United States",
    ("Mansoura", "Egypt"): "El Mansoura, Dakahlia, Egypt",
    ("Al Kharj", "Saudi Arabia"): "Al-Kharj, Riyadh Province, Saudi Arabia",
}


def geocode_city(city, country):
    """City centre for a "city, country" pair, or None if it cannot be found."""
    override = CITY_QUERIES.get((city, country))
    attempts = [{"q": override, "format": "json", "limit": 1}] if override else [
        {"city": city, "country": country, "format": "json", "limit": 1},
        {"q": f"{city}, {country}", "format": "json", "limit": 1},
    ]
    for params in attempts:
        response = http_get(NOMINATIM, params=params, retries=3)
        results = response.json()
        time.sleep(REQUEST_DELAY)
        if results:
            return round(float(results[0]["lat"]), 4), round(float(results[0]["lng" if "lng" in results[0] else "lon"]), 4)
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report without writing")
    args = parser.parse_args()

    with open(abs_path(LOCATIONS_PATH), encoding="utf-8") as fin:
        locations = json.load(fin)

    cities = sorted({(entry["city"], entry["country"]) for entry in locations.values()})
    print(f"{len(locations)} affiliations across {len(cities)} cities\n")

    centres, unresolved = {}, []
    for index, (city, country) in enumerate(cities, start=1):
        try:
            centre = geocode_city(city, country)
        except Exception as error:
            centre = None
            print(f"  [{index}/{len(cities)}] {city}, {country}: lookup failed ({error})")

        if centre is None:
            unresolved.append((city, country))
            continue

        centres[(city, country)] = centre
        print(f"  [{index}/{len(cities)}] {city}, {country} -> {centre[0]}, {centre[1]}")

    moved, biggest, suspect = 0, [], []
    for name, entry in locations.items():
        centre = centres.get((entry["city"], entry["country"]))
        if centre is None:
            continue

        distance = abs(entry["lat"] - centre[0]) + abs(entry["lng"] - centre[1])
        if distance > MAX_PLAUSIBLE_MOVE:
            suspect.append((name, entry["city"], entry["country"], distance))
            continue

        if (entry["lat"], entry["lng"]) != centre:
            biggest.append((distance, name))
            entry["lat"], entry["lng"] = centre
            moved += 1

    print(f"\n{moved} affiliation(s) moved to their city centre")
    for delta, name in sorted(biggest, reverse=True)[:8]:
        print(f"   {name}: moved {delta:.3f} degrees")

    if suspect:
        print(f"\n{len(suspect)} affiliation(s) left alone - the city match looked wrong:")
        for name, city, country, distance in suspect:
            print(f"   {name} ({city}, {country}) was {distance:.2f} degrees from the match")

    if unresolved:
        print(f"\n{len(unresolved)} city/cities could not be resolved, coordinates left as they were:")
        for city, country in unresolved:
            print(f"   {city}, {country}")

    if args.dry_run:
        print("\n[dry run] nothing written")
        return

    with open(abs_path(LOCATIONS_PATH), "w", encoding="utf-8") as fout:
        json.dump(locations, fout, indent=2, ensure_ascii=False)
    print(f"\nWrote {LOCATIONS_PATH}")


if __name__ == "__main__":
    main()
