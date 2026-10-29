# Brand slots

The app reads these files from this folder. Drop a new file with the same name
here and the app picks it up on the next load, no code change needed.

| File | Where it shows | Made from |
| --- | --- | --- |
| logo.png | header, top left | Stash-brand-logo.png (the full lockup: crow, STASH, tagline) |

The browser-tab icon is /public/favicon.png: the crow bust from logo.png,
cropped and padded to a square, because the tagline is too small to read at
tab size.

## The crow pictures that are not shown right now

Krowe now moves, so these stills sit unused in this folder. They are the same
scenes as the clips, so keep them as alternatives: if you would rather have a
still in any spot, say so and it goes back.

| File | Scene | Now shown as a clip |
| --- | --- | --- |
| krowe-standing.png | standing on the UI cards | the clip in the home hero |
| krowe-thinking.png | laptop and lightbulb | the clip in the sweep progress panel |
| krowe-sleeping.png | asleep beside a laptop | the clip in the empty and nothing-found states |
| krowe-shipped.png | laptop reading SHIPPED | the clip on a REVIVE NOW card |

The clips themselves live in src/assets as CDN pointers, and
src/components/KroweClip.tsx is where each one is placed.
