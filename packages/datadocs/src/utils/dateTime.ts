import { formatDateTimeData } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/date-time-formatter/format/index";

const format = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function extract(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type.toLowerCase() === type.toLowerCase())
    .value;
}

export function getDateString(time: number) {
  const parts = format.formatToParts(time);
  return (
    extract(parts, "year") +
    "-" +
    extract(parts, "month") +
    "-" +
    extract(parts, "day") +
    " " +
    extract(parts, "hour") +
    ":" +
    extract(parts, "minute") +
    ":" +
    extract(parts, "second") +
    " " +
    extract(parts, "dayPeriod")
  );
}

export function getCustomDateTimeString(
  value: number,
  pattern = "MMM dd, yyyy at h:mmam/pm"
) {
  const offset = new Date().getTimezoneOffset();
  return formatDateTimeData(value, pattern, "en-us", { offset, name: null });
}

export function getTimeDifference(date: number | Date): string {
  if (!date) return "";

  const now = Date.now();
  if (date instanceof Date) {
    date = date.getTime();
  }

  const delta = Math.abs(now - date) / 1000;
  const years = Math.floor(delta / (365 * 24 * 3600));
  const months = Math.floor(delta / (30 * 24 * 3600));
  const weeks = Math.floor(delta / (7 * 24 * 3600));
  const days = Math.floor(delta / (24 * 3600));
  const hours = Math.floor(delta / 3600);
  const minutes = Math.floor(delta / 60);

  function getPluralPostfix(v: number) {
    return v > 1 ? "s" : "";
  }

  if (years > 0) {
    return `${years} year${getPluralPostfix(years)} ago`;
  } else if (months > 0) {
    return `${months} month${getPluralPostfix(months)} ago`;
  } else if (weeks > 0) {
    return `${weeks} week${getPluralPostfix(weeks)} ago`;
  } else if (days > 0) {
    return `${days} day${getPluralPostfix(days)} ago`;
  } else if (hours > 0) {
    return `${hours} hour${getPluralPostfix(hours)} ago`;
  } else {
    return `${minutes} minute${getPluralPostfix(minutes)} ago`;
  }
}
