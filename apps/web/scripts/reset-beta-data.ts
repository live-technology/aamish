import postgres, { type Sql } from "postgres";

export const BETA_TIME_ZONE = "Asia/Dhaka";
export const DATA_TABLES = [
  "ai_usage_events",
  "platform_feedback",
  "review_photos",
  "meal_reviews",
  "meal_preferences",
  "menu_schedule_options",
  "menu_schedules",
  "enterprise_admins",
  "app_users",
  "employees",
  "delivery_locations",
  "enterprises",
  "menus",
] as const;

type TableName = (typeof DATA_TABLES)[number];
type ResetOptions = { date: string; execute: boolean; confirmation?: string };
type Counts = Record<TableName, number>;

export function requiredConfirmation(date: string) {
  return `DELETE-BETA-DATA-${date}`;
}

export function parseResetOptions(args: string[]): ResetOptions {
  const dateIndex = args.indexOf("--date");
  const confirmationIndex = args.indexOf("--confirm");
  const date = dateIndex >= 0 ? args[dateIndex + 1] : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Provide an explicit date with --date YYYY-MM-DD.");
  }

  const execute = args.includes("--execute");
  const confirmation = confirmationIndex >= 0 ? args[confirmationIndex + 1] : undefined;
  if (execute && confirmation !== requiredConfirmation(date)) {
    throw new Error(`Execution requires --confirm ${requiredConfirmation(date)}.`);
  }

  return { date, execute, confirmation };
}

function countRows(rows: unknown[]) {
  return rows.length;
}

async function inspect(sql: Sql, date: string): Promise<Counts> {
  const count = async (table: TableName, column = "created_at") => {
    const result = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column} >= ($1::date AT TIME ZONE '${BETA_TIME_ZONE}') AND ${column} < (($1::date + 1) AT TIME ZONE '${BETA_TIME_ZONE}')`, [date]);
    return Number(result[0]?.count ?? 0);
  };

  return {
    ai_usage_events: await count("ai_usage_events"),
    platform_feedback: await count("platform_feedback"),
    review_photos: await count("review_photos"),
    meal_reviews: await count("meal_reviews"),
    meal_preferences: await count("meal_preferences", "last_toggled_at"),
    menu_schedule_options: await count("menu_schedule_options"),
    menu_schedules: await count("menu_schedules"),
    enterprise_admins: await count("enterprise_admins"),
    app_users: await count("app_users"),
    employees: await count("employees"),
    delivery_locations: await count("delivery_locations"),
    enterprises: await count("enterprises"),
    menus: await count("menus"),
  };
}

async function remove(sql: Sql, date: string): Promise<Counts> {
  return sql.begin(async (tx) => {
    const removeFrom = async (table: TableName, column = "created_at") => {
      const rows = await tx.unsafe(`DELETE FROM ${table} WHERE ${column} >= ($1::date AT TIME ZONE '${BETA_TIME_ZONE}') AND ${column} < (($1::date + 1) AT TIME ZONE '${BETA_TIME_ZONE}') RETURNING id`, [date]);
      return countRows(rows);
    };

    return {
      ai_usage_events: await removeFrom("ai_usage_events"),
      platform_feedback: await removeFrom("platform_feedback"),
      review_photos: await removeFrom("review_photos"),
      meal_reviews: await removeFrom("meal_reviews"),
      meal_preferences: await removeFrom("meal_preferences", "last_toggled_at"),
      menu_schedule_options: await removeFrom("menu_schedule_options"),
      menu_schedules: await removeFrom("menu_schedules"),
      enterprise_admins: await removeFrom("enterprise_admins"),
      app_users: await removeFrom("app_users"),
      employees: await removeFrom("employees"),
      delivery_locations: await removeFrom("delivery_locations"),
      enterprises: await removeFrom("enterprises"),
      menus: await removeFrom("menus"),
    };
  }) as Promise<Counts>;
}

function printCounts(label: string, counts: Counts) {
  console.log(label);
  for (const table of DATA_TABLES) console.log(`${table}: ${counts[table]}`);
  console.log(`total: ${Object.values(counts).reduce((sum, value) => sum + value, 0)}`);
}

async function main() {
  const options = parseResetOptions(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const sql = postgres(connectionString, { max: 1, connect_timeout: 10 });
  try {
    printCounts(`Scoped rows for ${options.date} (${BETA_TIME_ZONE})`, await inspect(sql, options.date));
    if (!options.execute) {
      console.log(`Dry run only. To delete, add --execute --confirm ${requiredConfirmation(options.date)}.`);
      return;
    }

    printCounts("Deleted rows", await remove(sql, options.date));
    printCounts("Remaining scoped rows", await inspect(sql, options.date));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Beta data reset failed.");
    process.exitCode = 1;
  });
}
