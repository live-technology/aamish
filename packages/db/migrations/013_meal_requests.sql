BEGIN;

CREATE TABLE meal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_key UUID NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
  requirement TEXT CHECK (length(btrim(requirement)) >= 1 AND length(requirement) <= 4000),
  contact TEXT NOT NULL CHECK (length(btrim(contact)) BETWEEN 5 AND 254),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  audio_public_id TEXT UNIQUE,
  audio_format TEXT CHECK (audio_format IN ('webm', 'mp4', 'ogg', 'm4a')),
  audio_bytes INTEGER CHECK (audio_bytes BETWEEN 1 AND 3145728),
  audio_duration_seconds REAL CHECK (audio_duration_seconds > 0 AND audio_duration_seconds <= 121),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requirement IS NOT NULL OR audio_public_id IS NOT NULL),
  CHECK ((audio_public_id IS NULL AND audio_format IS NULL AND audio_bytes IS NULL AND audio_duration_seconds IS NULL)
    OR (audio_public_id IS NOT NULL AND audio_format IS NOT NULL AND audio_bytes IS NOT NULL AND audio_duration_seconds IS NOT NULL))
);
CREATE INDEX meal_requests_created_idx ON meal_requests (created_at DESC, id DESC);

-- Shared counters work across serverless instances. No IPs or raw contact data.
CREATE TABLE meal_request_rate_limits (
  scope TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (scope, window_start)
);

COMMIT;
