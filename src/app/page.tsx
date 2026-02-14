import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AuthButton } from "@/components/auth-button";
import { BookmarkDashboard } from "@/components/bookmark-dashboard";
import Link from "next/link";

// Always run on server per request so bookmarks are never cached for a different user
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: queryError } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-8">
            <Link href="/" className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Smart Bookmark
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 md:px-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-800 dark:bg-amber-950/30">
            <h1 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
              Supabase not configured
            </h1>
            <p className="mt-2 text-amber-800 dark:text-amber-200">
              Add your Supabase project URL and anon key so the app can run.
            </p>
            <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-300">
              <li>Copy <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env.local.example</code> to <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env.local</code></li>
              <li>In Supabase Dashboard → Project Settings → API, copy Project URL and anon public key</li>
              <li>Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env.local</code></li>
              <li>Restart the dev server (<code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">npm run dev</code>)</li>
            </ol>
          </div>
        </main>
      </div>
    );
  }

  const supabase = await createClient();

  // Timeout so the page never hangs if Supabase is slow/unreachable
  const AUTH_TIMEOUT_MS = 8000;
  const userPromise = supabase.auth.getUser();
  const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
    setTimeout(() => resolve({ data: { user: null } }), AUTH_TIMEOUT_MS)
  );
  const { data: { user } } = await Promise.race([userPromise, timeoutPromise]);

  // Fetch only this user's bookmarks on the server (explicit filter so each user sees only their data)
  let initialBookmarks: { id: string; url: string; title: string; created_at: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("bookmarks")
      .select("id, url, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    initialBookmarks = data ?? [];
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-8">
<Link href="/" className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Smart Bookmark
        </Link>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="max-w-[180px] truncate text-sm text-zinc-500 dark:text-zinc-400" title={user.email}>
                {user.email}
              </span>
            )}
            <AuthButton signedIn={!!user} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 md:px-8">
        {!user ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {queryError === "auth" && (
              <p className="mb-4 rounded-lg bg-red-50 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                Sign-in was cancelled or failed. Please try again.
              </p>
            )}
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Sign in to manage your bookmarks
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Use Google to sign in. Your bookmarks are private and sync in real time across tabs.
            </p>
            <div className="mt-6">
              <AuthButton signedIn={false} />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Your bookmarks
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add a URL and title. The list updates in real time across tabs for the same account. Each account sees only its own bookmarks.
              </p>
            </div>
            <BookmarkDashboard userId={user.id} initialBookmarks={initialBookmarks} />
          </>
        )}
      </main>
    </div>
  );
}
