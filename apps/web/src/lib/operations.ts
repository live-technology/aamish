import { db } from "@/lib/db";

export async function kitchenMatrix(enterpriseId: string, mealDate: string) {
  return db()`
    SELECT
      m.title AS menu_title,
      dl.name AS location_name,
      COUNT(mp.id) FILTER (WHERE mp.is_opted_in) AS meal_count
    FROM menu_schedules ms
    JOIN menus m ON m.id = ms.menu_id
    JOIN meal_preferences mp ON mp.schedule_id = ms.id
    JOIN delivery_locations dl ON dl.id = mp.location_id
    WHERE ms.enterprise_id = ${enterpriseId}
      AND ms.schedule_date = ${mealDate}
    GROUP BY m.title, dl.name
    ORDER BY dl.name ASC
  `;
}

export async function updatePreference(input: { scheduleId: string; employeeId: string; optedIn: boolean; selectedOptionId?: string }) {
  const sql = db();
  return sql.begin(async (transaction) => {
    const schedules = await transaction<{ cutoff_time: string; status: string }[]>`
      SELECT cutoff_time, status FROM menu_schedules WHERE id = ${input.scheduleId} FOR UPDATE
    `;
    if (!schedules[0]) throw new Error("Schedule not found");
    if (schedules[0].status === "CANCELLED") throw new Error("SCHEDULE_CANCELLED");
    if (new Date(schedules[0].cutoff_time) <= new Date()) throw new Error("CUTOFF_TIME_EXPIRED");

    if (input.selectedOptionId) {
      const options = await transaction<{ id: string }[]>`SELECT id FROM menu_schedule_options WHERE id=${input.selectedOptionId} AND schedule_id=${input.scheduleId}`;
      if (!options[0]) throw new Error("INVALID_MENU_OPTION");
    }
    const rows = await transaction`
      UPDATE meal_preferences
      SET is_opted_in = ${input.optedIn}, selected_option_id=COALESCE(${input.selectedOptionId ?? null},selected_option_id), updated_by = 'EMPLOYEE', last_toggled_at = NOW()
      WHERE schedule_id = ${input.scheduleId} AND employee_id = ${input.employeeId}
      RETURNING id, is_opted_in, last_toggled_at
    `;
    if (!rows[0]) throw new Error("Meal preference not found");
    return rows[0];
  });
}
