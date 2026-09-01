const messages: Record<string, string> = {
  BULK_UPLOAD_FAILED: "The employee CSV could not be processed. Check the file and try again.",
  CLOUDINARY_NOT_CONFIGURED: "Image uploads are not configured. Ask the Aamish team to check the deployment settings.",
  CUTOFF_TIME_EXPIRED: "The meal cutoff has passed, so this preference can no longer be changed.",
  CUTOFF_MUST_BE_FUTURE: "Choose a cutoff time that has not passed.",
  DUPLICATE_LOCATION_CODE: "Each delivery location needs a different code.",
  DUPLICATE_PACKAGE_OPTION: "Each meal option must use a different package.",
  EMPLOYEE_CREATION_FAILED: "The employee could not be created. Check the details and try again.",
  ENTERPRISE_ADMIN_USERNAME_IN_USE: "That administrator username is already in use. Choose another username.",
  ENTERPRISE_CREATION_FAILED: "The enterprise could not be created. The slug or username may already be in use.",
  ENTERPRISE_DETAILS_IN_USE: "Some enterprise details are already in use. Review the company and location codes.",
  IMAGE_UPLOAD_FAILED: "The image upload failed. Try a smaller image or try again.",
  INVALID_LOCATION: "Choose a valid delivery location.",
  INVALID_MENU_OPTION: "Choose a valid meal option.",
  INVALID_REVIEW: "Choose a rating and check the review details.",
  MENU_LIST_FAILED: "The menu library could not be loaded. Try again or share the request ID with support.",
  MISSING_REQUIRED_FIELDS: "Complete all required fields.",
  PACKAGE_CREATION_FAILED: "The package could not be created. Check the details and try again.",
  PACKAGE_NOT_FOUND: "That package no longer exists.",
  PACKAGE_UPDATE_FAILED: "The package could not be updated. Check the details and try again.",
  PACKAGE_IMAGE_REQUIRED: "Choose a package image.",
  PAST_MEAL_DATE: "Choose today or a future meal date.",
  REVIEW_NOT_AVAILABLE: "This meal is not available for review. Reviews require an opted-in meal from the last seven days.",
  SCHEDULE_ALREADY_EXISTS: "This enterprise already has a lunch menu for that date.",
  SCHEDULE_PUBLISH_FAILED: "The menu could not be published. It may already exist for that date.",
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
