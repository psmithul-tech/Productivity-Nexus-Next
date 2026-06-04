import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const FALLBACK_TIMEZONE = "UTC";
const HAS_TIMEZONE_SUFFIX = /(z|[+-]\d{2}:?\d{2})$/i;

export function isValidTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(timeZone: string | null | undefined) {
  const candidate = timeZone?.trim();
  return candidate && isValidTimeZone(candidate) ? candidate : FALLBACK_TIMEZONE;
}

export function formatLocalIsoInTimeZone(date: Date, timeZone: string) {
  return formatInTimeZone(date, normalizeTimeZone(timeZone), "yyyy-MM-dd'T'HH:mm:ss");
}

export function formatDateInTimeZone(date: Date, timeZone: string) {
  return formatInTimeZone(date, normalizeTimeZone(timeZone), "EEEE, MMMM d, yyyy");
}

export function formatTimeInTimeZone(date: Date, timeZone: string) {
  return formatInTimeZone(date, normalizeTimeZone(timeZone), "hh:mm a");
}

export function formatDateTimeInTimeZone(date: Date, timeZone: string) {
  return formatInTimeZone(date, normalizeTimeZone(timeZone), "MMM d, yyyy h:mm a");
}

export function getMinutesInTimeZone(date: Date, timeZone: string) {
  const [hour, minute] = formatInTimeZone(date, normalizeTimeZone(timeZone), "HH:mm")
    .split(":")
    .map(Number);
  return hour * 60 + minute;
}

export function parseDateTimeInTimeZone(value: string, timeZone: string) {
  const clean = value.trim();
  if (HAS_TIMEZONE_SUFFIX.test(clean)) return new Date(clean);
  return fromZonedTime(clean.substring(0, 19), normalizeTimeZone(timeZone));
}

export function startOfDayInTimeZone(date: Date, timeZone: string) {
  const localDate = formatInTimeZone(date, normalizeTimeZone(timeZone), "yyyy-MM-dd");
  return fromZonedTime(`${localDate}T00:00:00`, normalizeTimeZone(timeZone));
}

export function endOfDayInTimeZone(date: Date, timeZone: string) {
  const localDate = formatInTimeZone(date, normalizeTimeZone(timeZone), "yyyy-MM-dd");
  return fromZonedTime(`${localDate}T23:59:59.999`, normalizeTimeZone(timeZone));
}

export function timeOnDateInTimeZone(date: Date, timeZone: string, time: string) {
  const localDate = formatInTimeZone(date, normalizeTimeZone(timeZone), "yyyy-MM-dd");
  return fromZonedTime(`${localDate}T${time}:00`, normalizeTimeZone(timeZone));
}
