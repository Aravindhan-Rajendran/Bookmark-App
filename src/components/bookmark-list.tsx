"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

type BookmarkListProps = {
  userId: string;
  initialBookmarks: Bookmark[];
  refreshTrigger?: number;
  onRefetchReady?: (refetch: () => void) => void;
  /** When set, this bookmark is prepended to the list immediately (optimistic update) */
  prependBookmark?: Bookmark | null;
  onPrependConsumed?: () => void;
};

export function BookmarkList({
  userId,
  initialBookmarks,
  refreshTrigger,
  onRefetchReady,
  prependBookmark,
  onPrependConsumed,
}: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  // Optimistic update: show newly added bookmark immediately
  useEffect(() => {
    if (!prependBookmark) return;
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === prependBookmark.id)) return prev;
      return [prependBookmark, ...prev];
    });
    onPrependConsumed?.();
  }, [prependBookmark, onPrependConsumed]);

  const fetchBookmarks = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const uid = currentUser?.id ?? userId;
    if (!uid) return;
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, url, title, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) return;
    setBookmarks(data ?? []);
  }, [userId]);

  // Keep in sync when server sends new initial data (e.g. after refresh or login as different user)
  useEffect(() => {
    setBookmarks(initialBookmarks);
  }, [initialBookmarks]);

  // Expose refetch so parent can trigger list update after adding a bookmark
  useEffect(() => {
    onRefetchReady?.(fetchBookmarks);
  }, [onRefetchReady, fetchBookmarks]);

  // Only subscribe to realtime; do NOT fetch on mount — use server's initialBookmarks only.
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookmarks]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchBookmarks();
    }
  }, [refreshTrigger, fetchBookmarks]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("bookmarks").delete().eq("id", id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">Loading bookmarks…</p>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
        No bookmarks yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {bookmarks.map((b) => (
        <li
          key={b.id}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-3 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer block truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
            >
              {b.title}
            </a>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer block truncate text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              {b.url}
            </a>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(b.id)}
            disabled={deletingId === b.id}
            className="cursor-pointer shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {deletingId === b.id ? "Deleting…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
