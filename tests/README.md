# BattleScry tests

Browser tests that load `index.html` in headless Chromium (Playwright) and check the things that have broken before.

Run everything:

    npm i playwright
    pip install pillow numpy
    tests/run.sh

What each script covers:

| Script | Covers |
|---|---|
| `t.js`, `t2.js` | cell-size limits (20 to 100px), saved-default map baseline |
| `t3.js` | `?test=1` flag and the version string |
| `ov.js` | overlay Delete, Revert and list X buttons; no-map link baseline |
| `nm.js` | links with no map attached, bootstrap links, Tokens tab default |
| `lay.js` | monster colour, saved token auto-apply, overlay origin, drag from list |
| `pc.js` | pending-changes summary and Copy for Discord |
| `up.js`, `rt.js` | upload conversion: resize both ways, then re-detect on the output |
| `gd.js` | grid detection against synthetic maps with known grids (`gen_maps.py`) |
| `pick.js` | Map tab layout dropdown for pasted image URLs |
| `enh.js` | Enhance button against a simulated Worker |
| `tok.js` | Token image upload: framing window, 320px output, limits, URL fallback |
| `w.js`, `ux.js` | welcome dialog on phones; phone and desktop screenshots into `shots/` |

`maps/` and `shots/` are generated and ignored by git.
