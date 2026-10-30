<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Public workshop examples are read-only snapshots from completed real pipeline work, separated from owner ideas; guided cached replay uses recorded job timings and explicitly makes no live calls.
- Guest initialization caches only in-flight work, and staged client calls have deadlines with visible errors, so expired sessions and stalled providers cannot silently freeze capture.
- Radar plans three model-generated idea-specific queries server-side and persists the plan per claimed round; legacy database query keys are slots only, preserving caps without prescribing topics.
- KroweClip owns dual-format animation, viewport-lazy playback and reduced-motion posters; the home introduction is a once-per-page-visit UI sequence, independent of sweep orchestration.
- Model calls go directly to Nebius Token Factory from server functions (never the Lovable AI gateway); model ids and base URLs live only in `src/lib/models.config.ts`.
- Capture creates an owner-scoped workshop_jobs row immediately; each advanceWorkshopJob request leases one persisted step, so retry resumes authoritative saved outputs without repeating completed work. The browser drives subsequent requests; never claim closed-browser processing.
- Quote verification checks exact case-sensitive substrings in stored user words and Tavily content, never client-provided source text, so receipts cannot be forged.
- Sweep caps are enforced in the `start_sweep` SQL function; the client display of limits is only informational.
- No seeded or canned results anywhere; the example pile is input only.
- GitHub repos and ChatGPT exports are read and compacted in the browser (`src/lib/github.ts`, `src/lib/chatgpt-export.ts`); only the compacted text joins the pile, raw exports never reach the server.
- Brand art is loaded from `public/brand/<slot>.png` through `BrandImage`, which shows a neutral placeholder when a file is missing, so art can be swapped without code changes.
- KROWE's moving scenes are short clips served from the CDN as pointers in `src/assets`, placed only by `src/components/KroweClip.tsx`; each clip carries mp4 and webm copies because some browsers cannot decode either one alone, and the stills in `public/brand` stay as posters and as the no-motion fallback.
- Input, sweeping and results are views of the existing home route; keep PileInput mounted when hidden so the user's pile survives a sweep and can be reused without changing orchestration.
- FirstResultProvider shares the completed-result navigation reveal between home and the header; persist only this UI preference in browser storage after hydration, never use it as an authorization check.
- Museum exhibits reuse owner-scoped sweeps; server-only sweep_parts store verified stage outputs and saveSweep assembles from them rather than trusting client receipts, preserving provenance on reload.
- Generate editable first-work drafts for each researched brainwave, including low-risk creative sketches when sources are absent; factual recommendations require verified evidence, and WATCH/PARK drafts never claim launch viability.
- Normalize older saved verdicts at the workshop read boundary and retain source receipts without replaying interpretations of personal history; research only idea descriptions and external context.
- The home workshop feed and per-idea workbench reuse existing sweep storage and staged calls; do not generate or render cross-idea patterns, and date activity from saved completion timestamps rather than claiming old work happened today.
- Radar uses owner-checked server functions and SQL-claimed bounded query rounds, persisted in sweep_parts; browser-visible museum checks due exhibits serially, never pretends closed-browser monitoring is active. Signal verification is separate from creative action drafts, which are never sent or published.
- Provider calls reserve a database-counted aggregate daily budget before every attempt, including retries, so visitor identity resets cannot bypass key protection.
- Browser Web Speech capture converts speech to editable text and preserves typing fallback; it never uploads recorded audio.
- BUILD NOW pages render generated copy in an owner-checked /p/$id route and drafts inbox holds unsent text; neither surface claims a launched product or shares private guest data.
- Radar stores each verified verdict in sweep_parts history and compares returned source URLs/content with earlier rounds, so unchanged results do not earn a new-signal badge.
