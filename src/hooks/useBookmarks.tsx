import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Bookmark {
  id: string;
  nickname: string;
  address: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    setLoadingBookmarks(true);
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id, nickname, address, lat, lng, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookmarks(data || []);
    } catch {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoadingBookmarks(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user, fetchBookmarks]);

  const addBookmark = useCallback(
    async (nickname: string, address: string, lat?: number, lng?: number) => {
      if (!user) {
        toast.error("Please sign in to save bookmarks");
        return false;
      }
      try {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          nickname: nickname.trim(),
          address: address.trim(),
          lat: lat ?? null,
          lng: lng ?? null,
        });
        if (error) throw error;
        toast.success(`Bookmark "${nickname}" saved!`);
        await fetchBookmarks();
        return true;
      } catch {
        toast.error("Failed to save bookmark");
        return false;
      }
    },
    [user, fetchBookmarks]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("bookmarks").delete().eq("id", id);
        if (error) throw error;
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
        toast.success("Bookmark deleted");
      } catch {
        toast.error("Failed to delete bookmark");
      }
    },
    []
  );

  const matchBookmarks = useCallback(
    (query: string): Bookmark[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      return bookmarks.filter(
        (b) =>
          b.nickname.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q)
      );
    },
    [bookmarks]
  );

  return {
    bookmarks,
    loadingBookmarks,
    fetchBookmarks,
    addBookmark,
    deleteBookmark,
    matchBookmarks,
  };
}
