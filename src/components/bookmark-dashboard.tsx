"use client";

import { useRef, useState } from "react";
import { AddBookmarkForm } from "./add-bookmark-form";
import { BookmarkList } from "./bookmark-list";
import type { Bookmark } from "./bookmark-list";

type Props = {
  userId: string;
  initialBookmarks: Bookmark[];
};

export function BookmarkDashboard({ userId, initialBookmarks }: Props) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [prependBookmark, setPrependBookmark] = useState<Bookmark | null>(null);
  const refetchRef = useRef<() => void>();

  const handleAdded = (newBookmark: Bookmark) => {
    setPrependBookmark(newBookmark);
    setRefreshTrigger((k) => k + 1);
    refetchRef.current?.();
  };

  return (
    <div className="space-y-6">
      <AddBookmarkForm onAdded={handleAdded} />
      <BookmarkList
        userId={userId}
        initialBookmarks={initialBookmarks}
        refreshTrigger={refreshTrigger}
        onRefetchReady={(refetch) => {
          refetchRef.current = refetch;
        }}
        prependBookmark={prependBookmark}
        onPrependConsumed={() => setPrependBookmark(null)}
      />
    </div>
  );
}
