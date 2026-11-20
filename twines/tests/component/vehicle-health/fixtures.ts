import type { PartRow } from "@/components/vehicle-health/part-rows";

/** Eight rows in catalog order covering every status; engine oil is overdue and the battery is time-based. */
export const PART_ROWS: PartRow[] = [
  { partId: "engine-oil", name: "Engine oil", status: "red", usagePercent: 112, remainingKm: -600, remainingDays: -12, dueDate: "2026-11-08", overdue: true },
  { partId: "oil-filter", name: "Oil filter", status: "orange", usagePercent: 80, remainingKm: 1000, remainingDays: 36, dueDate: "2026-12-26", overdue: false },
  { partId: "air-filter", name: "Air filter", status: "yellow", usagePercent: 55, remainingKm: 6750, remainingDays: 160, dueDate: "2027-04-29", overdue: false },
  { partId: "brake-pads", name: "Brake pads", status: "green", usagePercent: 20, remainingKm: 24000, remainingDays: 580, dueDate: "2028-06-22", overdue: false },
  { partId: "tires", name: "Tires", status: "green", usagePercent: 10, remainingKm: 45000, remainingDays: 1300, dueDate: "2030-06-12", overdue: false },
  { partId: "battery", name: "Battery", status: "yellow", usagePercent: 60, remainingKm: null, remainingDays: 430, dueDate: "2028-01-24", overdue: false },
  { partId: "coolant", name: "Coolant", status: "green", usagePercent: 15, remainingKm: 34000, remainingDays: 610, dueDate: "2028-07-22", overdue: false },
  { partId: "spark-plugs", name: "Spark plugs", status: "green", usagePercent: 12, remainingKm: 26400, remainingDays: 950, dueDate: "2029-06-27", overdue: false },
];
