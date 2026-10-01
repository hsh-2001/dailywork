import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** GMT+7, no daylight saving. "Asia/Bangkok" would behave identically. */
export const APP_TZ = "Asia/Phnom_Penh";

/**
 * Show a timestamp from the API (usually UTC, e.g. "2026-10-01T02:00:00Z")
 * as GMT+7 wall-clock time, on the server and in any browser timezone.
 */
export const formatTime = (value: string) =>
  dayjs(value).tz(APP_TZ).format("hh:mm A");

/** Date-only string for fields like workDate. No timezone, so it can never shift a day. */
export const toDateString = (date: Dayjs) => date.format("YYYY-MM-DD");

/**
 * Combine the form's date and time pickers into one timestamp at GMT+7,
 * e.g. "2026-10-01T09:00:00+07:00".
 * (The time picker's own date part is ignored, so only HH:mm is used.)
 */
export const toGmt7Timestamp = (date: Dayjs, time: Dayjs) =>
  dayjs
    .tz(`${date.format("YYYY-MM-DD")} ${time.format("HH:mm")}`, APP_TZ)
    .format();
