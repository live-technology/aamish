ALTER TABLE meal_preferences
  DROP CONSTRAINT IF EXISTS meal_preferences_location_id_fkey,
  ADD CONSTRAINT meal_preferences_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES delivery_locations(id) ON DELETE CASCADE;

ALTER TABLE meal_preferences
  DROP CONSTRAINT IF EXISTS meal_preferences_selected_option_id_fkey,
  ADD CONSTRAINT meal_preferences_selected_option_id_fkey
    FOREIGN KEY (selected_option_id) REFERENCES menu_schedule_options(id) ON DELETE SET NULL;
