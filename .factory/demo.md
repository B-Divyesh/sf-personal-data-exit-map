# Demo sandbox

- Demo URL: <https://personal-data-exit-map.sociobot.in/demo/>
- Query alias: <https://personal-data-exit-map.sociobot.in/?demo=1>
- Entry: select **Try it with sample data** on the first screen.

The demo creates a six-file Google Takeout-style ZIP in browser memory. It includes a family photo, contacts, mail, a calendar, video history, and subscriptions. The ordinary archive worker analyzes that file, and the ordinary signing path creates its manifest.

Demo assessments and the demo signing key use the IndexedDB database `demo:personal-data-exit-map`. Real work uses `personal-data-exit-map`; demo mode never opens it. **Reset demo** deletes the demo database and builds a clean sample. **Start for real** deletes the demo database before returning home.

The sample archive ships as deterministic application code, so `/demo/` remains usable after the first online visit when the service worker controls the page.
