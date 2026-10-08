// Validated palette (see dataviz skill references/palette.md). Fixed order,
// never cycled — a platform or status always maps to the same slot.
export const CATEGORICAL = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
} as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

// Fixed platform -> categorical slot. Never reassigned when a filter changes
// which platforms are visible.
export const PLATFORM_COLOR: Record<string, string> = {
  leboncoin: CATEGORICAL.blue,
  wallapop: CATEGORICAL.orange,
  facebook: CATEGORICAL.aqua,
  ebay: CATEGORICAL.yellow,
  machinio: CATEGORICAL.magenta,
  kitmondo: CATEGORICAL.green,
  dotmed: CATEGORICAL.violet,
  exapro_prepared: CATEGORICAL.red,
};

// Fixed listing-status -> status-palette slot.
export const LISTING_STATUS_COLOR: Record<string, string> = {
  generated: "#9a988f", // neutral, not yet actioned
  ready: CATEGORICAL.blue,
  posted: STATUS.warning,
  sold: STATUS.good,
  removed: "#9a988f",
};

export const LISTING_STATUS_LABEL: Record<string, string> = {
  generated: "Généré",
  ready: "Prêt",
  posted: "En ligne",
  sold: "Vendue",
  removed: "Retirée",
};
