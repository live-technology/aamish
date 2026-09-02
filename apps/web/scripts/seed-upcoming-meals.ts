import postgres, { type Sql } from "postgres";
import { OFFICE_MENUS, ORGANIZATIONS, officeMenuForDate, upcomingDates } from "./seed-staging-history";

type IdRow = { id: string };
type EmployeeRow = { id: string; location_id: string; index: number };

export function parseUpcomingOptions(args: string[]) {
  const hostIndex = args.indexOf("--expected-host");
  const expectedHost = hostIndex >= 0 ? args[hostIndex + 1] : "";
  const execute = args.includes("--execute");
  if (!expectedHost) throw new Error("Provide --expected-host for the staging Neon endpoint.");
  if (execute && !args.includes("--confirm=SEED-UPCOMING-MEALS")) throw new Error("Execution requires --confirm=SEED-UPCOMING-MEALS.");
  return { expectedHost, execute };
}

function random(seed: number) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

async function insertPreferences(sql: Sql | postgres.TransactionSql, rows: Record<string, unknown>[]) {
  for (let index = 0; index < rows.length; index += 2000) {
    const batch = rows.slice(index, index + 2000);
    await sql`INSERT INTO meal_preferences ${sql(batch, "schedule_id", "employee_id", "location_id", "is_opted_in", "updated_by", "selected_option_id", "last_toggled_at")} ON CONFLICT(schedule_id,employee_id) DO NOTHING`;
  }
}

async function seedUpcoming(sql: Sql) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const dates = upcomingDates(today);
  return sql.begin(async (tx) => {
    const summary = { dates, schedulesCreated: 0, preferencesCreated: 0, schedulesSkipped: 0 };
    const [chicken] = await tx<IdRow[]>`SELECT id FROM menus WHERE title='Chicken Alternate Meal' AND status='ACTIVE' LIMIT 1`;
    if (!chicken) throw new Error("Chicken Alternate Meal is missing; run the full staging seed first.");
    const officeIds = new Map<number, string>();
    for (const menu of OFFICE_MENUS) {
      const [row] = await tx<IdRow[]>`SELECT id FROM menus WHERE title=${menu.title} AND status='ACTIVE' LIMIT 1`;
      if (!row) throw new Error(`${menu.title} is missing; run the full staging seed first.`);
      officeIds.set(menu.day, row.id);
    }

    for (let organizationIndex = 0; organizationIndex < ORGANIZATIONS.length; organizationIndex++) {
      const organization = ORGANIZATIONS[organizationIndex];
      const [enterprise] = await tx<IdRow[]>`SELECT id FROM enterprises WHERE slug=${organization.slug} LIMIT 1`;
      if (!enterprise) throw new Error(`${organization.name} is missing; run the full staging seed first.`);
      const employees = await tx<EmployeeRow[]>`SELECT id,location_id,ROW_NUMBER() OVER(ORDER BY employee_code)::int-1 AS index FROM employees WHERE enterprise_id=${enterprise.id} AND is_active=TRUE ORDER BY employee_code`;

      for (let futureIndex = 0; futureIndex < dates.length; futureIndex++) {
        const date = dates[futureIndex];
        const [existing] = await tx<IdRow[]>`SELECT id FROM menu_schedules WHERE enterprise_id=${enterprise.id} AND schedule_date=${date} AND meal_type='LUNCH'`;
        if (existing) { summary.schedulesSkipped++; continue; }
        const menu = officeMenuForDate(date);
        const [schedule] = await tx<IdRow[]>`INSERT INTO menu_schedules(enterprise_id,menu_id,schedule_date,meal_type,cutoff_time,status) VALUES(${enterprise.id},${officeIds.get(menu.day)!},${date},'LUNCH',${`${date}T04:30:00.000Z`},'PUBLISHED') RETURNING id`;
        const [primary] = await tx<IdRow[]>`INSERT INTO menu_schedule_options(schedule_id,menu_id,option_label) VALUES(${schedule.id},${officeIds.get(menu.day)!},'A') RETURNING id`;
        let alternate: IdRow | undefined;
        if (menu.alternate) [alternate] = await tx<IdRow[]>`INSERT INTO menu_schedule_options(schedule_id,menu_id,option_label) VALUES(${schedule.id},${chicken.id},'B') RETURNING id`;
        const preferences = employees.map((employee) => {
          const seed = organizationIndex * 1000000 + (45 + futureIndex) * 10000 + employee.index;
          const selectedOption = alternate && random(seed + 91) < 0.18 ? alternate.id : primary.id;
          return { schedule_id: schedule.id, employee_id: employee.id, location_id: employee.location_id, is_opted_in: random(seed) < 0.92, updated_by: "EMPLOYEE", selected_option_id: selectedOption, last_toggled_at: new Date() };
        });
        await insertPreferences(tx, preferences);
        summary.schedulesCreated++;
        summary.preferencesCreated += preferences.length;
      }
    }
    return summary;
  });
}

async function main() {
  const options = parseUpcomingOptions(process.argv.slice(2));
  const connectionString = process.env.STAGING_DATABASE_URL;
  if (!connectionString) throw new Error("STAGING_DATABASE_URL is required; DATABASE_URL is intentionally ignored.");
  const hostname = new URL(connectionString).hostname;
  if (hostname !== options.expectedHost) throw new Error(`Refusing seed: connected host does not match --expected-host (${options.expectedHost}).`);
  if (!options.execute) { console.log(`Dry run: would add missing services for ${upcomingDates(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" })).join(", ")}.`); return; }
  const sql = postgres(connectionString, { max: 1, connect_timeout: 15 });
  try { console.log(JSON.stringify(await seedUpcoming(sql), null, 2)); }
  finally { await sql.end({ timeout: 5 }); }
}

if ((import.meta as ImportMeta & { main?: boolean }).main) main().catch((error) => { console.error(error instanceof Error ? error.message : "Upcoming seed failed."); process.exitCode = 1; });
