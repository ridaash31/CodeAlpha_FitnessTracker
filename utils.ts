export type ActivityType = 'Walking' | 'Running' | 'Cycling' | 'Strength' | 'Yoga' | 'Other';
export const ACTIVITY_TYPES: ActivityType[] = ['Walking', 'Running', 'Cycling', 'Strength', 'Yoga', 'Other'];

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD (local time)
  type: ActivityType;
  minutes: number;
  calories: number;
  steps: number;
};

export type Metric = 'steps' | 'calories' | 'minutes';
export const GOALS: Record<Metric, number> = { steps: 10000, calories: 500, minutes: 30 };
export const METRIC_LABEL: Record<Metric, string> = { steps: 'Steps', calories: 'Calories', minutes: 'Active minutes' };

export const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Sum a metric for every entry on a given date key. */
export function totalForDate(entries: Entry[], date: string, metric: Metric): number {
  return entries.filter((e) => e.date === date).reduce((sum, e) => sum + e[metric], 0);
}

/** Last 7 days ending at `today` (oldest first) with totals for a metric. */
export function weekSeries(entries: Entry[], today: Date, metric: Metric) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const key = toDateKey(day);
    return { key, label: day.toLocaleDateString(undefined, { weekday: 'short' }), value: totalForDate(entries, key, metric) };
  });
}

export type FormInput = { minutes: string; calories: string; steps: string };
export type FormResult =
  | { ok: true; minutes: number; calories: number; steps: number }
  | { ok: false; error: string };

const parseField = (raw: string): number | null => {
  const t = raw.trim();
  if (t === '') return 0;
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
};

export function validateForm(input: FormInput): FormResult {
  const minutes = parseField(input.minutes);
  const calories = parseField(input.calories);
  const steps = parseField(input.steps);
  if (minutes === null || calories === null || steps === null) {
    return { ok: false, error: 'Use whole numbers only (no letters, decimals or negatives).' };
  }
  if (minutes === 0 && calories === 0 && steps === 0) {
    return { ok: false, error: 'Enter at least one of: minutes, calories or steps.' };
  }
  if (minutes > 1440) return { ok: false, error: 'Minutes cannot be more than 1440 (24 hours).' };
  if (calories > 10000) return { ok: false, error: 'Calories cannot be more than 10,000 per entry.' };
  if (steps > 200000) return { ok: false, error: 'Steps cannot be more than 200,000 per entry.' };
  return { ok: true, minutes, calories, steps };
}

/** Sample data for the last 7 days so the dashboard can be demonstrated. */
export function sampleEntries(today: Date): Entry[] {
  const plan: [number, ActivityType, number, number, number][] = [
    [6, 'Walking', 45, 180, 6200],
    [5, 'Running', 30, 320, 4800],
    [4, 'Strength', 50, 280, 0],
    [3, 'Walking', 60, 240, 8400],
    [2, 'Cycling', 40, 350, 0],
    [1, 'Yoga', 35, 120, 0],
    [0, 'Running', 35, 380, 5600],
  ];
  return plan.map(([ago, type, minutes, calories, steps], i) => ({
    id: `sample-${i}`,
    date: toDateKey(addDays(today, -ago)),
    type,
    minutes,
    calories,
    steps,
  }));
}
