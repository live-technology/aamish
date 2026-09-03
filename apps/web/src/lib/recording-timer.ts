export function formatRecordingTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function recordingTime(elapsedSeconds: number, maximumSeconds: number) {
  const elapsed = Math.min(maximumSeconds, Math.max(0, Math.ceil(elapsedSeconds)));
  return { elapsed, remaining: maximumSeconds - elapsed, complete: elapsed >= maximumSeconds };
}
