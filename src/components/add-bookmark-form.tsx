"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type NewBookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

export function AddBookmarkForm({
  onAdded,
}: {
  onAdded?: (newBookmark: NewBookmark) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const rawUrl = url.trim();
    const rawTitle = title.trim();
    if (!rawUrl || !rawTitle) {
      setError("URL and title are required.");
      return;
    }
    let href = rawUrl;
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    setLoading(true);
    const supabase = createClient();
    const { data: inserted, error: err } = await supabase
      .from("bookmarks")
      .insert({ url: href, title: rawTitle })
      .select("id, url, title, created_at")
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setUrl("");
    setTitle("");
    if (inserted) onAdded?.(inserted as NewBookmark);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 basis-full space-y-1 sm:basis-[min(200px,100%)] md:basis-0">
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My bookmark"
          className="min-w-[180px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          disabled={loading}
        />
      </div>
      <div className="min-w-0 flex-1 basis-full space-y-1 sm:basis-[min(200px,100%)] md:basis-0">
        <label htmlFor="url" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          URL
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="min-w-[180px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Adding…" : "Add bookmark"}
      </button>
      {error && (
        <p className="w-full basis-full text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
