import { addDays, isYmd } from "@/lib/service-planning";

export type OperationRow = {
  schedule_id: string;
  schedule_date: string;
  cutoff_time: string;
  enterprise_name: string;
  location_name: string;
  option_label: string;
  menu_title: string;
  meal_count: number;
};

export type FulfillmentRange = { from: string; to: string };
export type RangePreset = "TODAY" | "NEXT_7" | "PREVIOUS_7";

export function validFulfillmentRange(from: string | undefined, to: string | undefined): FulfillmentRange | undefined {
  return isYmd(from) && isYmd(to) && from <= to ? { from, to } : undefined;
}

export function presetRange(preset: RangePreset, today: string): FulfillmentRange {
  if (preset === "NEXT_7") return { from: today, to: addDays(today, 6) };
  if (preset === "PREVIOUS_7") return { from: addDays(today, -7), to: addDays(today, -1) };
  return { from: today, to: today };
}

export function filterOperationRows(rows: OperationRow[], search: string) {
  const normalized = search.trim().toLowerCase();
  return normalized
    ? rows.filter((row) => `${row.enterprise_name} ${row.location_name} ${row.menu_title} ${row.option_label}`.toLowerCase().includes(normalized))
    : rows;
}

export function fulfillmentTotals(rows: OperationRow[]) {
  return {
    meals: rows.reduce((sum, row) => sum + row.meal_count, 0),
    services: new Set(rows.map((row) => row.schedule_id)).size,
    locations: new Set(rows.map((row) => `${row.enterprise_name}:${row.location_name}`)).size,
    menus: new Set(rows.map((row) => row.menu_title)).size,
  };
}

export function countState(cutoff: string, now = new Date()) {
  return new Date(cutoff) <= now ? "LOCKED" as const : "OPEN" as const;
}

export type EnterpriseGroup = {
  name: string;
  total: number;
  open: number;
  locked: number;
  locations: Array<{ name: string; total: number; rows: OperationRow[] }>;
};

export function groupByEnterprise(rows: OperationRow[], now = new Date()): EnterpriseGroup[] {
  const enterprises = new Map<string, EnterpriseGroup>();
  for (const row of rows) {
    let enterprise = enterprises.get(row.enterprise_name);
    if (!enterprise) {
      enterprise = { name: row.enterprise_name, total: 0, open: 0, locked: 0, locations: [] };
      enterprises.set(row.enterprise_name, enterprise);
    }
    let location = enterprise.locations.find(({ name }) => name === row.location_name);
    if (!location) {
      location = { name: row.location_name, total: 0, rows: [] };
      enterprise.locations.push(location);
    }
    enterprise.total += row.meal_count;
    location.total += row.meal_count;
    location.rows.push(row);
    enterprise[countState(row.cutoff_time, now).toLowerCase() as "open" | "locked"] += row.meal_count;
  }
  return [...enterprises.values()]
    .map((enterprise) => ({ ...enterprise, locations: enterprise.locations.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function procurementTotals(rows: OperationRow[], now = new Date()) {
  const menus = new Map<string, { menu: string; total: number; open: number; locked: number; enterprises: Set<string>; locations: Set<string> }>();
  for (const row of rows) {
    const current = menus.get(row.menu_title) || { menu: row.menu_title, total: 0, open: 0, locked: 0, enterprises: new Set<string>(), locations: new Set<string>() };
    current.total += row.meal_count;
    current[countState(row.cutoff_time, now).toLowerCase() as "open" | "locked"] += row.meal_count;
    current.enterprises.add(row.enterprise_name);
    current.locations.add(`${row.enterprise_name}:${row.location_name}`);
    menus.set(row.menu_title, current);
  }
  return [...menus.values()].map((item) => ({ ...item, enterprises: item.enterprises.size, locations: item.locations.size })).sort((a, b) => b.total - a.total || a.menu.localeCompare(b.menu));
}

export function groupForDispatch(rows: OperationRow[]) {
  const destinations = new Map<string, { key: string; date: string; cutoff: string; enterprise: string; location: string; total: number; rows: OperationRow[] }>();
  for (const row of rows) {
    const key = `${row.schedule_id}:${row.location_name}`;
    const current = destinations.get(key) || { key, date: row.schedule_date, cutoff: row.cutoff_time, enterprise: row.enterprise_name, location: row.location_name, total: 0, rows: [] };
    current.total += row.meal_count;
    current.rows.push(row);
    destinations.set(key, current);
  }
  return [...destinations.values()].sort((a, b) => a.date.localeCompare(b.date) || a.enterprise.localeCompare(b.enterprise) || a.location.localeCompare(b.location));
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function fulfillmentCsv(rows: OperationRow[], now = new Date()) {
  const header = ["service_date", "enterprise", "location", "menu", "option", "quantity", "count_state"];
  const lines = rows.map((row) => [row.schedule_date, row.enterprise_name, row.location_name, row.menu_title, row.option_label, row.meal_count, countState(row.cutoff_time, now)]);
  return [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\n");
}
