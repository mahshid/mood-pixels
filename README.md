# Mood Pixels

Mood Pixels is a small mood tracker that uses TypeSafe AI (JEV) to turn a few words about your day into a mood and self-care nudge. Write a check-in and see your mood reflected in a colourful Year in Pixels calendar.

## What it does

- Classifies a check-in as **Sparkly**, **Cozy**, **Tired**, **Sad**, or **Frustrated** using TypeSafe AI.
- Shows an energy score from 1 to 5 and a short self-care nudge.
- Colours the corresponding day in the Year in Pixels calendar. The calendar currently displays **2026**.
- Keeps one result per date in your browser's `localStorage`. A new check-in on the same day replaces that day's result.

Your check-in text is sent for mood analysis, but it is not saved in browser storage. Your browser saves only the date, mood, energy score, and self-care nudge. There are no accounts, so saved results do not sync across browsers or devices.

## Run locally

You need **Node.js 20.9 or newer**, npm, and a TypeSafe AI API key.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create the local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   Replace `your_api_key_here` in `.env` with your API key. The app reads `TYPESAFE_API_KEY` on the server. The `.env` file is ignored by Git.

3. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000), enter a few words about your day, and select **Log Vibe Check**. An API key is required for mood analysis.


## Project structure

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Main page and saved mood state |
| `src/app/ui/` | Check-in form, energy display, and Year in Pixels calendar |
| `src/app/api/jev/route.ts` | Server-side mood analysis endpoint |
| `src/app/lib/mood-log.ts` | Date and browser storage helpers |
| `styles/globals.css` | Global styles |


## Current limitations

- The Year in Pixels view is fixed to 2026.
- The calendar shows the colour for a logged day; it does not provide a history or editing screen.
- Clearing the site's browser storage removes saved results.

## License

This project is licensed under the [MIT License](LICENSE).
