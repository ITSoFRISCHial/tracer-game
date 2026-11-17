# Trace the Word: Design notes

Target: 5-6 year olds on an iPad (Safari, finger or Apple Pencil). Everything
below serves two goals: nothing important is ever clipped, and a child who
cannot read well can still tell every button apart.

## 1. Layout system (no clipping on iPad Safari)

The page never scrolls. The chain is:

1. `<main class="app-height flex flex-col overflow-hidden safe-area-inset">`
   (`src/app/page.tsx`). `.app-height` is `height: 100vh; height: 100dvh`
   (`globals.css`). On iPad Safari `100vh` includes the area behind the browser
   toolbar, which pushed the bottom buttons off screen. `100dvh` is the
   currently visible viewport and follows the toolbars as they show or hide.
   The `100vh` line is only a fallback for browsers without `dvh`.
2. `GameScreen` is `flex-1 min-h-0 flex flex-col overflow-hidden` with four rows:

   | Row | Sizing | Content |
   |---|---|---|
   | Header | `shrink-0` | Back, category chip, star and trophy score, Settings |
   | Word row | `shrink-0` | emoji, WORD, "Say it", letter progress pills |
   | Trace area | `flex-1 min-h-0` | the only flexible block |
   | Action bar | `shrink-0` | Undo, Start Over, Check |

   Only the trace area flexes. `min-h-0` is what lets a flex child shrink below
   its content height; without it the SVG would force the page taller than the
   viewport. The word row text uses `clamp(..., vh, ...)` font sizes so it also
   shrinks on short viewports.
3. `TraceArea` renders an SVG with a `viewBox` and
   `preserveAspectRatio="xMidYMid meet"`. The word scales to the biggest size
   that fits the box, so the trace area stays as large as the other rows allow.
   Pointer coordinates are mapped through the SVG screen CTM (`useDrawing`), so
   scaling never offsets the ink.
4. Under `@media (max-height: 720px)` the stacked icon-over-label buttons switch
   to icon-beside-label (`.btn-stack` in `globals.css`). That saves about 20px
   per row, so a Safari window with toolbars (about 650px tall) still shows
   everything.
5. `safe-area-inset` pads `<main>` with `env(safe-area-inset-*)` for notched
   devices; `viewportFit: cover` is set in `layout.tsx`.

The Settings button is no longer absolutely positioned. `page.tsx` builds it and
passes it as `settingsSlot` to `CategoryPicker` and `GameScreen`, which place it
inside their header rows. That removed the overlap with the score and header.

Verified (Playwright/Chromium, action bar bottom edge vs viewport height):
1024x768, 768x1024, 1180x820, 834x1194 and 1024x650 all show the full action
bar with no page scroll (`scrollHeight === innerHeight`).

## 2. Tokens

Defined once in `src/app/globals.css` under `@theme`, so they are both CSS
variables and Tailwind utilities (`bg-paper`, `text-ink`, `text-ink-soft`,
`border-line`, `text-btn-check`, ...).

| Token | Value | Use |
|---|---|---|
| `paper` | `#FFF6E5` | page background (with a faint dot grid) |
| `ink` | `#23305A` | text, completed letters (12:1 on paper) |
| `ink-soft` | `#4B5782` | secondary text, upcoming letters (6.6:1) |
| `line` | `#E7D9BB` | borders, baseline guide |
| `btn-say` | `#C93C4A` | Say it (white text 5.3:1) |
| `btn-undo` | `#FFC53D` | Undo (ink text 8:1) |
| `btn-start` | `#2B6CDF` | Start Over, ink stroke (white text 5.2:1) |
| `btn-check` | `#178246` | Check (white text 5.3:1) |
| `btn-quiet` | `#FFFFFF` | Back, Settings, Close (ink text) |
| `*-lip` | darker shade | the raised "lip" under each button |

Typography: Open Sans via `next/font` (`--font-open-sans`), weights 400, 600,
700 and 800. Headings and button labels use 800. Numbers use tabular figures.
The word uses wide letter spacing (`tracking-[0.12em]`) for readability.

## 3. Buttons: icon plus label

Every button shows an emoji icon (`aria-hidden`) and a one or two word label.
Never an icon alone and never a label alone. Minimum size is 56x56px (`.btn`).

| Button | Icon | Label | Variant |
|---|---|---|---|
| Back | ⬅️ | Back | `btn-quiet` |
| Say the word | 🔊 | Say it | `btn-say` |
| Undo | ↩️ | Undo | `btn-undo` (disabled when nothing to undo) |
| Start over | 🔄 | Start Over | `btn-start` |
| Check | ✅ | Check | `btn-check` |
| Settings | ⚙️ | Settings (hold 2 s) | `btn-quiet` |
| Close settings | ✖️ | Close | `btn-quiet` |
| Category cards | the category emoji | category name | `.card-btn` |

Conventions:
- `.btn` + a color variant + optionally `.btn-stack` (icon above label).
- Chunky look: a solid `box-shadow` "lip" (5px). On `:active` the button moves
  down by the lip height and the shadow collapses, which is the press feedback.
- Disabled buttons drop to 45% opacity and lose the press animation.
- Visible `:focus-visible` outline (4px ink) for keyboard and switch users.
- `aria-label` gives the long explanation ("Undo: erase this letter and try it
  again"); the visible label stays short.

## 4. UX tweaks

- Header: Back, category chip and score on one row. Score uses icons
  (⭐ letters finished, 🏆 words finished) instead of "Letter Points: n".
- Progress: one pill per letter instead of "Tracing: X 45%". Done pills are green
  with a check, the current pill fills as you trace, upcoming pills are empty.
  Exposed to assistive tech as one `role="img"` with a text description.
- Category picker: four large colored cards in a 2x2 grid that stretches to the
  available height (cards never run off a short screen).
- Debug corridor circles are hidden. A new setting, "Show tracing zone"
  (`showCorridor`, default off, in the Settings drawer) turns them back on.
- Settings button shows a fill sweeping across it while held; it is a 2 second
  hold gate so children cannot open it by accident.
- Settings drawer: modal dialog semantics, Escape to close, sliders tied to
  labels, 28px checkboxes, icon+label Close/Reset buttons, scrolls on short screens.
- Warm paper background, white worksheet-style trace card, yellow halo behind the
  active letter (replaced the faint green), bolder blue ink.
- `prefers-reduced-motion: reduce` collapses all animations and transitions
  (global rule in `globals.css`). The celebration then shows the big emoji without
  the flying particles.

## 5. Bug fixes made while here

- `EmojiExplosion`: the completion timer restarted whenever the parent
  re-rendered (the inline `onComplete` was an effect dependency). It now reads
  the callback through a ref. Randomness moved into lazy `useState` initializers
  (also clears the `react-hooks/purity` lint errors).
- `SettingsButton`: the animation loop referenced itself inside `useCallback`
  (`react-hooks/immutability`); it now reschedules through a ref. Context menu
  on long press is suppressed.

## 6. Known remaining items

- Lint errors left in code outside this task's scope (hooks): `useDrawing.ts`
  writes refs during render (`react-hooks/refs`), `useCoverageTracking.ts:97`
  memoization, `useSettings.tsx` and `GameScreen.tsx` call `setState` in an effect.
  They work today; fixing them touches hook behavior.
- The viewport disables pinch zoom (needed for drawing) which is an
  accessibility trade-off.
- The Check button's red flash timeout is not cleaned up on unmount (harmless).
- Reset All Scores still uses `window.confirm`.
