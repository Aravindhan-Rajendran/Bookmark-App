# Smart Bookmark App

A simple bookmark manager with **Google sign-in only**, private per-user bookmarks, and **real-time updates** across tabs. Built with Next.js (App Router), Supabase (Auth, Database, Realtime), and Tailwind CSS.

## Features

- **Google OAuth only** — no email/password; sign up and log in with Google.
- **Add bookmarks** — URL and title; stored privately per user.
- **Real-time list** — open two tabs, add a bookmark in one, and it appears in the other without refresh.
- **Delete bookmarks** — remove your own bookmarks.
- **Deployable on Vercel** — ready for a live URL.

## Tech Stack

- **Next.js** (App Router)
- **Supabase** — Auth (Google), Database (Postgres), Realtime
- **Tailwind CSS** — styling

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd smart-bookmark   # or "smart bookmark"
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In **Authentication → Providers**, enable **Google** and add your OAuth client ID and secret (from Google Cloud Console).
4. In **SQL Editor**, run the script in `supabase/schema.sql` to create the `bookmarks` table, RLS policies, trigger, and Realtime.
5. In **Authentication → URL Configuration**, set **Site URL** to your app URL (e.g. `https://your-app.vercel.app`) and add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**. For local dev use `http://localhost:3000` and `http://localhost:3000/auth/callback`.

### 3. Environment variables

Copy the example env and fill in your Supabase values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and add bookmarks.

### 5. Deploy on Vercel

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com), import the repo and deploy.
3. In the project **Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://<your-vercel-host>/auth/callback` to **Redirect URLs**.

## Problems I ran into and how I solved them

1. **Project folder name with a space** — `create-next-app` fails when the directory name has a space (npm naming rules). I created the app in a subfolder `smart-bookmark` and then moved all files into the parent `smart bookmark` folder so the workspace root stays the same.

2. **Setting `user_id` on bookmarks** — Inserts from the client only send `url` and `title`; RLS expects `user_id` to match `auth.uid()`. I added a Postgres trigger `set_bookmark_user_id` that runs before insert and sets `user_id = auth.uid()` when it’s null, so the client doesn’t need to send it and RLS stays correct.

3. **Realtime across tabs** — To get the list updating in every tab without refresh, I used Supabase Realtime: the table was added to the `supabase_realtime` publication (in `schema.sql`), and the client subscribes to `postgres_changes` on `bookmarks`. On any insert/update/delete, the subscription callback refetches the list so all tabs stay in sync.

4. **Middleware and cookies** — Supabase SSR needs to refresh the session in middleware. The `setAll` callback must set cookies on the **response** object (e.g. `response.cookies.set(...)`), not the request, so the browser receives the updated session cookie.

5. **Google OAuth redirect** — After Google sign-in, Supabase redirects to the app’s callback URL with a code. The `/auth/callback` route exchanges that code for a session with `exchangeCodeForSession` and then redirects to `/`. The redirect URLs in Supabase must exactly match the deployed and local URLs (including `/auth/callback`).

## License

MIT
