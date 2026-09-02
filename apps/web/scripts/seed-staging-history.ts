import { randomBytes } from "node:crypto";
import postgres, { type Sql } from "postgres";

export const ORGANIZATIONS = [
  { name: "Meridian Holdings", slug: "meridian-holdings", employees: 50, locations: ["Head Office"] },
  { name: "Northstar Technologies", slug: "northstar-technologies", employees: 180, locations: ["Head Office", "Technology Park"] },
  { name: "Bengal Consumer Products", slug: "bengal-consumer-products", employees: 350, locations: ["Corporate Office", "Distribution Centre", "Sales Office"] },
  { name: "Apex Manufacturing", slug: "apex-manufacturing", employees: 650, locations: ["Head Office", "Plant A", "Plant B", "Plant C"] },
] as const;

export const OFFICE_MENUS = [
  { day: 6, title: "Saturday Office Meal", description: "সাদা ভাত, ভর্তা, ডিম ভুনা, লাউ ডাল", alternate: false },
  { day: 0, title: "Sunday Office Meal", description: "পোলাও, ভাজি, মুড়িঘণ্ট ও আলুর কারি", alternate: true },
  { day: 1, title: "Monday Office Meal", description: "সাদা ভাত, মাছ ভুনা, সবজি/ভাজি, ডাল", alternate: true },
  { day: 2, title: "Tuesday Office Meal", description: "খিচুড়ি, গরুর মাংসের রেজালা, বেগুন ভাজি", alternate: true },
  { day: 3, title: "Wednesday Office Meal", description: "সাদা ভাত, তাজা মাছ, সবজি, ডাল", alternate: true },
  { day: 4, title: "Thursday Office Meal", description: "চিকেন বিরিয়ানি, আলু বোখারার চাটনি, আলুর চপ", alternate: false },
  { day: 5, title: "Friday Office Meal", description: "ভুনা খিচুড়ি, ডিম কারি, বেগুন ভাজি", alternate: false },
] as const;

export const TIFFIN_MENUS = [
  "দেশি ফ্রাইড রাইস, চিকেন চিলি, চাইনিজ সবজি",
  "সাদা ভাত, ভর্তা, আলু দিয়ে চিকেন কারি, ডাল",
  "পোলাও, ফিশ কোফতা, সাদা সবজি",
  "খিচুড়ি, গরুর রেজালা, আলুর দম",
  "সাদা ভাত, রুই মাছ ভুনা, ভাজি, ডাল",
  "চিকেন তেহারি, কাঁচা কলার টিক্কা, চাটনি, ফিরনি",
  "ভুনা খিচুড়ি, চিকেন ঝাল ফ্রাই, বেগুন ভাজি",
] as const;

type SeedOptions = { execute: boolean; expectedHost: string };
type IdRow = { id: string };
type EmployeeRow = { id: string; enterprise_id: string; employee_code: string; location_id: string; index: number };

export function parseSeedOptions(args: string[]): SeedOptions {
  const hostIndex = args.indexOf("--expected-host");
  const expectedHost = hostIndex >= 0 ? args[hostIndex + 1] : "";
  const execute = args.includes("--execute");
  if (!expectedHost) throw new Error("Provide --expected-host for the staging Neon endpoint.");
  if (execute && !args.includes("--confirm=RESET-STAGING-DATABASE")) throw new Error("Execution requires --confirm=RESET-STAGING-DATABASE.");
  return { execute, expectedHost };
}

export function historicalDates(today: string, days = 45) {
  const anchor = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const value = new Date(anchor);
    value.setUTCDate(value.getUTCDate() - (days - index));
    return value.toISOString().slice(0, 10);
  });
}

export function officeMenuForDate(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return OFFICE_MENUS.find((menu) => menu.day === day)!;
}

function random(seed: number) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function chunks<T>(items: T[], size = 2000) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function insertMany(sql: Sql | postgres.TransactionSql, table: string, rows: Record<string, unknown>[], columns: string[]) {
  for (const batch of chunks(rows)) await sql`INSERT INTO ${sql(table)} ${sql(batch, ...columns)}`;
}

