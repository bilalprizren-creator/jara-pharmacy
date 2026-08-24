import type { OpeningHours } from "@/types";

/**
 * Formats a branch's opening hours into the site's established one-line shape:
 * "Hën–Sht: 08:00–22:00 · Die: 09:00–20:00".
 *
 * Shared on purpose. The branch cards render it and the build writes the same
 * string into the generated location pages, right next to the machine-readable
 * `openingHoursSpecification` — the visible text and the structured data have
 * to agree, and the only way to guarantee that is to derive both from
 * src/data/locations.ts through here.
 *
 * Day names come from the caller's copy object rather than being hardcoded, so
 * the Albanian and English renderings both stay in src/data/copy.ts.
 */

type Day = OpeningHours["days"][number];

export interface DayLabels {
  day_monday: string;
  day_tuesday: string;
  day_wednesday: string;
  day_thursday: string;
  day_friday: string;
  day_saturday: string;
  day_sunday: string;
}

const LABEL_KEY: Record<Day, keyof DayLabels> = {
  Monday: "day_monday",
  Tuesday: "day_tuesday",
  Wednesday: "day_wednesday",
  Thursday: "day_thursday",
  Friday: "day_friday",
  Saturday: "day_saturday",
  Sunday: "day_sunday",
};

export function formatHours(
  hours: OpeningHours[] | undefined,
  labels: DayLabels,
): string {
  if (!hours?.length) return "";

  return hours
    .map((slot) => {
      const days = slot.days.map((day) => labels[LABEL_KEY[day]]);
      // Three or more consecutive days read better as a range than a list.
      const label =
        days.length > 2 ? `${days[0]}–${days[days.length - 1]}` : days.join(", ");
      return `${label}: ${slot.opens}–${slot.closes}`;
    })
    .join(" · ");
}
