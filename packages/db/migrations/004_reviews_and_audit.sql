ALTER TABLE meal_reviews
  ADD COLUMN IF NOT EXISTS feedback_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_enterprise_role ON app_users (enterprise_id, role);
CREATE INDEX IF NOT EXISTS idx_employees_enterprise_active ON employees (enterprise_id, is_active);
