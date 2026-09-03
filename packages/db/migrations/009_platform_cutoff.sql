CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value)
VALUES ('MEAL_CUTOFF', jsonb_build_object('local_time', '00:05', 'timezone', 'Asia/Dhaka'));

UPDATE menu_schedules
SET cutoff_time = (schedule_date + TIME '00:05') AT TIME ZONE 'Asia/Dhaka'
WHERE schedule_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date;
