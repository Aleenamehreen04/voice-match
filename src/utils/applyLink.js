// src/utils/applyLink.js
// Shared by HomePage/App.js (raw gig objects) and InterviewEvaluation.js
// (saved application rows) so both use the exact same URL-resolution logic.

// Tries every field name a gig or application row might use for the real
// listing link. Falls back to a source-site search only if none exist, so
// Apply Now never dead-ends — but real links always win when present.
export const getApplicationUrl = (source) => {
  const candidate =
    source?.url ||
    source?.application_url ||
    source?.apply_url ||
    source?.gig_url ||
    source?.source_url ||
    source?.listing_url;

  if (candidate) return candidate;

  const title = source?.title || source?.gig_title || '';
  const company = source?.company || '';
  const query = encodeURIComponent(`${title} ${company} internship`.trim());
  return `https://internshala.com/internships/keywords-${query}`;
};

// True only when the source has a real, non-fallback link — used to decide
// whether Apply Now should even be offered for hardcoded/sample gigs.
export const hasRealApplicationUrl = (source) => {
  return Boolean(
    source?.url ||
    source?.application_url ||
    source?.apply_url ||
    source?.gig_url ||
    source?.source_url ||
    source?.listing_url
  );
};