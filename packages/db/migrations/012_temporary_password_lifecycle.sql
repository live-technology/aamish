ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_app_users_enterprise_role
  ON app_users (enterprise_id, role)
  WHERE is_active = TRUE;
