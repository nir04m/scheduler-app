import type { TimeOption } from "@/lib/types";

function partsInZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

export function zonedLocalToUtcIso(
  date: string,
  time: string,
  timeZone: string
) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 3; i += 1) {
    const actual = partsInZone(new Date(utc), timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );

    const desiredAsUtc = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

    utc += desiredAsUtc - actualAsUtc;
  }

  return new Date(utc).toISOString();
}

export function formatDateTime(
  iso: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    ...options,
  }).format(new Date(iso));
}

export function formatOptionDate(option: TimeOption, timeZone: string) {
  return formatDateTime(option.startTime, timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatOptionLongDate(option: TimeOption, timeZone: string) {
  return formatDateTime(option.startTime, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatOptionTime(option: TimeOption, timeZone: string) {
  const start = formatDateTime(option.startTime, timeZone, {
    hour: "numeric",
    minute: "2-digit",
  });

  const end = formatDateTime(option.endTime, timeZone, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${start} – ${end}`;
}

export function shortTimezone(timeZone: string) {
  return timeZone.replaceAll("_", " ").split("/").at(-1) ?? timeZone;
}
