ALTER TABLE platform_feedback
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS transcript_english TEXT,
  ADD COLUMN IF NOT EXISTS transcription_summary TEXT,
  ADD COLUMN IF NOT EXISTS transcription_confidence VARCHAR(12),
  ADD COLUMN IF NOT EXISTS transcription_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transcribed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_feedback_transcription_confidence_check'
  ) THEN
    ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_transcription_confidence_check
      CHECK (transcription_confidence IS NULL OR transcription_confidence IN ('high', 'medium', 'low'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_feedback_untranscribed_audio
  ON platform_feedback (created_at)
  WHERE audio_url IS NOT NULL AND transcribed_at IS NULL;

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  feedback_id UUID REFERENCES platform_feedback(id) ON DELETE SET NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  reasoning_tokens INTEGER NOT NULL DEFAULT 0 CHECK (reasoning_tokens >= 0),
  total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created_at ON ai_usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_feedback_id ON ai_usage_events (feedback_id, created_at DESC);
