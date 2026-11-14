# Mood Pixels

A small mood tracker built with Next.js, React, PostgreSQL, Drizzle, and Docker Compose. Choose a mood manually or ask TypeSafe AI (JEV) for a suggestion, then review it before saving.

## Features

- Five moods: Sparkly, Cozy, Tired, Sad, and Frustrated.
- Energy levels from 1 to 5 and optional self-care nudges.
- Monthly calendar and a horizontally scrollable Year in Pixels view.
- Add past check-ins, edit saved days, and delete entries. Future dates are disabled.
- One entry per date, persisted in PostgreSQL with database constraints and migrations.
- Loading, saving, deletion, and error states in the interface.

Check-in text is sent for AI analysis when you request a suggestion. The database stores the date, mood, energy, and nudge, not the original text.

## Run locally

Use Node.js compatible with the installed Next.js version, npm, and Docker Desktop. A TypeSafe AI key is needed for suggestions.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env`. Set the API key and database credentials. Never commit `.env`.
3. Set `DATABASE_URL` using the same PostgreSQL user, password, and database as the other variables. For the app running on your computer, use host `127.0.0.1` and port `5433`. Also set `DOCKER_DATABASE_URL` with the same credentials but host `db` and port `5432`; Compose requires this variable even when starting only the database. URL-encode special characters in credentials.
4. Start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

5. Apply committed migrations:

   ```bash
   npx drizzle-kit migrate
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Open [localhost:3000](http://localhost:3000). Choose a mood yourself or use **Suggest my mood**, then save your day.

The database runs in Docker; Next.js runs on your computer. The named Docker volume preserves database data when the container is restarted. Existing volumes retain the credentials used during their initial creation.

## Run with Docker

This setup runs both Next.js and PostgreSQL in Docker, using Next.js development mode.

1. Start Docker Desktop.
2. Copy `.env.example` to `.env` if you have not already created it. Fill in the API key and PostgreSQL credentials. Never commit `.env`.
3. Configure both database URLs with the same user, password, and database:

   | Variable | Host | Port | Used by |
   | --- | --- | --- | --- |
   | `DATABASE_URL` | `127.0.0.1` | `5433` | Commands running on your computer |
   | `DOCKER_DATABASE_URL` | `db` | `5432` | The app container |

   URL-encode special characters in credentials. Compose supplies `DOCKER_DATABASE_URL` as `DATABASE_URL` inside the app container.

4. Stop any local `npm run dev` process to free port `3000`, then build and start the services:

   ```bash
   docker compose up --build -d
   ```

5. Apply committed database migrations:

   ```bash
   docker compose exec app npx drizzle-kit migrate
   ```

6. Open [localhost:3000](http://localhost:3000).

Source files are mounted into the app container, so code changes appear automatically during development. Separate volumes keep the container's dependencies and Next.js cache separate from those on your computer.

For subsequent starts:

```bash
docker compose up -d
```

Check service status and follow application logs:

```bash
docker compose ps
docker compose logs -f app
```

Pressing Ctrl+C while following logs stops the log viewer, not the services. To stop the services while preserving their data:

```bash
docker compose stop
```

If dependencies change in `package.json` or `package-lock.json`, update the container's dependency volume and restart the app:

```bash
docker compose exec app npm ci
docker compose restart app
```

## Development checks

```bash
npm run lint
npx tsc --noEmit --incremental false
```

After changing `src/db/schema.ts`, run `npx drizzle-kit generate`, review the generated SQL, then run `npx drizzle-kit migrate`.

When working entirely in Docker, prefix these commands with `docker compose exec app`, for example `docker compose exec app npm run lint`.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Main page and loading/error display |
| `src/app/hooks/useMoodEntries.ts` | Fetching and updating mood state |
| `src/app/ui/` | Form, shared mood/energy controls, and calendar |
| `src/app/lib/mood-api.ts` | Browser requests to the mood API |
| `src/app/lib/date.ts` | Local calendar date formatting |
| `src/app/api/moods/` | Create, read, update, and delete endpoints |
| `src/app/api/jev/route.ts` | Server-side AI mood analysis |
| `src/db/` | Database connection, schema, validation, and queries |
| `drizzle/` | SQL migrations and migration metadata |
| `scripts/check-db.mjs` | Database connection check |
| `styles/globals.css` | Global styles |
| `Dockerfile` | Next.js development image |
| `compose.yaml` | App and database services, ports, and volumes |
| `.dockerignore` | Files excluded from the image build context |

## Current limitations

- This is a local, single-user prototype. Mood endpoints are intentionally available only in development until authentication and per-user data access are implemented.
- Old browser-local check-ins are not imported automatically. Their browser data is left intact.
- Future-date validation uses the server's local date; per-user time zones are not implemented yet.
- AI energy is a suggested score based on the mood category, which you can adjust before saving.

## License

[MIT](LICENSE).
