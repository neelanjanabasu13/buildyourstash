// A clearly-labelled EXAMPLE pile of a fictional person's notes. It is only input:
// the sweep on it still runs live model calls and live web search.

export const EXAMPLE_PILE = `### EXAMPLE PILE (fictional notes for demo purposes) ###

--- notes/2023-03-plant-bot.md ---
Plant watering bot, March 2023.
Wanted a little sensor in each pot that pings my phone when the soil is dry.
Prototype works on the desk with one sensor. Problem: decent soil moisture sensors with wifi cost about $40 each and I have 14 plants.
Battery life was awful, the ESP32 drained two AA batteries in four days.
Shelving this until cheap low-power sensors exist. Too expensive to scale to the whole flat.

--- notes/2023-09-recipe-voice.txt ---
Idea: hands-free recipe reader. You talk to it while cooking with flour on your hands, it reads the next step, sets timers.
Tried the speech APIs. Cloud speech recognition was fine but the latency killed it, two to three seconds every time I said "next".
On-device models were way too slow on my phone.
Stopped in October 2023. Maybe when local speech models get fast enough on a phone.

--- journal.md ---
Jan 2024: Started "Bus Buddy" again, an app that tells you which bus is actually coming using live GPS.
The city transit API only gives timetables, not live positions. Emailed them twice, no answer.
Without live data it is just a worse version of the paper timetable. Parking it.

Feb 2024: random thought, I keep building things that help me when my hands or eyes are busy. plants, cooking, the bus. Small helpers for ordinary days.

April 2024: Tried a second-hand book swap site for my street. Three neighbours signed up. Nobody posted a book in six weeks.
Honestly I think people just don't want it, the library is two minutes away. Calling it.

--- todo.json ---
{"todo": ["finish portfolio", "plant bot v2??", "learn rust maybe", "fix bike"]}
`;
