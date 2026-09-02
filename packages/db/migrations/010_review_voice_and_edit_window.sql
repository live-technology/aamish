ALTER TABLE meal_reviews
  ADD COLUMN voice_public_id TEXT,
  ADD COLUMN voice_url TEXT,
  ADD COLUMN voice_duration_seconds SMALLINT,
  ADD CONSTRAINT meal_reviews_voice_complete CHECK (
    (voice_public_id IS NULL AND voice_url IS NULL AND voice_duration_seconds IS NULL) OR
    (voice_public_id IS NOT NULL AND voice_url IS NOT NULL AND voice_duration_seconds BETWEEN 1 AND 60)
  );

COMMENT ON COLUMN meal_reviews.created_at IS
  'Immutable initial submission timestamp; the employee edit window ends exactly 24 hours later.';
