import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Clock } from "lucide-react";

interface UsageStats {
  totalOptimizations: number;
  avgStops: number;
  estimatedMinutesSaved: number;
}

// Time saved scales super-linearly with stops: manually optimizing
// route order gets exponentially harder as stops increase.
// Formula: 0.5 × stops^1.5 minutes per optimization.
const timeSavedForStops = (stops: number) => 0.5 * Math.pow(stops, 1.5);

export function UsageDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("usage_events")
        .select("meta")
        .eq("user_id", user.id)
        .eq("event_type", "optimize");

      if (error || !data) return;

      const totalOptimizations = data.length;
      let totalStops = 0;
      let estimatedMinutesSaved = 0;
      for (const row of data) {
        const stops = (row.meta as any)?.stops ?? 3;
        totalStops += stops;
        estimatedMinutesSaved += timeSavedForStops(stops);
      }
      const avgStops = totalOptimizations > 0 ? totalStops / totalOptimizations : 0;

      setStats({ totalOptimizations, avgStops, estimatedMinutesSaved });
    })();
  }, [user]);

  if (!stats || stats.totalOptimizations === 0) return null;

  const timeLabel =
    stats.estimatedMinutesSaved >= 60
      ? `${(stats.estimatedMinutesSaved / 60).toFixed(1)} hrs`
      : `${stats.estimatedMinutesSaved} min`;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
        <BarChart3 className="h-4 w-4 mx-auto mb-1 text-accent" />
        <p className="text-lg font-bold text-foreground">{stats.totalOptimizations}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">Routes optimized</p>
      </div>
      <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
        <Clock className="h-4 w-4 mx-auto mb-1 text-accent" />
        <p className="text-lg font-bold text-foreground">~{timeLabel}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">Estimated time saved</p>
      </div>
    </div>
  );
}
