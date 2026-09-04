#!/bin/bash
# Researcher directory update, start to finish. Run from src/.
#
# The steps are deliberately separate: fetch proposes, you review, apply
# commits. Nothing touches researchers_en.json until you run apply.
set -e

echo "== 1. what is the directory's state?"
python3 scripts/pipeline.py status

echo
echo "== 2. pull new form submissions into assets/review.json"
python3 scripts/pipeline.py fetch

echo
echo "== 3. read the proposals (edit \"action\" in assets/review.json to override)"
python3 scripts/pipeline.py review

echo
echo "Nothing has been written to the directory yet."
echo "When the proposals look right:"
echo "    python3 scripts/pipeline.py apply"
echo "    python3 scripts/pipeline.py refresh --dry-run   # preview metric changes"
echo "    python3 scripts/pipeline.py refresh             # write them"
