# Researcher directory pipeline

Everything runs through one command, from `src/`:

```bash
python3 scripts/pipeline.py <command>
```

| command | what it does | writes |
| --- | --- | --- |
| `status` | health check: counts, duplicates, stale metrics, missing photos | nothing |
| `fetch` | downloads the form responses and turns new rows into proposals | `assets/review.json` |
| `review` | prints the pending proposals and their warnings | nothing |
| `apply` | merges the proposals into the directory | `assets/researchers_en.json` |
| `refresh` | re-reads h-index and citations from Google Scholar, stalest first | `assets/researchers_en.json` |

`scripts/update_researchers.sh` walks the first three steps in order.

## The normal run

```bash
python3 scripts/pipeline.py fetch          # proposals -> assets/review.json
python3 scripts/pipeline.py review         # read them
                                           # edit "action" in review.json if needed
python3 scripts/pipeline.py apply
python3 scripts/pipeline.py refresh --dry-run
python3 scripts/pipeline.py refresh
```

`fetch` never touches `researchers_en.json`. Each proposal in `review.json` carries an
`action` of `add`, `update` or `skip` plus the warnings behind it; change the action
by hand to overrule the default. `apply` acts on whatever the file says.

## Why you no longer bump a date

`assets/pipeline_state.json` records the timestamp of every submission the pipeline
has handled, so `fetch` only ever proposes genuinely new rows and re-running any step
is a no-op. `fetch --all` re-reads the whole sheet if you ever need it.

## What fetch flags for you

* honorifics stripped from a name (`Dr. Hatem Keshk` → `Hatem Keshk`)
* someone already in the directory, or submitted twice in the same batch
* an update naming a researcher who does not exist
* a missing photo, affiliation or Scholar link
* a Scholar profile link with no `user=` id in it
* an h-index below `HINDEX_THRESHOLD` (defaults the row to `skip`, overridable)

## Metrics come from Google Scholar, a few at a time

Scholar has no API and blocks bulk access — a pass over all 291 researchers fails
on more than half of them. So `refresh` takes only the **stalest 25** entries per run,
waits 3–8 seconds between lookups, writes after each one, and stops entirely once
Scholar refuses three lookups in a row.

```bash
python3 scripts/pipeline.py refresh --dry-run     # see what would change
python3 scripts/pipeline.py refresh               # the 25 stalest
python3 scripts/pipeline.py refresh --limit 40    # a bigger bite
python3 scripts/pipeline.py refresh --photos      # also pull Scholar profile photos
```

Run it regularly rather than all at once: at 25 a day the whole directory stays under
a month old. `status` reports how many are stale. Being blocked is not a failure to
push through — everything already fetched is saved, and the run picks up where it
left off next time.

Alongside h-index and citations, a refresh fills in an affiliation, website or
interests **only when the directory has none** — a submitted value always wins.

New submissions are gated the same way: `fetch` reads each new researcher's h-index
from their Scholar profile and defaults anyone below `HINDEX_THRESHOLD` (5) to `skip`,
which you can override in `review.json`.

Two rules are absolute, because the directory can only carry researchers it can verify
and keep current:

* **A Google Scholar profile link with a `user=` id is what `refresh` needs.** A
  submission without one is flagged in the review file but not rejected — a few
  prominent researchers are in the directory on a Semantic Scholar or ResearchGate
  link instead. Their numbers are frozen at whatever was entered, since `refresh`
  skips them; `status` counts them as `no Scholar link`.
* **A photo that is not on disk falls back to `default.jpg`.** `status` reports
  `photo file missing`, which should always read 0.

`openalex.py` is an unused alternative implementation — see the note at the top of
that file for why the directory stayed on Scholar.

## Photos

Drive links need `token.json`, which expires roughly weekly while the OAuth client is
in Testing:

```bash
python3 scripts/download_token_gdrive.py
```

`fetch --no-photos` skips photo downloads entirely.

## Testing against a copy

`DIRECTORY_SRC` points every path at a different `src/`-shaped directory:

```bash
DIRECTORY_SRC=/tmp/sandbox python3 scripts/pipeline.py fetch --no-download
```

## Legacy scripts

`populate.py`, `check_new_submissions.py`, `merge_new_submissions.py` and
`google_scholar.py` are the previous pipeline, kept for reference only. Their headers
say what replaced them.
