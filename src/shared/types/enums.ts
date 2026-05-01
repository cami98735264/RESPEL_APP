export const HAZARD_CODES = [
  "CO",
  "RE",
  "EX",
  "TO",
  "IN",
  "IF",
  "RA",
] as const;
export type HazardCode = (typeof HAZARD_CODES)[number];

export const CATEGORY_CODES = ["PE", "ME", "GR"] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

export const REPORT_PERIODS = [
  "daily",
  "quarterly",
  "semiannual",
  "annual",
] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];
