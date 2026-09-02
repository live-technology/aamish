export type ServiceOption = { label: string; title: string; count: number };
export type ServiceLocation = { name: string; count: number };
export type PlannedSchedule = {
  id: string;
  schedule_date: string;
  cutoff_time: string;
  status: string;
  enterprise_name: string;
  meal_count: number;
  options: ServiceOption[];
  locations: ServiceLocation[];
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isYmd(value: string | undefined): value is string {
  if (!value || !YMD.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function weekDates(start: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function schedulesInWeek(schedules: PlannedSchedule[], start: string) {
  const end = addDays(start, 6);
  return schedules.filter(({ schedule_date }) => schedule_date >= start && schedule_date <= end);
}

export function weekRangeLabel(start: string) {
  const end = addDays(start, 6);
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameMonth = sameYear && startDate.getUTCMonth() === endDate.getUTCMonth();
  const monthDay = (date: Date) => `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
  const fullDate = (date: Date) => `${monthDay(date)}, ${date.getUTCFullYear()}`;
  if (sameMonth) return `${monthDay(startDate)} – ${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`;
  if (sameYear) return `${monthDay(startDate)} – ${monthDay(endDate)}, ${endDate.getUTCFullYear()}`;
  return `${fullDate(startDate)} – ${fullDate(endDate)}`;
}
