"use client";

import styles from "./feedback-rating.module.css";

export const feedbackRatings = [
  { value: 5, emoji: "🤩", label: "Amazing" },
  { value: 4, emoji: "😋", label: "Tasty" },
  { value: 3, emoji: "🙂", label: "Okay" },
  { value: 2, emoji: "😕", label: "Not great" },
  { value: 1, emoji: "😞", label: "Disappointed" },
] as const;

export function FeedbackRating({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return <fieldset className={styles.rating} disabled={disabled}>
    <legend>How was your meal? <span aria-hidden="true">*</span></legend>
    <div className={styles.options}>{feedbackRatings.map(item => <label key={item.value} className={value === item.value ? styles.selected : undefined}>
      <input id={`rating-${item.value}`} type="radio" name="rating" value={item.value} checked={value === item.value} required onChange={() => onChange(item.value)} aria-label={`${item.value} out of 5 — ${item.label}`} />
      <span className={styles.emoji} aria-hidden="true">{item.emoji}</span><span className={styles.number}>{item.value}</span>
    </label>)}</div>
    <p aria-live="polite">{feedbackRatings.find(item => item.value === value)?.label || "Choose a rating"}</p>
  </fieldset>;
}
