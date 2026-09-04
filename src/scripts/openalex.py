# NOT WIRED INTO THE PIPELINE.
#
# OpenAlex was evaluated as a replacement for Google Scholar because it has a
# real API and does not block bulk access. It resolves and batches well, but its
# h-index and citation counts run well below Scholar's (Amr El Abbadi: 63 vs 80,
# Mona Diab: 48 vs 67), because it indexes fewer venues. The directory shows
# Scholar's numbers, so mixing the two would make entries incomparable.
#
# Kept for reference - it works, and is a reasonable cross-check when a Scholar
# reading looks wrong. See scholar.py for what the pipeline actually uses.

"""OpenAlex client: resolve researchers to author IDs and read their metrics.

OpenAlex is the directory's source of truth for h-index and citation counts.
Each researcher is resolved to an author ID once and the ID is cached in
researchers_en.json, so later refreshes are a handful of batch calls instead of
one lookup per person.

Docs: https://docs.openalex.org/api-entities/authors
"""

import os

from lib import http_get, text, name_key, affiliation_matches

API = "https://api.openalex.org"

# OpenAlex gives faster, more reliable service to callers who identify themselves.
# Opt in by exporting OPENALEX_MAILTO=you@example.com before running the pipeline.
MAILTO = os.environ.get("OPENALEX_MAILTO", "")


def _params(extra):
    params = dict(extra)
    if MAILTO:
        params["mailto"] = MAILTO
    return params
BATCH_SIZE = 50  # ids per filter query

# Scores from score_candidate(); a match is auto-accepted at HIGH.
HIGH_CONFIDENCE = 5
MEDIUM_CONFIDENCE = 3


def bare_id(author_id):
    """"https://openalex.org/A123" -> "A123"."""
    return text(author_id).rsplit("/", 1)[-1]


def institutions(author):
    names = [inst.get("display_name", "") for inst in author.get("last_known_institutions") or []]
    for affiliation in author.get("affiliations") or []:
        names.append((affiliation.get("institution") or {}).get("display_name", ""))
    return [name for name in names if name]


def all_names(author):
    return [author.get("display_name", "")] + list(author.get("display_name_alternatives") or [])


def metrics(author):
    """The fields the directory keeps from an OpenAlex author record."""
    stats = author.get("summary_stats") or {}
    return {
        "openalex": bare_id(author.get("id", "")),
        "hindex": stats.get("h_index", -1),
        "citedby": author.get("cited_by_count", 0),
        "works": author.get("works_count", 0),
        "institution": (institutions(author) or [""])[0],
        "topics": [topic["display_name"] for topic in (author.get("topics") or [])[:5]],
    }


def surname_key(name):
    parts = name_key(name).split()
    return parts[-1] if parts else ""


def initial_key(name):
    parts = name_key(name).split()
    return parts[0][0] if parts and parts[0] else ""


def score_candidate(researcher, author):
    """How strongly an OpenAlex author looks like one of our researchers.

    Returns (score, reasons). Name agreement alone is not enough for common
    Egyptian names, so an institution match carries most of the weight.
    """
    score, reasons = 0, []
    target = name_key(researcher["name"])

    if any(name_key(name) == target for name in all_names(author)):
        score += 3
        reasons.append("exact name")
    elif surname_key(author.get("display_name", "")) == surname_key(researcher["name"]) and \
            initial_key(author.get("display_name", "")) == initial_key(researcher["name"]):
        score += 1
        reasons.append("surname + initial")
    else:
        reasons.append("weak name match")

    if any(affiliation_matches(researcher.get("affiliation", ""), inst)
           for inst in institutions(author)):
        score += 2
        reasons.append("institution match")

    if (author.get("works_count") or 0) < 3:
        score -= 1
        reasons.append("almost no works")

    return score, reasons


def confidence(score):
    if score >= HIGH_CONFIDENCE:
        return "high"
    if score >= MEDIUM_CONFIDENCE:
        return "medium"
    return "low"


def search_authors(name, per_page=5):
    response = http_get(f"{API}/authors", params=_params({"search": name, "per-page": per_page}))
    return response.json().get("results", [])


def resolve(researcher, per_page=5):
    """Find the OpenAlex author for a researcher.

    Returns a dict with the best candidate, its confidence, and the runners-up
    so an ambiguous match can be settled by hand instead of guessed at.
    """
    name = text(researcher.get("name"))
    if not name:
        return {"openalex": "", "confidence": "low", "reasons": ["no name"], "candidates": []}

    candidates = search_authors(name, per_page=per_page)
    if not candidates:
        return {"openalex": "", "confidence": "low", "reasons": ["no OpenAlex results"],
                "candidates": []}

    scored = []
    for author in candidates:
        score, reasons = score_candidate(researcher, author)
        scored.append((score, reasons, author))
    scored.sort(key=lambda item: item[0], reverse=True)

    score, reasons, best = scored[0]

    tied = [item for item in scored if item[0] == score]
    if len(tied) > 1:
        # OpenAlex frequently holds several records for one researcher. When the
        # tied records all agree on the institution they are almost certainly the
        # same person, so take the fullest one; otherwise the name alone cannot
        # tell two people apart and a human should decide.
        tied.sort(key=lambda item: item[2].get("works_count", 0), reverse=True)
        score, reasons, best = tied[0]
        if all("institution match" in item[1] for item in tied):
            reasons = reasons + [f"fullest of {len(tied)} matching records"]
        else:
            reasons = reasons + ["tied with another candidate"]
            score = min(score, MEDIUM_CONFIDENCE)

    runners_up = [{"openalex": bare_id(a.get("id", "")), "name": a.get("display_name", ""),
                   "institution": (institutions(a) or [""])[0],
                   "hindex": (a.get("summary_stats") or {}).get("h_index", -1),
                   "works": a.get("works_count", 0), "score": s}
                  for s, _, a in scored if a is not best][:3]

    return {
        "openalex": bare_id(best.get("id", "")),
        "confidence": confidence(score),
        "score": score,
        "reasons": reasons,
        "matched_name": best.get("display_name", ""),
        "institution": (institutions(best) or [""])[0],
        "metrics": metrics(best),
        "candidates": runners_up,
    }


def fetch_authors(author_ids):
    """Look up many authors at once. Returns {bare id: author record}."""
    found = {}
    ids = [bare_id(author_id) for author_id in author_ids if text(author_id)]

    for start in range(0, len(ids), BATCH_SIZE):
        chunk = ids[start:start + BATCH_SIZE]
        response = http_get(f"{API}/authors", params=_params({
            "filter": "openalex:" + "|".join(chunk),
            "per-page": BATCH_SIZE,
        }))
        for author in response.json().get("results", []):
            found[bare_id(author.get("id", ""))] = author
        print(f"  fetched {min(start + BATCH_SIZE, len(ids))}/{len(ids)} authors")

    return found
