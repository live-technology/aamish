const messages: Record<string, string> = {
  BULK_UPLOAD_FAILED: "The employee CSV could not be processed. Check the file and try again.",
  CLOUDINARY_NOT_CONFIGURED: "Image uploads are not configured. Ask the Aamish team to check the deployment settings.",
  CUTOFF_TIME_EXPIRED: "The meal cutoff has passed, so this preference can no longer be changed.",
  CUTOFF_MUST_BE_FUTURE: "Choose a cutoff time that has not passed.",
  CUTOFF_SETTING_READ_FAILED: "The platform cutoff could not be loaded. Try again or share the request ID with support.",
  CUTOFF_SETTING_UPDATE_FAILED: "The platform cutoff could not be updated. Try again or share the request ID with support.",
  INVALID_CUTOFF_SETTING: "Choose a valid cutoff time.",
  DUPLICATE_LOCATION_CODE: "Each delivery location needs a different code.",
  ACTIVE_LOCATION_REQUIRED: "Keep at least one active delivery location.",
  DUPLICATE_PACKAGE_OPTION: "Each meal option must use a different package.",
  EMPLOYEE_CREATION_FAILED: "The employee could not be created. Check the details and try again.",
  ENTERPRISE_ADMIN_USERNAME_IN_USE: "That administrator username is already in use. Choose another username.",
  ENTERPRISE_CREATION_FAILED: "The enterprise could not be created. The slug or username may already be in use.",
  ENTERPRISE_DETAILS_IN_USE: "Some enterprise details are already in use. Review the company and location codes.",
  ENTERPRISE_NOT_FOUND: "That enterprise no longer exists.",
  ENTERPRISE_UPDATE_FAILED: "The enterprise could not be updated. Check the details and try again.",
  INVALID_ENTERPRISE_STATUS: "Choose a valid enterprise status.",
  INVALID_ENTERPRISE_UPDATE: "Check the enterprise and location details.",
  FEEDBACK_UPDATE_FAILED: "The feedback status could not be changed. Try again or share the request ID with support.",
  IMAGE_UPLOAD_FAILED: "The image upload failed. Try a smaller image or try again.",
  INVALID_LOCATION: "Choose a valid delivery location.",
  LOCATION_IN_USE: "This location is assigned to employees or meal records. Deactivate it instead of removing it.",
  INVALID_MENU_OPTION: "Choose a valid meal option.",
  INVALID_REVIEW: "Choose a rating and check the review details.",
  INVALID_REVIEW_VOICE: "Record the voice review again and retry.",
  INVALID_REVIEW_VOICE_DURATION: "Voice reviews can be no longer than one minute.",
  MENU_LIST_FAILED: "The menu library could not be loaded. Try again or share the request ID with support.",
  MISSING_REQUIRED_FIELDS: "Complete all required fields.",
  PACKAGE_CREATION_FAILED: "The package could not be created. Check the details and try again.",
  PACKAGE_NOT_FOUND: "That package no longer exists.",
  PACKAGE_UPDATE_FAILED: "The package could not be updated. Check the details and try again.",
  PACKAGE_IMAGE_REQUIRED: "Choose a package image.",
  PAST_MEAL_DATE: "Choose today or a future meal date.",
  QUALITY_UPDATE_FAILED: "The quality triage could not be saved. Try again or share the request ID with support.",
  REVIEW_EDIT_WINDOW_CLOSED: "This review is read-only because its 24-hour edit window has ended.",
  REVIEW_NOT_AVAILABLE: "This meal is not available for review. Choose a previous meal you received.",
  SCHEDULE_ALREADY_EXISTS: "This enterprise already has a lunch menu for that date.",
  SCHEDULE_CANCELLED: "This service was cancelled, so it can no longer be changed.",
  SCHEDULE_CANCEL_FAILED: "The service could not be cancelled. Try again or share the request ID with support.",
  SCHEDULE_LIST_FAILED: "The service calendar could not be loaded. Try again or share the request ID with support.",
  SCHEDULE_NOT_FOUND: "That service no longer exists.",
  SCHEDULE_PUBLISH_FAILED: "The menu could not be published. It may already exist for that date.",
  SCHEDULE_UPDATE_FAILED: "The service could not be updated. Try again or share the request ID with support.",
  UPLOAD_FAILED: "The image upload failed. Try a smaller image or try again.",
};

export function clientErrorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  if (typeof error !== "string" || !error) return fallback;
  return messages[error] ?? (/^[A-Z0-9_]+$/.test(error) ? fallback : error);
}

export function validateImage(file: File, maximumMegabytes = 8) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) return "Use a JPG, PNG, or WebP image.";
  if (file.size > maximumMegabytes * 1024 * 1024) return `Choose an image smaller than ${maximumMegabytes} MB.`;
  return null;
}
