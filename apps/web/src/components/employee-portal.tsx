"use client";

import Image from "next/image";
import { CalendarDays, Clock3, ImageIcon, MapPin, Star, Upload } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";
import { employeeNavigation } from "@/lib/employee-navigation";
import { eligibleReviewSchedule } from "@/lib/reviews";
import styles from "./employee-experience.module.css";

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

export function EmployeePortal({ fullName, enterpriseName, schedules: initialSchedules, view }: { fullName: string; enterpriseName: string; schedules: EmployeeSchedule[]; view:"today"|"schedule"|"reviews" }) {
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

  const path=view==="today"?"/employee":view==="schedule"?"/employee/schedule":"/employee/reviews";
  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Employee" currentPath={path} navigation={employeeNavigation}>
    {view==="today"&&<><PageHeader eyebrow="Today" title={`Hello, ${fullName.split(" ")[0]}.`} description="Confirm the meal you are receiving before the cutoff."/>{!active?<EmptyState icon={<CalendarDays size={25}/>} title="No upcoming meal" description="Your company’s next published meal will appear here."/>:<Card className={styles.today} padded={false}><header><div><time>{formatDate(active.schedule_date)}</time><h2>{active.schedule_date===today?"Today’s meal":"Your next meal"}</h2><span><MapPin size={14}/>{active.location_name}</span></div><StatusBadge tone={locked?"neutral":"success"}><Clock3 size={12}/>{cutoffLabel(active.cutoff_time,locked)}</StatusBadge></header><div className={styles.options}>{active.options.map(option=><button type="button" key={option.id} disabled={locked||!active.is_opted_in} onClick={()=>updatePreference(true,option.id)} className={active.selected_option_id===option.id?styles.selected:""}><span className={styles.optionImage}>{option.image_url?<Image src={option.image_url} alt="" fill sizes="(max-width: 600px) 90vw, 260px"/>:<ImageIcon size={24}/>}</span><span className={styles.optionCopy}><b>Option {option.label}</b><strong>{option.title}</strong><small>{option.description}</small></span>{active.selected_option_id===option.id&&<em>Selected</em>}</button>)}</div><footer><div><strong>{active.is_opted_in?"Meal reserved":"Meal skipped"}</strong><span>{locked?"The cutoff passed; contact your office administrator if this is incorrect.":active.is_opted_in?"You are included in the kitchen count.":"Reserve again before cutoff if plans change."}</span></div><Button variant={active.is_opted_in?"secondary":"primary"} disabled={locked} onClick={()=>updatePreference(!active.is_opted_in)}>{active.is_opted_in?"Skip this meal":"Reserve meal"}</Button></footer></Card>}{message&&<div className={styles.message}><Alert tone="info" title="Meal preference">{message}</Alert></div>}</>}
    {view==="schedule"&&<><PageHeader eyebrow="Schedule" title="Upcoming meals" description="See the next 14 days and your current receiving or skipping state."/>{schedules.filter(item=>item.schedule_date>=today).length===0?<EmptyState icon={<CalendarDays size={25}/>} title="No upcoming schedule" description="Published meals will appear here."/>:<section className={styles.schedule}>{schedules.filter(item=>item.schedule_date>=today).map(item=><Card className={styles.scheduleRow} key={item.id}><time><strong>{formatDate(item.schedule_date)}</strong><span>{item.location_name}</span></time><div><strong>{item.options.find(option=>option.id===item.selected_option_id)?.title||item.options[0]?.title||"Meal service"}</strong><span>{item.options.length} {item.options.length===1?"option":"options"} available · cutoff {formatCutoff(item.cutoff_time)}</span></div><StatusBadge tone={item.is_opted_in?"success":"neutral"}>{item.is_opted_in?"Receiving":"Skipping"}</StatusBadge></Card>)}</section>}</>}
    {view==="reviews"&&<><PageHeader eyebrow="Reviews" title="Review a received meal" description="Reviews remain open for seven days and can be updated by submitting again."/>{!reviewTarget?<EmptyState icon={<Star size={25}/>} title="No meal available to review" description="A meal becomes reviewable after you received it and stays open for seven days."/>:<Card className={styles.review}><div className={styles.reviewHeading}><div><p>Meal on {formatDate(reviewTarget.schedule_date)}</p><h2>{reviewTarget.options.find(option=>option.id===reviewTarget.selected_option_id)?.title||"Received meal"}</h2></div><StatusBadge tone="info">Open for review</StatusBadge></div><div className={styles.stars} role="group" aria-label="Meal rating">{[1,2,3,4,5].map(value=><button type="button" aria-label={`${value} stars`} className={value<=rating?styles.lit:""} onClick={()=>setRating(value)} key={value}><Star size={27} fill="currentColor"/></button>)}</div><label className={styles.comment}><span>Comments <small>Optional</small></span><textarea value={comment} onChange={event=>setComment(event.target.value)} placeholder="Taste, portion, hygiene, or packaging notes" rows={4}/></label><div className={styles.photos}>{photos.map(photo=><Image src={photo.thumbnailUrl} alt="Attached meal" width={96} height={72} key={photo.publicId}/>)}</div><label className={styles.upload}><Upload size={16}/>{uploading?"Uploading…":`Add photos (${photos.length}/5)`}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading||photos.length>=5} onChange={event=>void addPhotos(event.target.files)}/></label><Button loading={submittingReview} loadingLabel="Submitting…" disabled={uploading||!rating} onClick={saveReview}>{reviewSaved?"Update review":"Submit review"}</Button>{reviewMessage&&<Alert tone={reviewSaved?"success":"danger"} title={reviewSaved?"Review saved":"Review not saved"}>{reviewMessage}</Alert>}</Card>}</>}
  </AppShell>;
}

function formatDate(value:string){return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long"})}function formatCutoff(value:string){return new Date(value).toLocaleTimeString("en-BD",{timeZone:"Asia/Dhaka",hour:"numeric",minute:"2-digit"})}function cutoffLabel(value:string,locked:boolean){return locked?"Cutoff passed":`Cutoff ${formatCutoff(value)}`}