async function resetAndSeed(sql: Sql, password: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const dates = historicalDates(today);
  const summary = { enterprises: 0, locations: 0, employees: 0, menus: 0, schedules: 0, preferences: 0, reviews: 0 };

  await sql.begin(async (tx) => {
    await tx.unsafe("TRUNCATE ai_usage_events, review_photos, meal_reviews, meal_preferences, menu_schedule_options, menu_schedules, enterprise_admins, app_users, employees, delivery_locations, platform_feedback, menus, enterprises RESTART IDENTITY CASCADE");
    const [{ password_hash }] = await tx<{ password_hash: string }[]>`SELECT crypt(${password}, gen_salt('bf')) AS password_hash`;
    await tx`INSERT INTO app_users(username,password_hash,full_name,role,is_active) VALUES('stage.admin',${password_hash},'Aamish Staging Admin','SUPER_ADMIN',TRUE)`;

    const officeMenuIds = new Map<number, string>();
    for (const menu of OFFICE_MENUS) {
      const [row] = await tx<IdRow[]>`INSERT INTO menus(title,description,category,price,status) VALUES(${menu.title},${menu.description},'REGULAR_LUNCH',175,'ACTIVE') RETURNING id`;
      officeMenuIds.set(menu.day, row.id); summary.menus++;
    }
    const [chicken] = await tx<IdRow[]>`INSERT INTO menus(title,description,category,price,status) VALUES('Chicken Alternate Meal','সাদা ভাত বা পোলাও, চিকেন কারি, সবজি ও ডাল','REGULAR_LUNCH',175,'ACTIVE') RETURNING id`;
    summary.menus++;
    for (let index = 0; index < TIFFIN_MENUS.length; index++) {
      await tx`INSERT INTO menus(title,description,category,price,status) VALUES(${`Tiffin Meal ${index + 1}`},${TIFFIN_MENUS[index]},'TIFFIN',120,'ACTIVE')`;
      summary.menus++;
    }

    for (let organizationIndex = 0; organizationIndex < ORGANIZATIONS.length; organizationIndex++) {
      const organization = ORGANIZATIONS[organizationIndex];
      const [enterprise] = await tx<IdRow[]>`INSERT INTO enterprises(name,slug,poc_name,poc_phone,poc_email,status) VALUES(${organization.name},${organization.slug},'Staging Contact','+8801700000000',${`admin@${organization.slug}.test`},'ACTIVE') RETURNING id`;
      summary.enterprises++;
      const locationIds: string[] = [];
      for (let index = 0; index < organization.locations.length; index++) {
        const [location] = await tx<IdRow[]>`INSERT INTO delivery_locations(enterprise_id,name,code,address,is_active) VALUES(${enterprise.id},${organization.locations[index]},${`LOC-${index + 1}`},${`${organization.name}, Dhaka`},TRUE) RETURNING id`;
        locationIds.push(location.id); summary.locations++;
      }
      const [adminUser] = await tx<IdRow[]>`INSERT INTO app_users(username,password_hash,full_name,role,enterprise_id,is_active) VALUES(${`${organization.slug}.admin`},${password_hash},${`${organization.name} Admin`},'ENTERPRISE_ADMIN',${enterprise.id},TRUE) RETURNING id`;
      await tx`INSERT INTO enterprise_admins(enterprise_id,user_id) VALUES(${enterprise.id},${adminUser.id})`;

      const employeeInputs = Array.from({ length: organization.employees }, (_, index) => ({ enterprise_id: enterprise.id, employee_code: `EMP-${String(index + 1).padStart(4, "0")}`, full_name: `Staging Employee ${String(index + 1).padStart(4, "0")}`, email: `employee${index + 1}@${organization.slug}.test`, phone: `+88018${String(organizationIndex).padStart(2, "0")}${String(index + 1).padStart(6, "0")}`, location_id: locationIds[index % locationIds.length], is_active: true }));
      await insertMany(tx, "employees", employeeInputs, ["enterprise_id", "employee_code", "full_name", "email", "phone", "location_id", "is_active"]);
      const employeeRows = await tx<EmployeeRow[]>`SELECT id,enterprise_id,employee_code,location_id,ROW_NUMBER() OVER(ORDER BY employee_code)::int-1 AS index FROM employees WHERE enterprise_id=${enterprise.id} ORDER BY employee_code`;
      const users = employeeRows.map((employee) => ({ username: `${organization.slug}.${employee.employee_code.toLowerCase()}`, password_hash, full_name: `Staging Employee ${String(employee.index + 1).padStart(4, "0")}`, role: "EMPLOYEE", enterprise_id: enterprise.id, employee_id: employee.id, is_active: true }));
      await insertMany(tx, "app_users", users, ["username", "password_hash", "full_name", "role", "enterprise_id", "employee_id", "is_active"]);
      summary.employees += employeeInputs.length;

      for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
        const date = dates[dayIndex];
        const menu = officeMenuForDate(date);
        const [schedule] = await tx<IdRow[]>`INSERT INTO menu_schedules(enterprise_id,menu_id,schedule_date,meal_type,cutoff_time,status,created_at) VALUES(${enterprise.id},${officeMenuIds.get(menu.day)!},${date},'LUNCH',${`${date}T04:30:00.000Z`},'PUBLISHED',${`${date}T02:00:00.000Z`}) RETURNING id`;
        const [primary] = await tx<IdRow[]>`INSERT INTO menu_schedule_options(schedule_id,menu_id,option_label,created_at) VALUES(${schedule.id},${officeMenuIds.get(menu.day)!},'A',${`${date}T02:00:00.000Z`}) RETURNING id`;
        let alternate: IdRow | undefined;
        if (menu.alternate) [alternate] = await tx<IdRow[]>`INSERT INTO menu_schedule_options(schedule_id,menu_id,option_label,created_at) VALUES(${schedule.id},${chicken.id},'B',${`${date}T02:00:00.000Z`}) RETURNING id`;
        summary.schedules++;

        const preferences = employeeRows.map((employee) => {
          const seed = organizationIndex * 1000000 + dayIndex * 10000 + employee.index;
          const optedIn = random(seed) < 0.92;
          const selectAlternate = Boolean(alternate) && random(seed + 91) < 0.18;
          return { schedule_id: schedule.id, employee_id: employee.id, location_id: employee.location_id, is_opted_in: optedIn, updated_by: "EMPLOYEE", selected_option_id: selectAlternate ? alternate!.id : primary.id, last_toggled_at: `${date}T03:45:00.000Z` };
        });
        await insertMany(tx, "meal_preferences", preferences, ["schedule_id", "employee_id", "location_id", "is_opted_in", "updated_by", "selected_option_id", "last_toggled_at"]);
        summary.preferences += preferences.length;

        const reviews = employeeRows.flatMap((employee, index) => {
          if (!preferences[index].is_opted_in) return [];
          const seed = organizationIndex * 2000000 + dayIndex * 20000 + employee.index;
          if (random(seed + 301) >= 0.34) return [];
          const score = random(seed + 701);
          const rating = score < 0.04 ? 2 : score < 0.15 ? 3 : score < 0.55 ? 4 : 5;
          const comments = rating <= 2 ? ["Meal arrived late and was not warm.", "Taste needs improvement."] : rating === 3 ? ["Average meal; portion could be better.", "Acceptable, but delivery was slightly late."] : ["Good meal and timely delivery.", "Fresh food and good portion size.", "Enjoyed today's menu."];
          return [{ schedule_id: schedule.id, employee_id: employee.id, rating, comment: random(seed + 901) < 0.45 ? comments[seed % comments.length] : null, feedback_tags: rating <= 2 ? ["quality", "delivery"] : [], created_at: `${date}T08:30:00.000Z`, updated_at: `${date}T08:30:00.000Z` }];
        });
        await insertMany(tx, "meal_reviews", reviews, ["schedule_id", "employee_id", "rating", "comment", "feedback_tags", "created_at", "updated_at"]);
        summary.reviews += reviews.length;
      }
    }
  });
  return { today, summary };
}

