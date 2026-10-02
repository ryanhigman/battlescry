#!/usr/bin/env bash
# Runs the BattleScry browser tests against the local index.html.
# Needs: node, playwright (npm i playwright), python3 with Pillow and numpy.
# Usage: tests/run.sh            (set PW_CHROME to a Chromium binary if Playwright cannot find one)
set -e
cd "$(dirname "$0")"
mkdir -p maps shots
if [ ! -f maps/truth.json ]; then (cd maps && python3 ../gen_maps.py >/dev/null); fi
if [ ! -f maps/sm_2100.jpg ]; then python3 -c "
from PIL import Image
import numpy as np
rng=np.random.default_rng(3)
for n in (256,1024,2100):
    a=rng.integers(60,140,(max(1,n//16),max(1,n//16),3)).astype('uint8')
    Image.fromarray(a).resize((n,n),Image.BICUBIC).save(f'maps/sm_{n}.jpg',quality=90)
"; fi
if [ ! -f "maps/Big-Map-100x140.jpg" ]; then python3 -c "
from PIL import Image
im=Image.open('maps/sm_1024.jpg')
im.resize((1100,850)).save('maps/Tavern-22x17.jpg',quality=85)
im.resize((1000,800)).save('maps/Cave 60x48.jpg',quality=85)
im.resize((1920,2688)).save('maps/Big-Map-100x140.jpg',quality=85)
"; fi
if [ ! -f maps/noise_2600.jpg ]; then python3 -c "
from PIL import Image
import numpy as np
Image.fromarray(np.random.default_rng(5).integers(0,255,(2600,2600,3)).astype('uint8')).save('maps/noise_2600.jpg',quality=80)
"; fi
python3 -m http.server 8765 --directory .. >/dev/null 2>&1 &
SERVER=$!
sleep 1
fail=0
for t in t t2 t3 ov up nm lay pc enh tok vw grp sc sm rh nmh w; do
  out=$(node $t.js 2>&1) || { echo "FAIL $t"; echo "$out" | tail -5; fail=1; continue; }
  if echo "$out" | grep -qi "pageerror\|Error:"; then echo "FAIL $t"; echo "$out" | tail -5; fail=1; else echo "ok   $t"; fi
done
# Grid detection must match the known cell size of every synthetic map.
node gd.js maps | python3 check_detect.py || fail=1
kill $SERVER 2>/dev/null || true
exit $fail
