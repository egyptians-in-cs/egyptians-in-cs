"""Shared helpers for the researcher directory pipeline.

Every path is anchored to src/ so the scripts run from anywhere, while the
paths stored inside the JSON stay relative ("./assets/...") for the website.
"""

import os
import re
import json
import time
import unicodedata

import requests

# Set DIRECTORY_SRC to point the pipeline at a copy of src/ (used for testing).
SRC_DIR = os.environ.get("DIRECTORY_SRC") or os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))

RESEARCHERS_PATH = "./assets/researchers_en.json"
CSV_PATH = "./assets/researchers.csv"
REVIEW_PATH = "./assets/review.json"
# Kept out of assets/ because everything there is published with the site.
STATE_PATH = "./scripts/pipeline_state.json"
IMAGES_DIR = "./assets/images"
TMP_DIR = "./assets/tmp"
DEFAULT_PHOTO = "./assets/images/default.jpg"
TOKEN_PATH = "./token.json"
CREDENTIALS_PATH = "./assets/credentials.json"

SHEET_ID = "1TTl82-dODXtCMNZr47TUPj939tiIzZP7zmFuAVx9RgE"
GID = "825523298"

PHOTO_SIZE = (200, 200)
TIMESTAMP_FORMAT = "%m/%d/%Y %H:%M:%S"
BLANK_VALUES = ["", "NaN", "nan", "None", "N/A", "-"]

# Titles submitters type into the name field; stripped so "Dr. Hatem Keshk"
# and "Hatem Keshk" are the same person.
HONORIFICS = ["dr", "dr.", "prof", "prof.", "professor", "mr", "mr.", "mrs",
              "mrs.", "ms", "ms.", "eng", "eng.", "engineer", "phd", "ph.d",
              "ph.d.", "assoc", "assoc.", "asst", "asst."]

# The form asks the same questions twice (add block, then update block), so
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

# Filled in by the metrics refresh, never taken from a form submission.
DERIVED_KEYS = ["hindex", "citedby", "lastupdate"]


# ---------------------------------------------------------------- files

def abs_path(path):
    return os.path.join(SRC_DIR, path)


def read_json(path, default=None):
    if default is not None and not os.path.exists(abs_path(path)):
        return default
    with open(abs_path(path), 'r', encoding='utf-8') as fin:
        return json.load(fin)


# The directory files are reviewed as diffs, so they keep the indentation they
# have always had - writing them on one line makes every change unreadable.
JSON_INDENT = {RESEARCHERS_PATH: 2, "./assets/researchers_ar.json": 4}


def write_json(path, data, indent="keep"):
    if indent == "keep":
        indent = JSON_INDENT.get(path)
    with open(abs_path(path), 'w', encoding='utf-8') as fout:
        json.dump(data, fout, indent=indent)
        if indent:
            fout.write('\n')


def read_state():
    return read_json(STATE_PATH, default={"processed_timestamps": [],
                                          "last_fetch": "",
                                          "last_refresh": ""})


def write_state(state):
    write_json(STATE_PATH, state, indent=2)


# ---------------------------------------------------------------- text

def text(value):
    """Normalise a cell or field into a stripped string ("" for blanks/NaN)."""
    if value is None:
        return ""
    # NaN is the only value that is not equal to itself.
    if value != value:
        return ""
    value = str(value).strip()
    return "" if value in BLANK_VALUES else value


def is_blank(value):
    return text(value) == ""


def strip_honorifics(name):
    """Drop leading titles and trailing degree suffixes from a submitted name."""
    name = re.sub(r"\s+", " ", text(name)).strip(" ,")

    parts = name.split(" ")
    while parts and parts[0].lower().strip(",") in HONORIFICS:
        parts = parts[1:]
    while parts and parts[-1].lower().strip(",") in HONORIFICS:
        parts = parts[:-1]

    return " ".join(parts).strip(" ,")


def name_key(name):
    """Comparison key: accent-free, punctuation-free, lowercase."""
    name = strip_honorifics(name)
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))
    name = re.sub(r"[^\w\s]", "", name).lower()
    return re.sub(r"\s+", " ", name).strip()


def slugify(name):
    """Filename stem for a researcher photo."""
    slug = name_key(name).replace(" ", "-")
    return re.sub(r"-+", "-", slug).strip("-")


# Connectives that never contribute a letter to an institution's acronym
# ("American University in Cairo" -> AUC, not AUIC).
ACRONYM_SKIP = {"of", "and", "the", "for", "in", "at", "on", "de", "la", "a", "an"}

# Generic words that make two unrelated institutions look similar.
INSTITUTION_STOPWORDS = {"university", "of", "the", "for", "and", "college",
                         "institute", "school", "department", "dept", "center",
                         "centre", "research", "faculty", "lab", "laboratory"}


def acronym(phrase):
    """Initials of a multi-word institution name ("" when there is none worth using)."""
    words = [word for word in re.findall(r"[A-Za-z]+", phrase.lower())
             if word not in ACRONYM_SKIP]
    if len(words) < 2:
        return ""
    initials = "".join(word[0] for word in words)
    return initials if len(initials) >= 3 else ""


