import { addMinutes, format } from "date-fns";

export function combineDateAndTime(visitDate: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(visitDate);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function addMinutesSafe(date: Date, minutes: number) {
  return addMinutes(date, minutes);
}

export function formatClock(date: Date) {
  return format(date, "h:mm a");
}

export function formatDateLabel(date: Date) {
  return format(date, "EEE, MMM d");
}

export function formatIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function isTimeWithinWindow(currentTime: string, start: string | null, end: string | null) {
  if (!start || !end) {
    return false;
  }

  const current = minutesFromTime(currentTime);
  return current >= minutesFromTime(start) && current <= minutesFromTime(end);
}

export function formatDateTime(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
}
