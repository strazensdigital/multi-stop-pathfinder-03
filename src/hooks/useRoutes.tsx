import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface SavedRoute {
  id: number;
  name: string | null;
  stops: any[];
  created_at: string;
}

export function useRoutes() {
  const { user } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const fetchRoutes = useCallback(async () => {
    if (!user) return;
    setLoadingRoutes(true);
    try {
      const { data, error } = await supabase
        .from("routes")
        .select("id, name, stops, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedRoutes(
        (data || []).map((r) => ({
          ...r,
          stops: Array.isArray(r.stops) ? r.stops : [],
        }))
      );
    } catch {
      toast.error("Failed to load saved routes");
    } finally {
      setLoadingRoutes(false);
    }
  }, [user]);

  const saveRoute = useCallback(
    async (name: string, stops: any[]) => {
      if (!user) {
        toast.error("Please sign in to save routes");
        return false;
      }
      try {
        const { error } = await supabase.from("routes").insert({
          user_id: user.id,
          name: name.trim() || `Route ${new Date().toLocaleDateString()}`,
          stops: stops as unknown as Json,
        });
        if (error) throw error;
        toast.success("Route saved!");
        await fetchRoutes();
        return true;
      } catch {
        toast.error("Failed to save route");
        return false;
      }
    },
    [user, fetchRoutes]
  );

  const deleteRoute = useCallback(
    async (id: number) => {
      try {
        const { error } = await supabase.from("routes").delete().eq("id", id);
        if (error) throw error;
        setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
        toast.success("Route deleted");
      } catch {
        toast.error("Failed to delete route");
      }
    },
    []
  );

  return {
    savedRoutes,
    loadingRoutes,
    fetchRoutes,
    saveRoute,
    deleteRoute,
  };
}
