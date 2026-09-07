/**
 * Shared date helpers for task dates (startDate, dueDate). These are
 * calendar-day values, not instants — the API stores them as UTC midnight
 * for the chosen day (e.g. picking "2026-09-05" in the date input becomes
 * "2026-09-05T00:00:00.000Z"). Every helper here reads/writes the UTC date
 * components rather than local ones, so the calendar day never shifts
 * backward or forward depending on the viewer's own timezone offset.
 */

/** Converts an API date string into the "YYYY-MM-DD" shape <input type="date"> requires. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats an API date string for display, e.g. "Sep 5, 2026". */
export function formatDisplayDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    // The value is a calendar day, not a specific instant — pinning the
    // formatter to UTC keeps it from rendering as the previous/next day in
    // timezones behind/ahead of UTC.
    timeZone: "UTC",
  }).format(date);
}

export type DueDateStatus = "none" | "overdue" | "due-today" | "upcoming";

/**
 * Classifies a due date relative to "today" in the viewer's own timezone.
 * Both the due date and "today" are reduced to a UTC-midnight timestamp for
 * their calendar day before comparing, so a task due "today" is never
 * misclassified as overdue (or not-yet-due) purely because of the reader's
 * UTC offset or the time of day they happen to load the page.
 */
export function getDueDateStatus(dueDate: string | null | undefined): DueDateStatus {
  if (!dueDate) return "none";

  const due = new Date(dueDate);
  const dueDayUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());

  const now = new Date();
  // "Today" is the viewer's local calendar day — read with local getters —
  // then re-expressed as a UTC-midnight timestamp so it's comparable to dueDayUtc.
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDayUtc === todayUtc) return "due-today";
  return dueDayUtc < todayUtc ? "overdue" : "upcoming";
}