def affiliation_matches(left, right):
    """Loose institution comparison: a shared significant word, or an acronym hit."""
    left, right = text(left).lower(), text(right).lower()
    if not left or not right:
        return False

    left_words = {w for w in re.findall(r"[a-z]+", left)
                  if w not in INSTITUTION_STOPWORDS and len(w) > 2}
    right_words = {w for w in re.findall(r"[a-z]+", right)
                   if w not in INSTITUTION_STOPWORDS and len(w) > 2}
    if left_words & right_words:
        return True

    left_compact, right_compact = left.replace(" ", ""), right.replace(" ", "")
    if acronym(right) and acronym(right) == left_compact:
        return True
    if acronym(left) and acronym(left) == right_compact:
        return True

    return False


def split_interests(value):
    return [part.strip() for part in text(value).split(",") if part.strip()]


# ---------------------------------------------------------------- http

class RateLimited(Exception):
    def __init__(self, message, retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after


# ---------------------------------------------------------------- photos

def gdrive_file_id(url):
    """Pull the file id out of either /file/d/<id>/view or ...?id=<id> links."""
    match = re.search(r"(?:/d/|[?&]id=)([\w-]+)", url)
    return match.group(1) if match else None


def download_image_gdrive(file_id, output_path):
    """Fetch a Drive file with the cached OAuth token (see download_token_gdrive.py)."""
    import io as _io
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload

    creds = Credentials.from_authorized_user_file(abs_path(TOKEN_PATH))
    service = build("drive", "v3", credentials=creds)

    request = service.files().get_media(fileId=file_id)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    downloader = MediaIoBaseDownload(_io.FileIO(output_path, "wb"), request)

    done = False
    while not done:
        _, done = downloader.next_chunk()


def download_and_resize_image(url, output_path, size=PHOTO_SIZE):
    """Download a photo, resize it, save it under src/assets/images.

    Args:
        url: Direct link to the image, or a Google Drive link.
        output_path: Where to save it, relative to src/ ("./assets/images/x.jpg").
        size: Tuple of (width, height).

    Returns the stored path, or DEFAULT_PHOTO if there is nothing to download.
    """
    from io import BytesIO
    from PIL import Image

    url = text(url)
    if not url:
        return DEFAULT_PHOTO

    tmp_path = None
    try:
        if "drive.google.com" in url:
            file_id = gdrive_file_id(url)
            if file_id is None:
                raise ValueError(f"could not parse a Drive file id out of {url}")
            tmp_path = abs_path(f"{TMP_DIR}/{file_id}.png")
            if not os.path.exists(tmp_path):
                download_image_gdrive(file_id, tmp_path)
            image = Image.open(tmp_path)
        else:
            response = http_get(url, timeout=15, retries=2)
            image = Image.open(BytesIO(response.content))

        image = image.convert("RGB")  # ensure compatibility for JPG/PNG/etc
        if image.size[0] >= size[0] and image.size[1] >= size[1]:
            image = image.resize(size, Image.LANCZOS)

        os.makedirs(os.path.dirname(abs_path(output_path)), exist_ok=True)
        image.save(abs_path(output_path))
        print(f"  saved photo {output_path}")
        return output_path

    except Exception as error:
        print(f"  photo failed ({url}): {error}")
        return DEFAULT_PHOTO

    finally:
        if tmp_path is not None and os.path.exists(tmp_path):
            os.remove(tmp_path)


def download_sheet_csv(output_path=CSV_PATH):
    """Grab the form-responses tab as CSV."""
    response = http_get(f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export",
                        params={"format": "csv", "gid": GID})

    os.makedirs(os.path.dirname(abs_path(output_path)), exist_ok=True)
    with open(abs_path(output_path), "wb") as fout:
        fout.write(response.content)

    print(f"Downloaded sheet to {output_path}")
    return output_path


# Politeness throttle: never fire API calls faster than this, so a long refresh
# does not trip a rate limit.
# Applies to the HTTP helpers here (sheet download, photo fetches). Scholar
# lookups are paced separately and far more slowly in scholar.py.
MIN_REQUEST_INTERVAL = 1.0
# Never park on a server-supplied Retry-After for longer than this; some APIs
# answer a burst with "come back in an hour", which would hang the run.
MAX_BACKOFF_SECONDS = 60
_last_request_at = [0.0]


def _throttle():
    elapsed = time.time() - _last_request_at[0]
    if elapsed < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - elapsed)
    _last_request_at[0] = time.time()


def http_get(url, params=None, timeout=30, retries=5, headers=None):
    """GET with throttling and exponential backoff on rate limits and hiccups."""
    request_headers = {"User-Agent": "egyptians-in-cs-directory/1.0"}
    request_headers.update(headers or {})

    for attempt in range(retries):
        _throttle()
        try:
            response = requests.get(url, params=params, timeout=timeout,
                                    headers=request_headers)
            if response.status_code in (429, 500, 502, 503, 504):
                # A Retry-After header is the server telling us exactly how long to wait.
                wait = response.headers.get("Retry-After")
                raise RateLimited(f"{response.status_code} from {url}",
                                  float(wait) if wait and wait.isdigit() else None)
            response.raise_for_status()
            return response
        except Exception as error:
            if attempt == retries - 1:
                raise
            delay = min(getattr(error, "retry_after", None) or 2 ** attempt,
                        MAX_BACKOFF_SECONDS)
            print(f"  retrying in {delay:.0f}s ({error})")
            time.sleep(delay)
