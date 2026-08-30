CREATE TABLE menu_schedule_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES menu_schedules(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id),
  option_label VARCHAR(12) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_id, menu_id),
  UNIQUE (schedule_id, option_label)
);

ALTER TABLE meal_preferences
  ADD COLUMN selected_option_id UUID REFERENCES menu_schedule_options(id);

CREATE INDEX idx_schedule_options_schedule ON menu_schedule_options (schedule_id);
