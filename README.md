# 🔮 BattleScry

**Interactive D&D Battlemap Editor for Avrae & OTFBM**

BattleScry is a web-based GUI tool that lets Dungeon Masters visually edit battlemaps from [Avrae](https://avrae.io/) combat encounters. Move tokens, edit overlays, and paste the changes back into Discord — no manual coordinate math required.

## ✨ Features

### Token Management
- **Drag & drop** tokens with grid snapping
- **Resize, recolor, rename** via properties panel
- **Token images** via OTFBM shortcodes
- **Pie chart stacking** for tokens sharing a cell
- **Remove/Place** tokens (unplaced combatant tracking)
- Supports all D&D sizes: Tiny through Gargantuan

### Overlay System
- **All 6 OTFBM overlay types**: circle, circletop, circlecorner, square, squaretop, cone, line, arrow
- **Visual editing** with resize handles, rotate handles, drag endpoints
- **Overlay/Underlay** toggle
- **Full targeting system**:
  - `{targ}` — dynamic start point following attached token
  - `{aim}` with `|stick` — dynamic end point tracking aim target
  - Attach to any combatant (placed or unplaced like DM)
  - Smart validation and error handling
- **Stable overlay numbering** that doesn't shift when overlays are reassigned
- Per-target grouping with automatic cleanup commands

### Smart Command Generation
- **`!bscry apply` round-trip** — one paste applies all changes:
  - Token moves via `set_note()` (bypasses `-t` conflicts)
  - Overlay changes via note reconstruction
  - Auto map refresh via embedded OTFBM image
  - Change summary in Discord embed
- **Diff-only payloads** — only changed fields are sent, alias merges with live notes
- **Quoted names** for multi-word combatant safety
- 10 overlay limit tracking with warnings

### Map Display
- Background image with auto-zoom (Fit to Width / View Full Map)
- Grid overlay with configurable opacity
- Coordinate labels (A1, B2, etc.)
- Dark mode
- Zoom controls (25% increments, 10%–300%)
- Pixel-accurate tooltips showing objects under cursor

### UI
- **Sidebar** with collapsible token/overlay/unplaced groups
- **Sort** tokens by color or A-Z, overlays by target or shape
- **Properties panel** with live editing (no Apply button)
- **Compact info line** (🛈) describing overlay state in plain English
- **Clickable links** between tokens and their attached overlays
- **Undo** (Ctrl+Z, 30 levels) and Revert All
- **Mobile support** — touch drag, pinch zoom, larger touch targets, sidebar toggle

## 🚀 Getting Started

### For DMs (Discord Setup)

1. **Install the `!bscry` alias** on the [Avrae Dashboard](https://avrae.io/dashboard/aliases)
   - Copy the alias code from `bscry_alias.py`
   - Create a new alias named `bscry`

2. **Run `!bscry` in Discord** during active combat
   - Click the link in the embed to open BattleScry
   - Or copy the data string for local testing

3. **Make your changes** in BattleScry
   - Drag tokens, edit overlays, adjust properties

4. **Copy the `!bscry apply` command** and paste in Discord
   - Notes update automatically via `set_note()`
   - Map refreshes in the embed response
   - Change summary shows what was modified

### For Local Testing

Open `index.html` in Chrome. A pre-populated test combat loads automatically. Paste any data string from `!bscry` into the input field to load a real combat.

## 📋 Data Flow

```
Discord                    Browser                    Discord
┌──────────┐              ┌──────────┐              ┌──────────┐
│ !bscry   │──── link ───→│BattleScry│──── apply ──→│ !bscry   │
│          │              │          │              │  apply   │
│ Reads:   │              │ Visual   │              │          │
│ • Combat │              │ editing  │              │ Writes:  │
│ • Notes  │              │ • Drag   │              │ • Notes  │
│ • Map    │              │ • Resize │              │ • Map    │
│ • Tokens │              │ • Props  │              │ • Embed  │
└──────────┘              └──────────┘              └──────────┘
```

## ⚠️ Known Limitations

- **One `!map` command per paste** — OTFBM confuses `-t` targets when multiple overlay targets are in the same command. BattleScry bypasses this via `set_note()`.
- **`-aim` resolves before moves** — if an overlay aims at a token that's also moving, the aim resolves to the old position. Self-corrects on next `!map` call. The `set_note()` approach mitigates this.
- **10 overlay maximum** — OTFBM hard limit across the entire map.
- **Custom tokens require grid ≥ 40px** — grid sizes below c40 won't display token images.
- **Discord 2000 character limit** — `!bscry apply` sends only changed fields to stay under the limit.

## 🛠️ Technical Details

- **Single HTML file** — no dependencies, no build step
- **SVG rendering** with custom element creation
- **Touch events** bridged to mouse handlers for mobile support
- **Avrae Aliasing API** — uses `SimpleCombatant.set_note()` for note manipulation
- **Map library** (`43a980ab-fcae-4baa-9d66-260b2b0d8672`) for OTFBM URL generation

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 💜 Support

If BattleScry saves you time at the table, consider buying me a coffee!

---

*Built for the Avalor West Marches D&D community and the broader Avrae ecosystem.*
