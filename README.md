# 🔮 BattleScry

**Interactive visual battlemap tool for Avrae + OTFBM.** Move tokens, edit overlays, and generate `!map` commands — powered by a single Discord alias.

BattleScry reads your active Avrae combat state and opens an interactive map in your browser. Drag tokens, resize and rotate overlays, then copy the `!map` command back to Discord. No more guessing coordinates.

---

## Features

- **One-command setup** — Run `!bscry` in Discord, click the link, map loads with everything
- **Full token support** — Positions, sizes (Tiny–Gargantuan), colors, heights, pie-chart stacking for overlapping tokens
- **All 6 overlay types** — Circle, circletop, circlecorner, square, squaretop, cone, line, arrow — with drag-to-resize and rotate handles
- **Locked overlays** — `{targ}` overlays follow their attached token when moved
- **Pixel-accurate hit detection** — Tooltip and selection based on what's under your cursor, not grid cells
- **Z-order management** — Selected objects render on top of everything for easy interaction
- **Combatant management** — Place/remove combatants from the map, including DM, Lair, and custom objects
- **Smart color detection** — PCs default blue, monsters default red, explicit colors preserved
- **Multi-select** — Shift-click, marquee selection, popup picker for stacked objects
- **Command generation** — Only outputs changed attributes, includes `!i note` commands for unplaced tokens
- **Error handling** — Invalid input format popup, broken image detection

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

See the alias code in the [Wiki](../../wiki) or copy it from below. Replace `YOURUSERNAME` with your GitHub username.

### 3. Done!

During any active combat, run `!bscry` in Discord. Click the link in the embed to open the interactive map.

---

## Usage

### Basic Workflow

1. **`!bscry`** in Discord during combat
2. Click the **🗺️ Open Current Map in BattleScry** link
3. Map opens with all tokens, overlays, heights, and colors
4. **Drag tokens** to new positions
5. **Click overlays** to select, resize, or rotate them
6. **Copy the `!map` command** from the bottom bar
7. **Paste** back into Discord

### Controls

| Action | How |
|--------|-----|
| Move token | Click and drag |
| Select from stack | Click overlapping objects → pick from popup |
| Multi-select | Shift-click, or drag on empty space (marquee) |
| Resize circle/square | Select → drag gold handles on edges |
| Resize cone | Select → drag gold handle at tip |
| Rotate cone/square | Select → drag orange ↻ handle |
| Move line/arrow endpoints | Select → drag green/orange handles |
| Edit properties | Select → edit in sidebar → Apply Changes |
| Place combatant | Expand Unplaced → click Place button |
| Remove from map | Select token → Remove from Map button |
| Undo | Ctrl+Z (30 levels) |
| Revert | Select → Revert to Original |
| Zoom | − / + buttons in toolbar |

---

## Overlay Types

| Type | Description | Handles |
|------|-------------|---------|
| `circle` | Centered on cell center | 4-point cardinal resize |
| `circletop` | From top-left of cell | 4-point cardinal resize |
| `circlecorner` | Centered on grid corner | 4-point cardinal resize |
| `square` / `squaretop` | Axis-aligned or aimed | 4-point side resize + ↻ rotate |
| `cone` | Origin + aim direction | Tip resize + ↻ rotate |
| `line` | Start to end, variable width | Start/end handles + width handles |
| `arrow` | Start to end with arrowhead | Start/end handles |

---

## Requirements

- [Avrae](https://avrae.io/) bot in your Discord server
- [OTFBM](https://otfbm.io/) `!map` alias set up
- Active combat via `!init begin`
- A browser (Chrome recommended)

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Credits

Built for the [Avalor](https://discord.gg/avalor) West Marches D&D community.

If you find this useful, star the repo ⭐ and share it with your server!
