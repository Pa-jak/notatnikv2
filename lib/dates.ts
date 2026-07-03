export const MONTHS = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

export const MONTHS_GEN = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

export const WEEKDAYS_FULL = [
  "poniedziałek",
  "wtorek",
  "środa",
  "czwartek",
  "piątek",
  "sobota",
  "niedziela",
];

export const WEEKDAYS_SHORT = ["pon", "wt", "śr", "czw", "pt", "sob", "nd"];

export const WEEKDAYS_GRID = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeek(d: Date): Date {
  return addDays(d, -mondayIndex(d));
}

export function monthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const weeks: Date[][] = [];
  let cursor = start;
  do {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  } while (cursor.getMonth() === month);
  return weeks;
}

export function formatDayFull(d: Date): string {
  return `${WEEKDAYS_FULL[mondayIndex(d)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function formatDayShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function formatMonthYear(d: Date): string {
  const name = MONTHS[d.getMonth()];
  return `${name[0].toUpperCase()}${name.slice(1)} ${d.getFullYear()}`;
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()}–${end.getDate()} ${MONTHS_GEN[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${MONTHS_GEN[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_GEN[end.getMonth()]} ${end.getFullYear()}`;
}

export function relativeDayLabel(d: Date): string {
  const t = today();
  if (isSameDay(d, t)) return "Dziś";
  if (isSameDay(d, addDays(t, 1))) return "Jutro";
  if (isSameDay(d, addDays(t, -1))) return "Wczoraj";
  return formatDayShort(d);
}

export function noteGroupLabel(iso: string): string {
  const d = parseISODate(iso.slice(0, 10));
  const t = today();
  if (isSameDay(d, t)) return "Dziś";
  if (isSameDay(d, addDays(t, -1))) return "Wczoraj";
  return formatDayShort(d);
}

export function isOverdue(iso: string): boolean {
  return parseISODate(iso) < today();
}
