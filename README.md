# STASH

KROWE the crow rescues half-finished side projects. Drop in your notes and STASH finds the ideas you started and dropped, works out why from your own words, finds the thread that keeps coming back, checks the live web for what has changed since, and gives each idea a verdict (REVIVE NOW, NOT YET or STILL DEAD) with receipts.

> Placeholder README for the hackathon. Setup, architecture and demo notes to come.

## Phase 1

- Drop zone and paste box (.txt, .md, .json parsed in the browser), plus a labelled example pile
- Live sweep: Nebius Token Factory models (config in `src/lib/models.config.ts`) and Tavily web search
- Server-side quote and link verification with a visible tally
- Guest sessions with caps: 3 sweeps a day, 30,000 characters, 8 ideas
- "How STASH checks itself" page and an admin-only API test page

Secrets required: `NEBIUS_API_KEY`, `TAVILY_API_KEY` (optional `NEBIUS_BASE_URL`).

## License

MIT, see `LICENSE`.
