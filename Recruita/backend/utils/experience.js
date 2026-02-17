function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function monthFromToken(token) {
  if (!token) return null;
  const t = String(token).trim().toLowerCase();
  if (!t) return null;
  if (MONTHS[t]) return MONTHS[t];
  // numeric month
  const m = Number(t);
  if (Number.isFinite(m) && m >= 1 && m <= 12) return m;
  return null;
}

function monthIndex(year, month) {
  return year * 12 + (month - 1);
}

function monthsBetweenInclusive(startIdx, endIdx) {
  if (endIdx < startIdx) return 0;
  return endIdx - startIdx + 1;
}

function currentMonthIndex() {
  const now = new Date();
  return monthIndex(now.getFullYear(), now.getMonth() + 1);
}

function addRangeMonths(set, startIdx, endIdx) {
  const cappedStart = clamp(startIdx, 0, currentMonthIndex());
  const cappedEnd = clamp(endIdx, 0, currentMonthIndex());
  if (cappedEnd < cappedStart) return;

  // Cap to avoid pathological loops
  const maxMonths = 12 * 50; // 50 years
  const total = monthsBetweenInclusive(cappedStart, cappedEnd);
  const effectiveEnd = total > maxMonths ? cappedStart + maxMonths - 1 : cappedEnd;

  for (let idx = cappedStart; idx <= effectiveEnd; idx++) {
    set.add(idx);
  }
}

function extractExplicitYears(text) {
  const src = String(text || "");
  const patterns = [
    /(\d{1,2})\+?\s*years?\s*(?:of\s*)?experience\b/i,
    /experience\s*[:\-]\s*(\d{1,2})\+?\s*years?\b/i,
    /(\d{1,2})\+?\s*yrs?\b/i,
  ];

  for (const re of patterns) {
    const m = src.match(re);
    if (m && m[1]) {
      const years = clamp(parseInt(m[1], 10), 0, 60);
      return { years, confidence: 0.95, method: "explicit" };
    }
  }

  return null;
}

function extractDateRangesYears(text) {
  const src = String(text || "");
  const monthNames = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

  // Examples supported:
  // - Jan 2020 - Mar 2022
  // - 01/2020 - 03/2022
  // - 2020 - 2022
  // - 2021 - Present
  const re = new RegExp(
    `(?:^|\\b)(?:(${monthNames})\\s+)?(\\d{4})\\s*(?:-|–|—|to)\\s*(?:(?:(${monthNames})\\s+)?(\\d{4})|present|current)`,
    "gi"
  );

  const months = new Set();
  let matchCount = 0;

  let m;
  while ((m = re.exec(src)) !== null) {
    const startMonthTok = m[1];
    const startYear = parseInt(m[2], 10);
    const endMonthTok = m[3];
    const endYearRaw = m[4];

    if (!Number.isFinite(startYear) || startYear < 1950 || startYear > 2100) continue;

    const startMonth = monthFromToken(startMonthTok) || 1;

    const endIsPresent = !endYearRaw;
    const endYear = endIsPresent ? new Date().getFullYear() : parseInt(endYearRaw, 10);
    if (!Number.isFinite(endYear) || endYear < 1950 || endYear > 2100) continue;

    const endMonth = endIsPresent ? new Date().getMonth() + 1 : monthFromToken(endMonthTok) || 12;

    const startIdx = monthIndex(startYear, startMonth);
    const endIdx = endIsPresent ? currentMonthIndex() : monthIndex(endYear, endMonth);

    addRangeMonths(months, startIdx, endIdx);
    matchCount += 1;
  }

  if (months.size === 0) return null;

  const yearsFloat = months.size / 12;
  const years = clamp(Math.floor(yearsFloat + 1e-9), 0, 60);

  // Confidence: date ranges are decent but not perfect; more ranges => better.
  const confidence = clamp(0.7 + Math.min(matchCount, 3) * 0.05, 0, 0.85);

  return { years, confidence, method: "date_ranges" };
}

export function extractYearsExperienceDetailed(resumeText, geminiYears) {
  const explicit = extractExplicitYears(resumeText);
  if (explicit) return explicit;

  const ranges = extractDateRangesYears(resumeText);

  // Gemini is helpful but can be wrong; treat as medium confidence unless it matches another signal.
  const gem = Number.isFinite(geminiYears)
    ? { years: clamp(Math.round(geminiYears), 0, 60), confidence: 0.65, method: "gemini" }
    : null;

  if (ranges && gem) {
    // If they agree within 1 year, upgrade confidence.
    if (Math.abs(ranges.years - gem.years) <= 1) {
      return {
        years: Math.max(ranges.years, gem.years),
        confidence: clamp(Math.max(ranges.confidence, gem.confidence) + 0.1, 0, 0.9),
        method: "date_ranges+gemini",
      };
    }
    // Otherwise prefer date ranges.
    return ranges;
  }

  return ranges || gem || { years: 0, confidence: 0, method: "unknown" };
}
