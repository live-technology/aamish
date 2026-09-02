import { db } from "@/lib/db";
import type { PlannedSchedule } from "@/lib/service-planning";

export async function listAdminSchedules(from: string, to: string) {
  return db()<PlannedSchedule[]>`
    SELECT ms.id, ms.schedule_date::text, ms.cutoff_time::text, ms.status, e.name AS enterprise_name,
      (SELECT COUNT(mp.id)::int FROM meal_preferences mp
        WHERE mp.schedule_id=ms.id AND mp.is_opted_in=TRUE AND ms.status='PUBLISHED') AS meal_count,
      COALESCE((SELECT json_agg(option_row ORDER BY option_row.label) FROM (
        SELECT mso.option_label AS label, m.title,
          COUNT(mp.id) FILTER (WHERE mp.is_opted_in=TRUE AND ms.status='PUBLISHED')::int AS count
        FROM menu_schedule_options mso JOIN menus m ON m.id=mso.menu_id
        LEFT JOIN meal_preferences mp ON mp.selected_option_id=mso.id
        WHERE mso.schedule_id=ms.id GROUP BY mso.option_label,m.title
      ) option_row),'[]') AS options,
      COALESCE((SELECT json_agg(location_row ORDER BY location_row.name) FROM (
        SELECT dl.name,
          COUNT(mp.id) FILTER (WHERE mp.is_opted_in=TRUE AND ms.status='PUBLISHED')::int AS count
        FROM delivery_locations dl
        LEFT JOIN meal_preferences mp ON mp.location_id=dl.id AND mp.schedule_id=ms.id
        WHERE dl.enterprise_id=ms.enterprise_id AND dl.is_active=TRUE GROUP BY dl.name
      ) location_row),'[]') AS locations
    FROM menu_schedules ms JOIN enterprises e ON e.id=ms.enterprise_id
    WHERE ms.schedule_date BETWEEN ${from}::date AND ${to}::date
    ORDER BY ms.schedule_date,e.name
  `;
}
