# Trace the Word

A letter-tracing game for 5–6 year olds, tuned for iPad Safari (finger or Apple Pencil).
Pick a category, hear the word, and trace its letters in order. Letters turn solid as
they are finished; points are awarded per letter and per word.

Live at https://tracer.jeremyfrisch.org

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into ./out
npm run lint
```

## How it plays

| Button | What it does |
| --- | --- |
| ⬅️ Back | Return to the category picker |
| 🔊 Say it | Speak the word again |
| ↩️ Undo | Erase the ink on the letter being traced and try it again. Finished letters keep their ink. Disabled when there is nothing to undo |
| 🔄 Start Over | Erase all ink and go back to the first letter |
| ✅ Check | Celebrates if the word is done, otherwise flashes and says which letter is next |
| ⚙️ Settings | Hold for 2 seconds (keeps small children out). Corridor width, completion threshold, speech, scores |

## Code map

- `src/app/` – page shell, global CSS tokens (see `docs/DESIGN.md`)
- `src/components/` – `GameScreen` (layout + buttons), `TraceArea` (SVG canvas, ink, undo handle), `CategoryPicker`, `SettingsDrawer`, `EmojiExplosion`, `LetterGlyph`
- `src/hooks/` – `useDrawing` (pointer/touch ink, tags strokes by letter), `useCoverageTracking` (per-letter coverage and progression), `useLetterPaths`, `useSpeech`, `useWordQueue`, `useSettings`
- `src/lib/glyphs.ts` – A–Z block-letter paths; `src/data/categories.ts` – word lists
- `tracer_game_instructions.md` – original product brief

## Docs

- [`docs/DESIGN.md`](docs/DESIGN.md) – layout (why nothing clips on iPad Safari), tokens, button conventions
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) – Cloudflare Workers hosting and how to deploy
