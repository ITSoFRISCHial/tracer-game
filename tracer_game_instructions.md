You are Claude Code. Build a web app game for 5-year-olds: “Trace the Word”.

Tech + deploy
- Next.js (App Router) + TypeScript.
- Deploy: Cloudflare Workers (static export; originally Vercel). See docs/DEPLOYMENT.md.
- iPad Safari optimized (finger + Apple Pencil).
- Use Pointer Events. Disable page scroll/zoom gestures while drawing inside the trace area.

Core flow
1) Category Picker screen with 4 big buttons: Animals, Foods, Colors, Sight Words.
2) Game screen:
   - Top 50%: target word (UPPERCASE) in a clean sans serif (use Open Sans via next/font/google). Show an emoji next to the word for Animals/Foods/Colors.
   - Show score counters: Word Points, Letter Points.
   - “🔊 Say it” button: use browser speechSynthesis to say the full word.
   - On load of each word: auto-speak the word once.
   - Bottom 50%: trace area with dotted-outline letters for the whole word, large.

Word rules
- Max word length: 6 letters. Filter lists accordingly.
- Sight words: use Dolch 44 (hardcode list; filter to <=6 and uppercase).
- Animals/Foods/Colors: hardcode starter lists (50–100 each) WITH emoji per word; filter <=6; uppercase.
- Randomize without repeating until exhausted, then reshuffle.

Tracing UX
- Show the entire word’s dotted outlines at once.
- BUT letters must be completed in order (left to right).
  - Only the “current” letter is active; later letters are visible but locked.
  - If the kid draws on a locked letter, ignore ink and play a gentle “not yet” voice line.
- Each letter starts dotted; when completed, it turns solid black.
- Scoring:
  - +1 Letter Point immediately when a letter completes.
  - +1 Word Point when the whole word completes.
  - After word completion: quick celebration (tiny confetti or bounce), then load next word after ~900ms.

No LLM. Must detect completion locally.

Letter shapes (Option B: pre-baked glyph paths)
- Provide SVG path data for A–Z as simple “block print” glyphs (single-stroke style is OK; doesn’t need cursive).
- Store these in a file like /lib/glyphs.ts as a map { "A": { path: "...", viewBox: "0 0 ..."}, ... }.
- For rendering a word: layout each letter glyph horizontally with consistent baseline and spacing.
- Each letter should have:
  - dotted outline path (stroke-dasharray)
  - solid completed path (stroke solid black)
  - a “corridor” (thick stroke around the path) used for hit-testing / clipping

Completion detection (easy mode)
- Corridor width: constant, e.g. 42px on iPad, scale with viewport (use clamp).
- Discretize each letter’s path length into N segments (e.g. N=120).
- While drawing, sample pointer points (throttle, e.g. every 12ms).
- Only accept drawing points if they are inside the active letter’s corridor.
- For each accepted point:
  - Find nearest distance to the active letter’s path (approx ok).
  - If within corridor radius, mark the nearest segment index as covered.
- Completion threshold: 0.65 coverage (easy).
- Once threshold reached: mark letter complete, switch active letter to next.

Implementation guidance for geometry
- Use SVGPathElement.getTotalLength() and getPointAtLength() for discretization.
- For nearest-segment mapping: precompute an array of points along the path; find closest point index to the sampled pointer point (simple linear scan is OK at N~120; optimize if needed).
- Hit-testing corridor: treat as “within radius” of the closest path point (radius = corridorWidth/2). If > radius, reject point and do not render ink.

Rendering ink (constrained)
- Render the kid’s ink as an SVG polyline/path.
- Clip it to ONLY the active letter corridor (SVG clipPath or mask).
- When a letter completes, freeze that ink into that letter’s layer (so clearing doesn’t break completed letters unless user confirms clear).

Buttons
- Clear button: prompts “Are you sure you want to clear?” If yes, clear ink AND reset progress for the current word (letters return dotted).

Voice coach behavior (SpeechSynthesis)
- If the kid taps “Check” (add a big “✅ Check” button) and the word is NOT complete:
  - Flash the screen red briefly (200–300ms).
  - Speak: “You still need the letter {LETTER}. You’ve got this! {funny line}”
  - Funny line pool: 12–20 short kid-safe lines (e.g., “Pretend you’re a robot pencil!”, “That letter is hiding—go find it!”, “Zoom! Super tracer power!”).
- If the kid taps “Check” and the word IS complete:
  - Speak: “Awesome! You traced {WORD}!”
- Also, if the kid tries to draw on a locked future letter:
  - Speak: “Let’s do {CURRENT LETTER} first!” (no red flash)

Design constraints
- Large touch targets, minimal text.
- Keep everything responsive and locked to portrait iPad layout first.
- No accounts. Store scores optionally in localStorage.
- Include a simple Settings drawer (parent-only gate optional; if you include it, use a simple “hold for 2 seconds” gesture) to tune:
  - corridor width
  - threshold
  - speech on/off

Deliverables
- Working Next.js project with clear file structure.
- README: run locally + deploy to Vercel.
- Add comments “Dev Notes” explaining:
  - glyph path source / how to extend A–Z
  - coverage algorithm
  - how clipping works
  - performance notes for iPad

MVP scope
- Must ship with complete A–Z glyph paths, at least 10 words/category, full game loop working.
- Prioritize correctness + smooth iPad drawing over fancy visuals.