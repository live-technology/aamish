CREATE TABLE IF NOT EXISTS platform_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  submitter_role VARCHAR(32) NOT NULL CHECK (submitter_role IN ('SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'EMPLOYEE')),
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('BUG', 'IDEA', 'QUESTION', 'OTHER')),
  message TEXT,
  audio_public_id TEXT,
  audio_url TEXT,
  audio_duration_seconds SMALLINT CHECK (audio_duration_seconds BETWEEN 0 AND 120),
  page_path VARCHAR(500) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'PLANNED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_feedback_content_required CHECK (
    NULLIF(BTRIM(message), '') IS NOT NULL OR audio_url IS NOT NULL
  ),
  CONSTRAINT platform_feedback_audio_complete CHECK (
    (audio_public_id IS NULL AND audio_url IS NULL) OR
    (audio_public_id IS NOT NULL AND audio_url IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_created_at
  ON platform_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_status_category
  ON platform_feedback (status, category);
