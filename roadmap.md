# Live verification
- [x] Test Tavily and all three requested models, including regional fallback and JSON mode. All passed on the default URL, so fallbacks were unnecessary.
- [x] Check configuration and integration failures and run regression tests. No service failures; all 9 tests passed.
- [x] Run a real three-idea sweep and verify every stage and receipt tally. Completed and persisted in 29 seconds, with 15 pile quotes and 6 web quotes checked, none dropped.
- [x] Check publishing readiness and report any blockers. Preview flow, saved results, ownership policies, route metadata and existing build checks passed; not yet published.