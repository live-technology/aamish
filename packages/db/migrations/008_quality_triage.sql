ALTER TABLE platform_feedback
  ADD COLUMN IF NOT EXISTS quality_category VARCHAR(32),
  ADD COLUMN IF NOT EXISTS quality_severity VARCHAR(16),
  ADD COLUMN IF NOT EXISTS quality_status VARCHAR(24) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS meal_service_date DATE,
  ADD COLUMN IF NOT EXISTS quality_classification_source VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_quality_timeline
  ON platform_feedback (quality_status, meal_service_date DESC, created_at DESC)
  WHERE category = 'BUG';
