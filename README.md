# Smart Bookmark

A bookmark manager with **Google sign-in**, private per-user bookmarks, and **real-time updates** across browser tabs. Built with Next.js (App Router), Supabase (Auth, Database, Realtime), and Tailwind CSS.

---

## Features

- **Google OAuth** — Sign up and sign in with Google only (no email/password).
- **Add bookmarks** — Save URL and title; stored privately per user.
- **Real-time list** — Add a bookmark in one tab and it appears in other tabs without refresh.
- **Delete bookmarks** — Remove your own bookmarks.
- **Deployable on Vercel** — Ready for production with minimal config.

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router)              |
| Backend     | Supabase (Auth, Postgres, Realtime) |
| Styling     | Tailwind CSS 4                      |
| Language    | TypeScript                          |

---

## Prerequisites

Before you start, ensure you have:

- **Node.js** 18+ and **npm** (or yarn/pnpm)
- A **Supabase** account — [supabase.com](https://supabase.com)
- A **Google Cloud** project (for Google OAuth) — [console.cloud.google.com](https://console.cloud.google.com)

---

## Step-by-Step Setup

### Step 1: Clone and install dependencies

```bash
git clone <your-repo-url>
cd "smart bookmark"
npm install
```

> **Note:** If your folder name has a space (e.g. `smart bookmark`), use quotes around the path when running commands.

---

### Step 2: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose your organization, set a **Project name** and **Database password**, then click **Create new project**.
4. Wait until the project is ready (green status).

---

### Step 3: Get Supabase API keys

1. In the Supabase Dashboard, open your project.
2. Go to **Project Settings** (gear icon) → **API**.
3. Copy and save:
   - **Project URL** → you will use this as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → you will use this as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Keep this tab open; you will need the Project URL again for redirect URLs.

---

### Step 4: Create the database schema

1. In Supabase Dashboard, go to **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this repo and copy its full contents.
4. Paste into the SQL Editor and click **Run** (or press Ctrl+Enter).

You should see “Success. No rows returned.” This creates:

- `bookmarks` table (id, user_id, url, title, created_at)
- Trigger to set `user_id` from the signed-in user
- Row Level Security (RLS) policies so users only see their own bookmarks
- Realtime publication for the `bookmarks` table

---

### Step 5: Enable Google OAuth in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Go to **APIs & Services** → **Credentials**.
4. Click **Create credentials** → **OAuth client ID**.
5. If asked, configure the **OAuth consent screen**:
   - User type: **External** (or Internal for workspace-only).
   - Fill in App name, User support email, Developer contact.
   - Add scope: `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Save.
6. For **Application type** choose **Web application**.
7. Under **Authorized redirect URIs**, add:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`  
   Replace `<YOUR_SUPABASE_PROJECT_REF>` with the ref from your Supabase Project URL (e.g. if URL is `https://abc123.supabase.co`, the ref is `abc123`).
8. Click **Create** and copy the **Client ID** and **Client Secret**.

---

### Step 6: Enable Google provider in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**.
2. Find **Google** and turn it **ON**.
3. Paste the **Client ID** and **Client Secret** from the previous step.
4. Click **Save**.

---

### Step 7: Configure redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**.
2. Set **Site URL**:
   - Local dev: `http://localhost:3000`
   - Production: `https://your-app.vercel.app` (or your custom domain)
3. Under **Redirect URLs**, add (one per line):
   - `http://localhost:3000/auth/callback`
   - For production later: `https://your-app.vercel.app/auth/callback`
4. Click **Save**.

---

### Step 8: Environment variables (local)

1. In the project root, copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

2. Open `.env.local` in an editor and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
   ```

   Use the **Project URL** and **anon public** key from Step 3.

3. Save the file. Do not commit `.env.local` (it is gitignored).

---

### Step 9: Run the app locally

```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Sign in with Google** and complete the sign-in flow.
3. After redirect, you should see “Your bookmarks.” Add a URL and title to create a bookmark.
4. Open another tab at [http://localhost:3000](http://localhost:3000) (same account); the new bookmark should appear without refreshing (Realtime).

---

## Deployment (Vercel)

### Step 1: Push code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Import project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New** → **Project**.
3. Import your **smart bookmark** repository.
4. Leave **Framework Preset** as Next.js and **Root Directory** as default (or set to the folder that contains `package.json`).
5. Before deploying, add environment variables (next step).

### Step 3: Add environment variables in Vercel

1. In the Vercel project, go to **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`  
     **Value:** your Supabase Project URL  
     **Environment:** Production (and Preview if you want)
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     **Value:** your Supabase anon public key  
     **Environment:** Production (and Preview if you want)
3. Save.

### Step 4: Deploy

1. Go to **Deployments** and trigger a new deployment (or push again to trigger it).
2. When the build finishes, open the generated URL (e.g. `https://your-project.vercel.app`).

### Step 5: Update Supabase redirect URLs for production

1. In Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL, e.g. `https://your-project.vercel.app`.
3. Add to **Redirect URLs**: `https://your-project.vercel.app/auth/callback`.
4. Save.

Then try **Sign in with Google** on the deployed site; it should redirect back to your app after login.

---

## Available scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `npm run dev`  | Start dev server (port 3000)   |
| `npm run build`| Build for production           |
| `npm run start`| Start production server        |
| `npm run lint` | Run ESLint                     |

---

## Project structure (main paths)

```
smart bookmark/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home: auth + bookmark list
│   │   ├── auth/
│   │   │   └── callback/route.ts # OAuth callback (exchange code for session)
│   │   └── actions/
│   │       └── auth.ts           # Sign-out server action
│   ├── components/
│   │   ├── auth-button.tsx       # Google sign-in / sign-out button
│   │   ├── bookmark-dashboard.tsx
│   │   └── bookmark-list.tsx     # List + Realtime subscription
│   └── lib/
│       └── supabase/
│           ├── client.ts         # Browser Supabase client
│           ├── server.ts         # Server Supabase client
│           ├── middleware.ts     # Session refresh
│           └── env.ts            # Check if Supabase is configured
├── supabase/
│   └── schema.sql                # Table, RLS, trigger, Realtime
├── .env.local.example            # Template for .env.local
└── README.md                     # This file
```

---

## Troubleshooting

| Issue | What to do |
| ----- | ---------- |
| “Supabase not configured” | Ensure `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Restart `npm run dev`. |
| Sign-in redirects to wrong URL or fails | In Supabase **Authentication → URL Configuration**, ensure **Site URL** and **Redirect URLs** match exactly (e.g. `http://localhost:3000` and `http://localhost:3000/auth/callback` for local). |
| Google “redirect_uri_mismatch” | In Google Cloud Console **Credentials → OAuth 2.0 Client**, the redirect URI must be exactly `https://<PROJECT_REF>.supabase.co/auth/v1/callback`. |
| Bookmarks don’t appear | Sign in first. Run `supabase/schema.sql` in Supabase SQL Editor if you haven’t. |
| Real-time not updating | In Supabase SQL Editor, ensure the script in `schema.sql` was run (it adds `bookmarks` to the Realtime publication). |

---

## Notes from development

1. **Folder name with a space** — If the project folder has a space (e.g. `smart bookmark`), use quotes in terminal commands. `create-next-app` can fail in such folders due to npm naming rules.
2. **Setting `user_id` on bookmarks** — The client only sends `url` and `title`. A Postgres trigger `set_bookmark_user_id` sets `user_id = auth.uid()` on insert so RLS works correctly.
3. **Realtime** — The `bookmarks` table is in the `supabase_realtime` publication; the client subscribes to `postgres_changes` and refetches the list so all tabs stay in sync.
4. **Session cookies** — Supabase SSR refreshes the session in middleware; cookies must be set on the **response** so the browser receives the updated session.
5. **OAuth callback** — The `/auth/callback` route exchanges the code from Supabase for a session with `exchangeCodeForSession` and redirects to `/`. Redirect URLs in Supabase must match your app URL exactly.

---

## License

MIT
