"""Reads gd.js output on stdin and fails if any synthetic map's detected cell size is off."""
import sys, json, re
lines = sys.stdin.read().split("\n"); bad = 0; n = 0
for i, l in enumerate(lines):
    m = re.match(r'^(\S+\.jpg) TRUTH (\{.*\})', l)
    if not m: continue
    truth = json.loads(m.group(2)); res = json.loads(lines[i + 1].strip()); found = (res.get("find") or {}).get("cell", 0); n += 1
    if abs(found - truth["cell"]) > 0.6:
        bad += 1; print("FAIL detect", m.group(1), "truth", truth["cell"], "found", found)
print("ok   grid detection %d/%d" % (n - bad, n)); sys.exit(1 if bad or not n else 0)
