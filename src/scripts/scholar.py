"""Google Scholar lookups, used sparingly.

Scholar has no API and blocks anything that looks like bulk scraping — a pass
over the whole directory fails on more than half of it. So the pipeline only
ever asks about a handful of researchers at a time:

  * the h-index gate on a new submission (a few lookups per fetch)
  * `refresh`, which takes the N stalest entries and stops at the first sign
    of being throttled

Nothing here retries aggressively; being blocked is a reason to come back
later, not to push harder.
"""

import re
import time
import random

SCHOLAR_ID = re.compile(r"user=([\w-]+)")

# Scholar tolerates a trickle. These gaps are deliberately generous.
MIN_DELAY = 3.0
MAX_DELAY = 8.0


class Blocked(Exception):
    """Scholar refused the request (rate limited or captcha-walled)."""


def scholar_id(profile_url):
    """The user= id out of a Scholar profile link, or None."""
    match = SCHOLAR_ID.search(profile_url or "")
    return match.group(1) if match else None


def pause():
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


# scholarly.fill() downloads the researcher's entire publication list by default,
# which is far more than the directory needs (and far more requests).
SECTIONS = ["basics", "indices"]

# Left alone, scholarly retries a blocked request for many minutes before it
# raises, which hides the block from the caller's circuit breaker. Fail fast
# instead: being turned away is a signal to stop, not to keep knocking.
RETRIES = 2
TIMEOUT = 20

_configured = False


def _configure(scholarly):
    global _configured
    if not _configured:
        scholarly.set_retries(RETRIES)
        scholarly.set_timeout(TIMEOUT)
        _configured = True


def fetch_author(author_id):
    """Read one Scholar profile. Raises Blocked when Scholar turns us away."""
    from scholarly import scholarly

    _configure(scholarly)
    try:
        return scholarly.fill(scholarly.search_author_id(author_id), sections=SECTIONS)
    except Exception as error:
        message = str(error).lower()
        if "cannot fetch" in message or "429" in message or "captcha" in message \
                or "maxtries" in message or "blocked" in message:
            raise Blocked(str(error)) from error
        raise


def metrics(author):
    """The fields the directory keeps from a Scholar profile."""
    return {
        "hindex": author.get("hindex", -1),
        "citedby": author.get("citedby", 0),
        "affiliation": author.get("affiliation", ""),
        "website": author.get("homepage", ""),
        "interests": author.get("interests", []) or [],
        "photo_url": author.get("url_picture", ""),
    }


def hindex_for(profile_url):
    """h-index behind a Scholar profile link. Returns None when there is no id."""
    author_id = scholar_id(profile_url)
    if not author_id:
        return None
    return metrics(fetch_author(author_id))["hindex"]