async function verify(sql: Sql) {
  const [counts] = await sql<Record<string, number>[]>`SELECT (SELECT COUNT(*)::int FROM enterprises) AS enterprises,(SELECT COUNT(*)::int FROM employees) AS employees,(SELECT COUNT(*)::int FROM menus) AS menus,(SELECT COUNT(*)::int FROM menu_schedules) AS schedules,(SELECT COUNT(*)::int FROM meal_preferences) AS preferences,(SELECT COUNT(*)::int FROM meal_reviews) AS reviews`;
  return counts;
}

async function main() {
  const options = parseSeedOptions(process.argv.slice(2));
  const connectionString = process.env.STAGING_DATABASE_URL;
  if (!connectionString) throw new Error("STAGING_DATABASE_URL is required; DATABASE_URL is intentionally ignored.");
  const hostname = new URL(connectionString).hostname;
  if (hostname !== options.expectedHost) throw new Error(`Refusing reset: connected host does not match --expected-host (${options.expectedHost}).`);
  if (!options.execute) { console.log(`Dry run: would reset ${hostname} and seed 4 organizations, 1230 employees, and 45 historical days.`); return; }
  const password = process.env.STAGING_SEED_PASSWORD || `${randomBytes(14).toString("base64url")}Aa1!`;
  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, idle_timeout: 30 });
  try {
    const seeded = await resetAndSeed(sql, password);
    console.log(JSON.stringify({ ...seeded, verified: await verify(sql), credentials: { superAdmin: "stage.admin", enterpriseAdmin: `${ORGANIZATIONS[0].slug}.admin`, employee: `${ORGANIZATIONS[0].slug}.emp-0001`, password } }, null, 2));
  } finally { await sql.end({ timeout: 5 }); }
}

if ((import.meta as ImportMeta & { main?: boolean }).main) main().catch((error) => { console.error(error instanceof Error ? error.message : "Staging seed failed."); process.exitCode = 1; });
