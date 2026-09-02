import "server-only";
import { db } from "@/lib/db";
import type { OperationRow } from "@/lib/fulfillment";

export async function listFulfillmentRows(from: string, to: string) {
  return db()<OperationRow[]>`
    SELECT ms.id AS schedule_id, ms.schedule_date::text, ms.cutoff_time::text,
      e.name AS enterprise_name, dl.name AS location_name,
      mso.option_label, m.title AS menu_title, COUNT(mp.id)::int AS meal_count
    FROM menu_schedules ms JOIN enterprises e ON e.id=ms.enterprise_id
    JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.is_opted_in=TRUE
    JOIN delivery_locations dl ON dl.id=mp.location_id
    JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id
    JOIN menus m ON m.id=mso.menu_id
    WHERE ms.schedule_date BETWEEN ${from}::date AND ${to}::date AND ms.status='PUBLISHED'
    GROUP BY ms.id,e.name,dl.name,mso.option_label,m.title
    ORDER BY ms.schedule_date,e.name,dl.name,mso.option_label
  `;
}
