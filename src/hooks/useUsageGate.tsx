import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const USAGE_KEY = "ziproute_usage";
const MAX_FREE_USES = 5;

interface UsageData {
  count: number;
  date: string; // YYYY-MM-DD
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getUsageData(): UsageData {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { count: 0, date: getTodayStr() };
    const parsed = JSON.parse(raw) as UsageData;
    if (parsed.date !== getTodayStr()) {
      return { count: 0, date: getTodayStr() };
    }
    return parsed;
  } catch {
    return { count: 0, date: getTodayStr() };
  }
}

function setUsageData(data: UsageData) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

export function useUsageGate() {
  const { profile } = useAuth();
  const [locked, setLocked] = useState(() => {
    if (profile?.plan === "pro") return false;
    const data = getUsageData();
    return data.count >= MAX_FREE_USES;
  });

  const isPro = profile?.plan === "pro";

  // Max stops: 9 for free, unlimited for pro
  const maxStops = isPro ? 25 : 9;

  // Check if user should see nudge (uses 3-4) or be locked (5+)
  const checkUsage = useCallback((): { allowed: boolean; showNudge: boolean } => {
    if (isPro) return { allowed: true, showNudge: false };
    const data = getUsageData();
    if (data.count >= MAX_FREE_USES) {
      setLocked(true);
      return { allowed: false, showNudge: false };
    }
    // Show nudge at uses 3 and 4 (0-indexed count before increment)
    const showNudge = data.count >= 3;
    return { allowed: true, showNudge };
  }, [isPro]);

  // Record a usage
  const recordUsage = useCallback(() => {
    if (isPro) return;
    const data = getUsageData();
    data.count += 1;
    data.date = getTodayStr();
    setUsageData(data);
    if (data.count >= MAX_FREE_USES) {
      setLocked(true);
    }
  }, [isPro]);

  const remainingUses = (() => {
    if (isPro) return Infinity;
    const data = getUsageData();
    return Math.max(0, MAX_FREE_USES - data.count);
  })();

  return { locked, isPro, maxStops, checkUsage, recordUsage, remainingUses, MAX_FREE_USES };
}
