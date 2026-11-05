import { isoDay } from "@/lib/honey";
const localDate = (day: string) => new Date(`${day}T12:00:00`);
export function calendarDays(anchor: string, mode: "month" | "week"): string[] {
  const start = localDate(anchor);
  if (mode === "month") start.setDate(1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: mode === "month" ? 42 : 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return isoDay(date);
  });
}
export function shiftCalendar(anchor: string, amount: number, mode: "month" | "week"): string {
  const date = localDate(anchor);
  if (mode === "week") date.setDate(date.getDate() + amount * 7);
  else {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, last));
  }
  return isoDay(date);
}
