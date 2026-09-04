#!/usr/bin/env bash
# Deploy the site.
#
# Publishing is handled by .github/workflows/deploy.yml: any push to main gets
# built and pushed to GitHub Pages. So deploying is really "check, commit, push"
# - and this script checks first, because a broken build otherwise surfaces
# minutes later in Actions, with the bad commit already public.
#
#   src/scripts/deploy.sh              check, build, commit and push
#   src/scripts/deploy.sh --check      run the checks and build, change nothing
#   src/scripts/deploy.sh -m "msg"     use a specific commit message
#
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo root

CHECK_ONLY=false
MESSAGE="Update researcher directory"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=true; shift ;;
    -m|--message) MESSAGE="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "1/5  Data sanity check"
(cd src && python3 scripts/pipeline.py status)

python3 - <<'PY'
import json, os, subprocess, sys

os.chdir('src')
problems = []

for path in ['assets/researchers_en.json', 'assets/researchers_ar.json',
             'assets/locations.json']:
    try:
        data = json.load(open(path, encoding='utf-8'))
        print(f"  {path}: ok ({len(data)} entries)")
    except Exception as error:
        problems.append(f"{path} is not valid JSON: {error}")

researchers = json.load(open('assets/researchers_en.json', encoding='utf-8'))
required = ['name', 'affiliation', 'hindex', 'citedby', 'photo', 'scholar']
for entry in researchers:
    missing = [key for key in required if key not in entry]
    if missing:
        problems.append(f"{entry.get('name', '?')} is missing {missing}")
    if not os.path.exists(entry['photo'].lstrip('./')):
        problems.append(f"{entry['name']}: photo file {entry['photo']} is missing")

names = [r['name'].strip() for r in researchers]
for name in sorted({n for n in names if names.count(n) > 1}):
    problems.append(f"duplicate entry: {name}")

# Nothing carrying submitters' personal data may reach the published bundle.
os.chdir('..')
for leaked in ['src/assets/researchers.csv', 'src/assets/review.json',
               'src/assets/researchers_new.json', 'src/assets/researchers_update.json']:
    tracked = subprocess.run(['git', 'ls-files', '--error-unmatch', leaked],
                             capture_output=True).returncode == 0
    if tracked:
        problems.append(f"{leaked} is tracked by git but holds raw form data")

if problems:
    print("\n  PROBLEMS:")
    for problem in problems:
        print(f"   - {problem}")
    sys.exit(1)
print("  no problems found")
PY

step "2/5  Production build"
npx ng build --configuration production --base-href / >/dev/null
echo "  built to dist/egyptians-in-ai"

if [[ "$CHECK_ONLY" == true ]]; then
  step "Done (--check): nothing committed or pushed"
  exit 0
fi

step "3/5  Changes to publish"
git status --short
if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "  working tree is clean, nothing to deploy"
  exit 0
fi

step "4/5  Commit"
git add -A
git commit -m "$MESSAGE"

step "5/5  Push to main (triggers the Pages workflow)"
git push origin main

printf '\n\033[1mPushed.\033[0m Watch the deploy:\n'
echo "  https://github.com/egyptians-in-cs/egyptians-in-cs.github.io/actions"
