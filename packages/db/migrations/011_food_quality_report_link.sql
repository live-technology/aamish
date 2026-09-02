ALTER TABLE platform_feedback
  ADD COLUMN IF NOT EXISTS meal_schedule_id UUID REFERENCES menu_schedules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_platform_feedback_food_quality_timeline
  ON platform_feedback (enterprise_id, meal_service_date DESC, created_at DESC)
  WHERE meal_schedule_id IS NOT NULL;
