// src/lib/usageMeter.ts
import type { Plan } from "@/hooks/useAuth";

export const GUEST_LOGIN_SOFT_NUDGE_AFTER = 3;
export const DAILY_FREE_LIMIT = 10;           // for guests AND logged-in Free
export const COOLDOWN_MINUTES = 30;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const uidKey = (userId: string | null, plan: Plan, isLoggedIn: boolean) =>
  `${isLoggedIn ? `u:${userId ?? "unknown"}` : "guest"}:${plan}`;

const kCount = (uid: string, day: string) => `usage:${uid}:${day}`;
const kLog = (uid: string) => `usage_log:${uid}`;
const kCooldown = (uid: string) => `cooldown_until:${uid}`;

export function getCooldown(userId: string | null, plan: Plan, isLoggedIn: boolean) {
  const uid = uidKey(userId, plan, isLoggedIn);
  const v = Number(localStorage.getItem(kCooldown(uid)) || 0);
  return v > Date.now() ? v : null;
}
function setCooldown(userId: string | null, plan: Plan, isLoggedIn: boolean, minutes: number) {
  const uid = uidKey(userId, plan, isLoggedIn);
  const until = Date.now() + minutes*60*1000;
  localStorage.setItem(kCooldown(uid), String(until));
  return until;
}

function getCount(userId: string | null, plan: Plan, isLoggedIn: boolean) {
  const uid = uidKey(userId, plan, isLoggedIn);
  return Number(localStorage.getItem(kCount(uid, todayKey())) || 0);
}
function setCount(userId: string | null, plan: Plan, isLoggedIn: boolean, n: number) {
  const uid = uidKey(userId, plan, isLoggedIn);
  localStorage.setItem(kCount(uid, todayKey()), String(n));
}
function logStamp(userId: string | null, plan: Plan, isLoggedIn: boolean) {
  const uid = uidKey(userId, plan, isLoggedIn);
  const arr: string[] = JSON.parse(localStorage.getItem(kLog(uid)) || "[]");
  arr.push(new Date().toISOString());
  localStorage.setItem(kLog(uid), JSON.stringify(arr.slice(-200)));
}

/**
 * Call this at the START of optimize.
 * Returns block info or counters for nudges.
 */
export function recordOptimizeUseAndCheckLimits(
  userId: string | null,
  plan: Plan,
  isLoggedIn: boolean
): { blocked: boolean; reason?: "cooldown"|"guest_limit"|"free_limit"; count: number; cooldownUntil?: number } {

  // Pro/Team: unlimited
  if (plan === "pro" || plan === "team") {
    return { blocked: false, count: 0 };
  }

  const cd = getCooldown(userId, plan, isLoggedIn);
  if (cd) return { blocked: true, reason: "cooldown", count: getCount(userId, plan, isLoggedIn), cooldownUntil: cd };

  let count = getCount(userId, plan, isLoggedIn) + 1;
  setCount(userId, plan, isLoggedIn, count);
  logStamp(userId, plan, isLoggedIn);

  // Daily free usage limit
  if (count > DAILY_FREE_LIMIT) {
    const until = setCooldown(userId, plan, isLoggedIn, COOLDOWN_MINUTES);
    return { blocked: true, reason: isLoggedIn ? "free_limit" : "guest_limit", count, cooldownUntil: until };
  }

  return { blocked: false, count };
}
