"use client";

import Image from "next/image";
import { Clock3, LogOut, MapPin, Star, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";
import { eligibleReviewSchedule } from "@/lib/reviews";

type Option = { id: string; label: string; title: string; description: string; image_url: string | null };
export type EmployeeSchedule = { id: string; schedule_date: string; cutoff_time: string; status: string; is_opted_in: boolean; selected_option_id: string | null; location_name: string; can_review: boolean; options: Option[] };
type Photo = { publicId: string; url: string; thumbnailUrl: string };

async function uploadPhoto(file: File): Promise<Photo> {
  const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "review" }) });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signed.error);
  const form = new FormData();
  form.set("file", file); form.set("api_key", signed.apiKey); form.set("timestamp", String(signed.timestamp)); form.set("signature", signed.signature); form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "UPLOAD_FAILED");
  return { publicId: data.public_id, url: data.secure_url, thumbnailUrl: data.secure_url.replace("/upload/", "/upload/c_fill,w_320,h_240,q_auto,f_auto/") };
}

export function EmployeePortal({ fullName, enterpriseName, schedules: initialSchedules }: { fullName: string; enterpriseName: string; schedules: EmployeeSchedule[] }) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const active = schedules.find((schedule) => schedule.schedule_date >= today);
  const reviewTarget = eligibleReviewSchedule(schedules, today);
  const locked = active ? new Date(active.cutoff_time) <= new Date() : true;

  async function updatePreference(optedIn: boolean, selectedOptionId?: string) {
    if (!active) return;
    const response = await fetch("/api/preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: active.id, optedIn, selectedOptionId }) });
    const data = await response.json();
    if (!response.ok) return setMessage(clientErrorMessage(data.error,"The meal preference could not be updated."));
    setSchedules((current) => current.map((schedule) => schedule.id === active.id ? { ...schedule, is_opted_in: optedIn, selected_option_id: selectedOptionId || schedule.selected_option_id } : schedule));
    setMessage("Meal preference updated.");
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const selected = [...files].slice(0, 5 - photos.length);
    const invalid = selected.map((file) => validateImage(file)).find(Boolean);
    if (invalid) return setMessage(invalid);
    setUploading(true);
    try {
      const uploaded = await Promise.all(selected.map(uploadPhoto));
      setPhotos((current) => [...current, ...uploaded]); setMessage("");
    } catch (error) {
      setMessage(clientErrorMessage(error instanceof Error ? error.message : "UPLOAD_FAILED"));
    } finally { setUploading(false); }
  }

  async function saveReview() {
    if (!reviewTarget || !rating) return setReviewMessage("Choose a rating first.");
    setSubmittingReview(true); setReviewMessage("");
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: reviewTarget.id, rating, comment, tags: [], photos }) });
      const data = await response.json();
      if (!response.ok) { setReviewSaved(false); return setReviewMessage(clientErrorMessage(data.error,"The review could not be submitted.")); }
      setReviewSaved(true); setReviewMessage("Review submitted successfully to the Aamish quality team.");
    } catch {
      setReviewSaved(false); setReviewMessage("The review could not be submitted. Check your connection and try again.");
    } finally { setSubmittingReview(false); }
  }

  return <div className="employee-app"><header><Image src="/brand/amish-logo-01.png" alt="Aamish" width={118} height={40} /><div><b>{fullName}</b><span>{enterpriseName}</span></div><button aria-label="Sign out" onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}><LogOut size={17} /></button></header><main><p className="eyebrow">EMPLOYEE MEALS</p><h1>Hello, {fullName.split(" ")[0]}.</h1>{!active ? <section className="employee-empty"><h2>No upcoming meal is scheduled</h2><p>Your company’s next published package will appear here.</p></section> : <section className="employee-meal"><div className="employee-meal-head"><div><time>{new Date(`${active.schedule_date}T00:00:00`).toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long" })}</time><h2>Choose your meal</h2><span><MapPin size={14} />{active.location_name}</span></div><em className={locked ? "locked" : "open"}><Clock3 size={14} />{locked ? "Locked" : "Cutoff " + new Date(active.cutoff_time).toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" })}</em></div><div className="employee-options">{active.options.map((option) => <button type="button" key={option.id} disabled={locked || !active.is_opted_in} onClick={() => updatePreference(true, option.id)} className={active.selected_option_id === option.id ? "selected" : ""}><b>Option {option.label}</b><strong>{option.title}</strong><p>{option.description}</p></button>)}</div><div className="meal-toggle"><div><b>{active.is_opted_in ? "Meal reserved" : "Meal skipped"}</b><span>{active.is_opted_in ? "You are included in the kitchen count." : "Restore before cutoff if plans change."}</span></div><button type="button" aria-label={active.is_opted_in ? "Skip meal" : "Reserve meal"} disabled={locked} className={active.is_opted_in ? "switch on" : "switch"} onClick={() => updatePreference(!active.is_opted_in)}><i /></button></div></section>}{reviewTarget ? <section className="employee-review"><h2>Review your meal</h2><p>For {new Date(`${reviewTarget.schedule_date}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "long" })}. Reviews remain open for seven days.</p><div className="stars">{[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`${value} stars`} className={value <= rating ? "lit" : ""} onClick={() => setRating(value)} key={value}><Star size={25} fill="currentColor" /></button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Taste, portion, hygiene, or packaging notes" rows={4} /><div className="review-photos">{photos.map((photo) => <Image src={photo.thumbnailUrl} alt="Review upload" width={88} height={66} key={photo.publicId} />)}</div><label className="upload-button"><Upload size={16} />{uploading ? "Uploading…" : "Add photos (max 5, 8 MB each)"}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading || photos.length >= 5} onChange={(event) => void addPhotos(event.target.files)} /></label><button className="primary" type="button" disabled={uploading || submittingReview || !rating} onClick={saveReview}>{submittingReview ? "Submitting…" : reviewSaved ? "Update review" : "Submit review"}</button>{reviewMessage && <p className={reviewSaved ? "review-submit-message success" : "review-submit-message"} role="status">{reviewMessage}</p>}</section> : <section className="employee-empty compact"><h2>No meal available to review</h2><p>Reviews open on the meal date and remain available for seven days when you received the meal.</p></section>}{message && <p className="employee-message">{message}</p>}</main></div>;
}
