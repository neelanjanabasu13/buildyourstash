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
- Model calls go directly to Nebius Token Factory from server functions (never the Lovable AI gateway); model ids and base URLs live only in `src/lib/models.config.ts`.
- The sweep is split into small server functions (`src/lib/stash.functions.ts`) orchestrated from the client (`src/hooks/use-sweep.ts`) because server CPU per request is tiny.
- Quote verification always reads the pile from the `sweeps` row on the server, never from client input, so receipts cannot be forged.
- Sweep caps are enforced in the `start_sweep` SQL function; the client display of limits is only informational.
- No seeded or canned results anywhere; the example pile is input only.
