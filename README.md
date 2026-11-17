# Mood Pixels

A small mood tracker built with Next.js, React, PostgreSQL, Drizzle, and Docker Compose. Choose a mood manually or ask TypeSafe AI (JEV) for a suggestion, then review it before saving.

## Features

- Five moods: Sparkly, Cozy, Tired, Sad, and Frustrated.
- Energy levels from 1 to 5, mood-based defaults you can override, and optional self-care nudges.
- A compact month preview below the check-in form: labelled sample moods for guests, real saved days for signed-in users.
- Monthly calendar and a horizontally scrollable Year in Pixels view.
- Add past check-ins, edit saved days, and delete entries. Future dates are disabled.
- Google sign-in and sign-out with Better Auth.
- One entry per user per date, persisted in PostgreSQL with database constraints and migrations.
- Account-specific check-ins with session and ownership checks on every mood endpoint.
- AI-first check-in with a sample prompt, editable suggestions, and collapsible manual mood selection that preserves your choices.
- Guest AI trials with message validation (1–2000 characters after trimming); sign in to save.
- Temporary guest drafts stay in the same browser tab during Google sign-in (one-hour expiry).
- Saving as a guest continues automatically after sign-in; existing entries are never overwritten automatically.
- Loading, saving, deletion, and error states in the interface.

Check-in text is sent for AI analysis when you request a suggestion. Mood entries store the date, mood, energy, nudge, and owner, not the original text. Better Auth also stores user profiles, linked Google accounts, and sessions in PostgreSQL.

## Check-in flow

Start with **Find my mood** or expand **Or pick a mood**. Review the mood and energy, then choose **Save my day**. Guests are prompted to continue with Google; after returning to the same tab, their submitted check-in saves automatically. If that date already has an entry, the draft stays available for review before replacing it. If saving fails, the form keeps your choices so you can retry.

Signing in from the header or calendar does not submit a check-in. The homepage preview updates after a successful save; **View calendar →** and the **Calendar** tab open the full month/year calendar. Guest preview colours are examples and are never saved.

## Configure Google sign-in

Complete this setup before starting the app with either method below.

1. Copy `.env.example` to `.env` if it does not already exist.
2. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and configure Google Auth Platform with your app name, support email, and contact email. Choose **External** as the audience; keep the app in **Testing** during local development and add the Google accounts you will test with under **Test users**.
3. Create an OAuth client with application type **Web application**:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Generate a private Better Auth secret:

   ```bash
   openssl rand -base64 32
   ```

