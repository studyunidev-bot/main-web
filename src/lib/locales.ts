export const LOCALES = ["th", "en", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "TH",
  en: "EN",
  ja: "JA",
  zh: "ZH",
};

/** Market currency per storefront locale (separate price lists). */
export const LOCALE_CURRENCY: Record<Locale, string> = {
  th: "thb",
  en: "usd",
  ja: "jpy",
  zh: "cny",
};

export const CURRENCY_LABELS: Record<string, string> = {
  thb: "THB (฿)",
  usd: "USD ($)",
  jpy: "JPY (¥)",
  cny: "CNY (¥)",
};

/** ISO country → site locale (first-visit geo redirect). */
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Thai
  TH: "th",
  // Japanese
  JP: "ja",
  // Chinese-speaking
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  SG: "en",
  // English-speaking / default markets
  US: "en",
  GB: "en",
  AU: "en",
  CA: "en",
  NZ: "en",
  IE: "en",
  MY: "en",
  PH: "en",
  IN: "en",
  DE: "en",
  FR: "en",
  NL: "en",
  SE: "en",
  NO: "en",
  DK: "en",
  FI: "en",
  CH: "en",
  AT: "en",
  BE: "en",
  ES: "en",
  IT: "en",
  PT: "en",
  BR: "en",
  MX: "en",
  AE: "en",
  SA: "en",
  KR: "en",
  VN: "en",
  ID: "en",
  LA: "th",
  KH: "th",
  MM: "th",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeFromCountry(countryCode: string | null | undefined): Locale {
  // No geo signal (local/dev or missing CDN headers) → site default (Thai).
  if (!countryCode) return DEFAULT_LOCALE;
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? "en";
}

/**
 * For bilingual CMS fields (TH/EN only): Thai locale → TH, everyone else → EN.
 * Japanese/Chinese visitors see English CMS body until ja/zh CMS fields exist.
 */
export function useThaiContent(locale: string | undefined | null): boolean {
  return normalizeLocale(locale) === "th";
}

/**
 * Pick a UI string for the active locale. Falls back: locale → en → th.
 */
export function pickCopy(
  locale: string | undefined | null,
  map: Partial<Record<Locale, string>> & { th?: string; en?: string },
): string {
  const l = normalizeLocale(locale);
  return map[l] || map.en || map.th || "";
}

export function currencyForLocale(locale: Locale): string {
  return LOCALE_CURRENCY[locale];
}

/** Minor units: JPY has 0 decimals; others use 2. */
export function currencyExponent(currency: string): number {
  return currency.toLowerCase() === "jpy" ? 0 : 2;
}

export function toMinorUnits(amount: number, currency: string): number {
  const exp = currencyExponent(currency);
  return Math.round(amount * 10 ** exp);
}

export function fromMinorUnits(minor: number, currency: string): number {
  const exp = currencyExponent(currency);
  return minor / 10 ** exp;
}

export function formatMoney(
  minorUnits: number,
  currency: string,
  locale: Locale = "th",
): string {
  const amount = fromMinorUnits(minorUnits, currency);
  const localeTag =
    locale === "th" ? "th-TH" : locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-CN" : "en-US";
  const exp = currencyExponent(currency);
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: exp,
    minimumFractionDigits: amount % 1 === 0 ? 0 : exp,
  }).format(amount);
}

/** @deprecated Use formatMoney with locale currency */
export function formatThbFromSatang(satang: number, locale: Locale = "th"): string {
  return formatMoney(satang, "thb", locale);
}

export function bahtToSatang(baht: number): number {
  return toMinorUnits(baht, "thb");
}

export function satangToBaht(satang: number): number {
  return fromMinorUnits(satang, "thb");
}

export type PriceRow = {
  locale: string;
  currency: string;
  price: number;
  compareAtPrice?: number | null;
};

export function pickVariantPrice(
  prices: PriceRow[] | null | undefined,
  locale: Locale,
  fallbackPrice?: number,
  fallbackCompare?: number | null,
): { price: number; compareAtPrice: number | null; currency: string; locale: Locale } {
  const currency = currencyForLocale(locale);
  const row =
    prices?.find((p) => p.locale === locale) ||
    prices?.find((p) => p.locale === "th") ||
    prices?.[0];

  if (row) {
    return {
      price: row.price,
      compareAtPrice: row.compareAtPrice ?? null,
      currency: row.currency || currency,
      locale: (isLocale(row.locale) ? row.locale : locale) as Locale,
    };
  }

  return {
    price: fallbackPrice ?? 0,
    compareAtPrice: fallbackCompare ?? null,
    currency,
    locale,
  };
}
