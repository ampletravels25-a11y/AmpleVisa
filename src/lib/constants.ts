export const APP_NAME = "AmpleVisa";

export const APPLICATION_STATUSES = {
  INITIATED: { label: "Initiated", color: "bg-gray-100 text-gray-800" },
  DOCUMENTS_PENDING: { label: "Documents Pending", color: "bg-yellow-100 text-yellow-800" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-800" },
  REVISIONS_REQUESTED: { label: "Revisions Requested", color: "bg-orange-100 text-orange-800" },
  APPROVED_PAYMENT_PENDING: { label: "Payment Pending", color: "bg-purple-100 text-purple-800" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "bg-indigo-100 text-indigo-800" },
  PROCESSING: { label: "Processing", color: "bg-cyan-100 text-cyan-800" },
  VISA_ISSUED: { label: "Visa Issued", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
} as const;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RATE_LIMIT_PER_HOUR = 5;

export const SESSION_DURATION_EMPLOYEE = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_DURATION_ADMIN = 8 * 60 * 60 * 1000; // 8 hours

export const ACCEPTED_FILE_TYPES = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
export const MAX_FILE_SIZE_MB = 10;