5. Set these variables in `.env`:

   ```dotenv
   BETTER_AUTH_SECRET="your_generated_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

   Use the browser-facing URL for `BETTER_AUTH_URL`, even when the app runs in Docker. Keep actual secrets in `.env`; `.env.example` should contain placeholders only.

If the Docker app is already running, recreate it after changing environment variables:

```bash
docker compose up -d --force-recreate app
```

See the [Better Auth Google provider guide](https://better-auth.com/docs/authentication/google) for provider setup details.

## Run locally

Use Node.js compatible with the installed Next.js version, npm, and Docker Desktop. A TypeSafe AI key is needed for suggestions.

1. Install dependencies with `npm ci`.
2. Complete the Google sign-in setup above, then set the TypeSafe AI key and database credentials in `.env`. Never commit `.env`.
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

Open [localhost:3000](http://localhost:3000). Try **Find my mood** or **Or pick a mood** as a guest, then sign in when saving. You can also use **Sign in** in the header first.

The database runs in Docker; Next.js runs on your computer. The named Docker volume preserves database data when the container is restarted. Existing volumes retain the credentials used during their initial creation.

## Run with Docker

This setup runs both Next.js and PostgreSQL in Docker, using Next.js development mode.

1. Start Docker Desktop.
2. Complete the Google sign-in setup above and fill in the TypeSafe AI key and PostgreSQL credentials in `.env`. Never commit `.env`.
3. Configure both database URLs with the same user, password, and database:

   | Variable              | Host        | Port   | Used by                           |
   | --------------------- | ----------- | ------ | --------------------------------- |
   | `DATABASE_URL`        | `127.0.0.1` | `5433` | Commands running on your computer |
   | `DOCKER_DATABASE_URL` | `db`        | `5432` | The app container                 |

   URL-encode special characters in credentials. Compose supplies `DOCKER_DATABASE_URL` as `DATABASE_URL` inside the app container.

4. Stop any local `npm run dev` process to free port `3000`, then build and start the services:

   ```bash
   docker compose up --build -d
   ```

5. Apply committed database migrations:

   ```bash
   docker compose exec app npx drizzle-kit migrate
   ```

6. Open [localhost:3000](http://localhost:3000). Explore as a guest or sign in with Google to save check-ins.

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

## Upgrading an existing database

Migration `0001_add_auth_and_entry_ownership.sql` adds authentication tables and a required `user_id` to mood entries. A fresh database can apply all migrations normally. If upgrading from the old single-user version with existing entries, back up those entries and plan an ownership migration before applying `0001`; it does not assign owners automatically. During development, the old disposable test entries were removed before this migration was applied.

## Development checks

```bash
npm run lint
npx tsc --noEmit --incremental false
```

After changing `src/db/schema.ts`, run `npx drizzle-kit generate`, review the generated SQL, then run `npx drizzle-kit migrate`.

When working entirely in Docker, prefix these commands with `docker compose exec app`, for example `docker compose exec app npm run lint`.

If your editor runs on your computer, run `npm ci` there as well so it can resolve dependencies and TypeScript types. Docker uses a separate dependency volume.

Manual flow checks (use test accounts and disposable check-ins):

- Sign in, create a check-in, refresh, then edit and delete it.
- Sign out and refresh; the check-in form should remain available, with a **Sign in** button and a clearly labelled sample month preview.
- As a guest, choose a mood, change its default energy, collapse/reopen the controls, and confirm both choices remain.
- Press **Save my day**, complete Google sign-in in the same tab, and confirm the check-in appears in the calendar after refresh without pressing Save again.
- Repeat with a date already saved for that account; the existing entry must remain unchanged until you explicitly save the restored draft.
- Sign in from the header or calendar without submitting the form; no check-in should be created.
- Confirm **View calendar →** opens the full calendar and the signed-in preview reflects saved changes.
- Use two accounts to confirm each sees only its own entries, including when both log the same date.
- Requests without a session to mood endpoints should return `401` in both development and production.
- Guests can request AI suggestions without signing in; exhausted allowances return `429` with `Retry-After`.

## Project structure

| Path                                 | Purpose                                                       |
| ------------------------------------ | ------------------------------------------------------------- |
| `src/app/page.tsx`                   | Main page and loading/error display                           |
| `src/app/hooks/useMoodEntries.ts`    | Fetching and updating mood state                              |
| `src/app/ui/`                        | Check-in form, auth dialog, shared controls, and calendars    |
| `src/app/ui/MonthPreview.tsx`        | Homepage month preview with guest samples or saved days       |
| `src/app/lib/mood-api.ts`            | Browser requests to the mood API                              |
| `src/app/lib/date.ts`                | Local calendar date formatting                                |
| `src/app/lib/mood-defaults.ts`       | Shared starting energy values for moods and AI suggestions    |
| `src/app/lib/check-in-draft.ts`      | Temporary guest drafts and explicit save-after-sign-in intent |
| `src/app/lib/auth.ts`                | Server-side Better Auth configuration                         |
| `src/app/lib/auth-client.ts`         | React authentication client                                   |
| `src/app/lib/require-user.ts`        | Shared API session checks                                     |
| `src/app/api/auth/[...all]/route.ts` | Better Auth route handlers and Google callback                |
| `src/app/api/moods/`                 | Create, read, update, and delete endpoints                    |
| `src/app/api/jev/route.ts`           | Server-side AI mood analysis                                  |
| `src/db/`                            | Database connection, schema, validation, and queries          |
| `src/db/auth-schema.ts`              | Generated user, account, session, and verification tables     |
| `drizzle/`                           | SQL migrations and migration metadata                         |
| `scripts/check-db.mjs`               | Database connection check                                     |
| `styles/globals.css`                 | Global styles                                                 |
| `Dockerfile`                         | Next.js development image                                     |
| `compose.yaml`                       | App and database services, ports, and volumes                 |
| `.dockerignore`                      | Files excluded from the image build context                   |

## JEV usage limits

AI requests reserve an allowance in PostgreSQL before calling the provider. Guest browsers receive a signed, HttpOnly cookie and can make 3 attempts per UTC day. All guests share a ceiling of 20 attempts per UTC hour to bound usage even when cookies are cleared. Signed-in users have 30 attempts per UTC hour. Failed provider calls still count as attempts. Counters expire and are cleaned up on subsequent requests; message text is not stored in this table.

The cookie identifies a browser, not a verified person. The shared guest ceiling is a small-project cost control, not a replacement for production abuse protection. The API's existing authentication and ownership requirements for saved check-ins remain unchanged.

## Current limitations

- Old browser-local check-ins are not imported automatically. Their browser data is left intact.
- Future-date validation uses the server's local date; per-user time zones are not implemented yet.
- Default energy is a starting point based on the mood category, not a measurement; you can adjust it before saving.
- Guest drafts use session storage in the same tab and expire after one hour. They do not transfer between browsers or devices.

## License

This project is licensed under the [MIT License](LICENSE).
