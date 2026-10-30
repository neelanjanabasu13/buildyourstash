# STASH

Every cool idea you ever had starts building itself. Stash a brainwave and KROWE the crow researches its live context and makes editable pitch, landing-page copy, first steps and outreach drafts. BUILD NOW, WATCH and PARK are evidence-backed recommendations, not judgments of the user's past. Guest-first workshop, bulk imports, verified quotes and live radar are real; drafts are never sent or published, and radar runs while the workshop is open or when you return.

## Scope B

Capture creates a persistent owner-scoped job immediately. The browser advances one short server step at a time, with database leases, bounded attempts, real-time progress and saved stage outputs. Retry and Resume work continue unfinished jobs without restarting completed stages. Closing the tab pauses subsequent calls; completed work remains saved.

Browser Web Speech is the primary capture action where supported, with editable text fallback. Existing file, public GitHub and ChatGPT imports join the same job.

The three labelled Example cards are completed real runs with stored sources and recorded step timings. Watch KROWE work is explicitly a cached replay, not a live research request.

BUILD NOW workbenches link to owner-scoped proposed landing pages at `/p/:id`. The drafts inbox contains generated text only; nothing is sent. Radar re-checks compare returned URLs/content and retain verdict history. Daily due checks run when the workshop is open or on return, and Re-check now runs live.

### Providers

All models use Nebius Token Factory directly, not the Lovable AI Gateway:

- Extraction: `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`
- Query planning, context and verdict: `nvidia/nemotron-3-super-120b-a12b`
- Draft kit: `nvidia/Nemotron-3-Ultra-550b-a55b`
- Default endpoint: `https://api.tokenfactory.nebius.com/v1/chat/completions`
- Optional US endpoint: `https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions`
- Model IDs, budgets and endpoints remain in `src/lib/models.config.ts`.
- Tavily uses `https://api.tavily.com/search`, basic depth, three model-generated recent queries per idea with four results each.

Exact case-sensitive quote substrings are checked server-side against stored notes and Tavily content. Unverifiable claims are dropped. A verified quote establishes what a source says, not that the source or AI interpretation is correct.

Protection: 3 captures per guest per rolling day, 30,000 characters and 8 ideas per capture, plus 500 aggregate calls per provider per UTC day. Existing output token caps remain in force. This is a call-count ceiling, not a guaranteed currency budget.

### Known limitations

Managed schedule tools and cron authentication are present, but scheduled callbacks have a short timeout and no documented durable continuation for these provider calls. No closed-browser processor or daily scheduled research has been enabled. Email needs a verified sending domain and a provider. PWA share capture and KROWE chat are not included. Actual spoken transcription needs testing with a microphone in a supported browser; microphone denial and typing fallback were verified. Hosting execution has not been verified or published.

## Phase 1

- Drop zone and paste box (.txt, .md, .json parsed in the browser), plus a labelled example pile
- Live sweep: Nebius Token Factory models (config in `src/lib/models.config.ts`) and Tavily web search
- Server-side quote and link verification with a visible tally
- Guest sessions with caps: 3 sweeps a day, 30,000 characters, 8 ideas
- "How STASH checks itself" page and an admin-only API test page

Secrets required: `NEBIUS_API_KEY`, `TAVILY_API_KEY` (optional `NEBIUS_BASE_URL`).

## License

MIT, see `LICENSE`.
