// Demo clock helpers. All times are Asia/Kolkata (fixed +05:30, no DST).
// The clock is stored as minutes elapsed since the frozen base instant.
export const BASE_DATE = "2026-10-08";
export const BASE_MIN_OF_DAY = 9 * 60;

export const hm = (s: string): number => {
  const [h = 0, m = 0] = s.split(":").map(Number);
  return h * 60 + m;
};
export const fmtHM = (min: number): string => {
  const m = Math.round(min);
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export const addDays = (date: string, n: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** Absolute IST timestamp → clock minutes relative to base. */
export const isoToClock = (iso: string): number => {
  const t = Date.parse(iso);
  const base = Date.parse(`${BASE_DATE}T09:00:00+05:30`);
  return Math.round((t - base) / 60000);
};
export const clockToParts = (clock: number) => {
  const total = BASE_MIN_OF_DAY + clock;
  const dayOffset = Math.floor(total / 1440);
  return { date: addDays(BASE_DATE, dayOffset), minOfDay: total - dayOffset * 1440 };
};
export const fmtClock = (clock: number): string => {
  const p = clockToParts(clock);
  return `${p.date} ${fmtHM(p.minOfDay)} IST`;
};
export const isValidDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const parsed = new Date(`${s}T00:00:00Z`);
  // Date.parse normalizes dates such as February 30 instead of rejecting them.
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === s;
};
export const isValidHM = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

