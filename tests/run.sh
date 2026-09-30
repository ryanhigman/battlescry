#!/usr/bin/env bash
# Runs the BattleScry browser tests against the local index.html.
# Needs: node, playwright (npm i playwright), python3 with Pillow and numpy.
# Usage: tests/run.sh            (set PW_CHROME to a Chromium binary if Playwright cannot find one)
set -e
cd "$(dirname "$0")"
mkdir -p maps shots
if [ ! -f maps/truth.json ]; then (cd maps && python3 ../gen_maps.py >/dev/null); fi
python3 -m http.server 8765 --directory .. >/dev/null 2>&1 &
SERVER=$!
sleep 1
fail=0
for t in t t2 t3 ov up nm lay pc enh w; do
  out=$(node $t.js 2>&1) || { echo "FAIL $t"; echo "$out" | tail -5; fail=1; continue; }
  if echo "$out" | grep -qi "pageerror\|Error:"; then echo "FAIL $t"; echo "$out" | tail -5; fail=1; else echo "ok   $t"; fi
done
# Grid detection must match the known cell size of every synthetic map.
node gd.js maps | python3 check_detect.py || fail=1
kill $SERVER 2>/dev/null || true
exit $fail
