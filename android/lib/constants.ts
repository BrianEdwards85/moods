// Pagination
export const ENTRIES_PAGE_SIZE = 20;
export const TAGS_PAGE_SIZE = 30;
export const TAG_PICKER_PAGE_SIZE = 50;

// Polling & debounce (ms)
export const POLL_INTERVAL = 60_000;
export const SEARCH_DEBOUNCE = 300;
export const AUTO_SAVE_DEBOUNCE = 1_000;

// Notifications
export const REMINDER_HOURS = [11, 20] as const;
export const REMINDER_MIN_DELAY = 24 * 60 * 60 * 1000; // 24 hours

// Mood delta thresholds
export const DELTA_THRESHOLD_LARGE = 5;
export const DELTA_THRESHOLD_MEDIUM = 3;
