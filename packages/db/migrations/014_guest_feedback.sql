BEGIN;
CREATE TABLE guest_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  submission_key UUID NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT CHECK (length(review) BETWEEN 1 AND 4000),
  anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT CHECK (length(name) BETWEEN 1 AND 100),
  phone TEXT CHECK (length(phone) BETWEEN 8 AND 16),
  audio_public_id TEXT UNIQUE,
  audio_format TEXT CHECK (audio_format IN ('webm', 'mp4', 'ogg', 'm4a')),
  audio_bytes INTEGER CHECK (audio_bytes BETWEEN 1 AND 3145728),
  audio_duration_seconds REAL CHECK (audio_duration_seconds > 0 AND audio_duration_seconds <= 121),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT anonymous OR (name IS NULL AND phone IS NULL)),
  CHECK ((audio_public_id IS NULL AND audio_format IS NULL AND audio_bytes IS NULL AND audio_duration_seconds IS NULL)
    OR (audio_public_id IS NOT NULL AND audio_format IS NOT NULL AND audio_bytes IS NOT NULL AND audio_duration_seconds IS NOT NULL))
);
CREATE INDEX guest_feedback_enterprise_created_idx ON guest_feedback (enterprise_id, created_at DESC, id DESC);
CREATE INDEX guest_feedback_created_idx ON guest_feedback (created_at DESC, id DESC);
COMMIT;
