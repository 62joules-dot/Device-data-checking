export type PlatformKey =
  | "leboncoin"
  | "wallapop"
  | "facebook"
  | "ebay"
  | "machinio"
  | "kitmondo"
  | "dotmed"
  | "exapro_prepared"
  | "bimedis_prepared";

export const PLATFORM_META: Record<string, { label: string; domain: string }> = {
  leboncoin: { label: "Leboncoin", domain: "leboncoin.fr" },
  wallapop: { label: "Wallapop", domain: "wallapop.com" },
  facebook: { label: "Facebook Marketplace", domain: "facebook.com" },
  ebay: { label: "eBay", domain: "ebay.fr" },
  machinio: { label: "Machinio", domain: "machinio.com" },
  kitmondo: { label: "Kitmondo", domain: "kitmondo.com" },
  dotmed: { label: "DOTmed", domain: "dotmed.com" },
  exapro_prepared: { label: "Exapro", domain: "exapro.com" },
  bimedis_prepared: { label: "Bimedis", domain: "bimedis.com" },
};

export function platformIconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Real bulk feed/upload: the generated file IS the publish action, no manual
// copy-paste. Everything else needs a human to post, by hand, on the site.
export const TIER_A = new Set(["ebay", "machinio", "kitmondo", "dotmed"]);
