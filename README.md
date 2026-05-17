# 🔮 BattleScry

**Interactive visual battlemap tool for Avrae + OTFBM.** Move tokens, edit overlays, and generate `!map` commands — powered by a single Discord alias.

BattleScry reads your active Avrae combat state and opens an interactive map in your browser. Drag tokens, resize and rotate overlays, then copy the `!map` command back to Discord. No more guessing coordinates.

---

## Features

- **One-command setup** — Run `!bscry` in Discord, click the link, map loads with everything
- **Full token support** — Positions, sizes (Tiny–Gargantuan), colors, heights, pie-chart stacking for overlapping tokens
- **Overlay editing** — Circle, square, cone, line, arrow overlays with drag-to-resize and rotate handles
- **Locked overlays** — `{targ}` overlays follow their attached token when moved
- **Smart color detection** — PCs default blue, monsters default red, explicit colors preserved
- **Multi-select** — Shift-click, marquee selection, popup picker for stacked objects
- **Command generation** — Only outputs changed attributes, ready to paste into Discord
- **Map settings auto-detected** — Grid size, background image, and options pulled from the DM's combat effects

---

## Setup

### 1. Host BattleScry

The easiest option is GitHub Pages:

1. Fork or clone this repo
2. Go to **Settings** → **Pages**
3. Source: **Deploy from a branch** → **main** / **root**
4. Your URL will be: `https://YOURUSERNAME.github.io/battlescry/`

### 2. Create the Avrae Alias

Go to [avrae.io/dashboard/aliases](https://avrae.io/dashboard/aliases) and create an alias named `bscry`.

Paste this code into the editor:

```python
multiline <drac2>
c = combat()
if not c:
    return 'echo No active combat.'
bg = ""
gs = ""
opts = ""
dm = c.get_combatant("DM")
if dm:
    for e in dm.effects:
        if e.name == "map" and e.attacks:
            txt = str(e.attacks)
            si = txt.find("Size: ")
            if si > -1:
                se = txt.find(" ~", si)
                gs = txt[si+6:se].strip() if se > si else ""
            bi = txt.find("Background: ")
            if bi > -1:
                be = txt.find(" ~", bi)
                if be < bi:
                    be = txt.find("'", bi+12)
                bg = txt[bi+12:be].strip() if be > bi else ""
            oi = txt.find("Options: ")
            if oi > -1:
                oe = txt.find("'", oi)
                opts = txt[oi+9:oe].strip() if oe > oi else ""
toks = []
ovs = []
for x in c.combatants:
    nm = x.name
    nt = str(x.note) if x.note else ""
    if nm == "DM" or nm == "Map" or nm == "Lair":
        if "Overlay: " in nt:
            ov = nt[nt.find("Overlay: ")+9:].strip()
            ovs.append(nm.replace(" ","_") + "~" + ov)
        continue
    fields = nt.split(" | ")
    loc = ""
    ht = "0"
    sz = ""
    cl = ""
    ov = ""
    for f in fields:
        f = f.strip()
        if f.startswith("Location: "):
            loc = f[10:].strip()
        if f.startswith("Height: "):
            ht = f[8:].split(" ")[0]
        if f.startswith("Size: "):
            sz = f[6:7]
        if f.startswith("Color: "):
            cl = f[7:].split(" ")[0]
        if f.startswith("Overlay: "):
            ov = f[9:].strip()
        if "Overlay: " in f and not f.startswith("Overlay"):
            ov = f[f.find("Overlay: ")+9:].strip()
    if not cl:
        cl = "r" if x.monster_name else "b"
    sn = nm.replace(" ", "_")
    if loc:
        toks.append(sn + "|" + loc + "|" + (sz if sz else "M") + "|" + cl + "|" + ht)
        if ov:
            ovs.append(sn + "~" + ov)
parts = []
if gs:
    parts.append("g=" + gs)
if opts:
    parts.append("o=" + opts)
if bg:
    parts.append("bg=" + bg)
if toks:
    parts.append("t=" + ";".join(toks))
if ovs:
    parts.append("ov=" + ";".join(ovs))
data = "&".join(parts)
TOOL = "https://YOURUSERNAME.github.io/battlescry/"
url = TOOL + "#" + data
tc = str(len(toks))
oc = str(len(ovs))
return 'embed -title "🔮 BattleScry" -url "' + url + '" -desc "' + tc + ' tokens, ' + oc + ' overlays\nClick the title to open BattleScry." -f "Or copy data string|`' + data[:800] + '`" -color 0xff6600'
</drac2>
```

> **Important:** Replace `YOURUSERNAME` in the `TOOL` variable with your actual GitHub username.

### 3. Done!

During any active combat, run `!bscry` in Discord. Click the embed title to open the interactive map.

---

## Usage

### Basic Workflow

1. **`!bscry`** in Discord during combat
2. Click the **🔮 BattleScry** link in the embed
3. Map opens with all tokens, overlays, heights, and colors
4. **Drag tokens** to new positions
5. **Click overlays** to select, resize, or rotate them
6. **Copy the `!map` command** from the bottom bar
7. **Paste** back into Discord

### Controls

| Action | How |
|--------|-----|
| Move token | Click and drag |
| Select from stack | Click a pie chart or overlapping objects → pick from popup |
| Multi-select | Shift-click, or click and drag on empty space (marquee) |
| Resize circle/square | Select → drag gold corner handles |
| Resize cone | Select → drag gold handle at tip |
| Rotate cone/square | Select → drag orange ↻ handle |
| Edit overlay properties | Select → edit in sidebar → Apply Changes |
| Undo | Ctrl+Z |
| Revert | Select object → click Revert to Original |
| Zoom | − / + buttons in toolbar |

### Alternative Loading

You can also paste data directly into the input box:

- **OTFBM URL** — `https://otfbm.io/22x33/...`
- **Data string** — `g=22x33&o=dec100&bg=...&t=Tariq|K18|M|b|0;...`

---

## How It Works

The `!bscry` alias reads from the active Avrae combat:

- **Token positions** from combatant notes (`Location: K18`)
- **Heights** from combatant notes (`Height: 90`)
- **Sizes** from combatant notes (`Size: G (Gargantuan)`)
- **Colors** from combatant notes, or auto-detected (PCs = blue, monsters = red)
- **Overlays** from combatant notes (`Overlay: uc12y{targ}`)
- **Map settings** from the DM's "map" effect (grid size, background URL, options)

Everything is encoded into a URL hash and passed to the hosted tool.

---

## Overlay Types

| Type | Description | Handles |
|------|-------------|---------|
| `circle` | Centered on coordinate | 4-point resize |
| `circletop` | From top-left of cell | 4-point resize |
| `square` | From top-left coordinate | Corner resize + rotate |
| `cone` | Origin + aim direction | Tip resize + ↻ rotate |
| `line` | Start to end coordinate | — |
| `arrow` | Start to end with arrowhead | — |

---

## Requirements

- [Avrae](https://avrae.io/) bot in your Discord server
- [OTFBM](https://otfbm.io/) `!map` alias set up (for map backgrounds and token placement)
- Active combat via `!init begin`
- A browser (Chrome recommended)

---

## License

MIT License — do whatever you want with it, just credit the source.

---

## Credits

Built for the [Avalor](https://discord.gg/avalor) West Marches D&D community.

If you find this useful, star the repo ⭐ and share it with your server!
