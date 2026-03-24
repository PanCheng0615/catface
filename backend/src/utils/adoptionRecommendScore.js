/**
 * Adoption recommendation scoring (rule-based engine)
 * All field names match schema.prisma
 *
 * Frontend slider options (English only):
 *
 * preferred_gender : "female" | "male" | "no preference"
 * preferred_age    : "kitten" | "adult" | "senior"
 * preferred_breed  : "domestic short hair" | "british shorthair" | "ragdoll"
 *                    | "persian" | "american shorthair" | "mixed / rescue cat"
 *
 * CatTag.tag on cats may contain personality tags such as:
 *   "playful / active", "gentle / calm", "good with kids",
 *   "good for first-time owners", "ok with special needs"
 */

const WEIGHT_PREF_BREED = 25;
const WEIGHT_PREF_GENDER = 15;
const WEIGHT_PREF_AGE = 15;
const WEIGHT_LIKED_BREED = 20;
const WEIGHT_LIKED_TAG = 8;

function normalizeText(s) {
  if (s == null) return '';
  return String(s).trim().toLowerCase();
}

// ── Age ──────────────────────────────────────────────────

const AGE_RANGES = {
  kitten: { min: 0, max: 12 },
  adult:  { min: 12, max: 84 },
  senior: { min: 84, max: 360 }
};

function parsePreferredAgeRangeMonths(preferred_age) {
  if (preferred_age == null || !String(preferred_age).trim()) return null;
  const s = normalizeText(preferred_age);

  if (AGE_RANGES[s]) return AGE_RANGES[s];

  for (const [key, range] of Object.entries(AGE_RANGES)) {
    if (s.includes(key)) return range;
  }

  const m = s.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  return null;
}

// ── Breed ────────────────────────────────────────────────

const MIXED_KEYWORDS = ['mixed', 'rescue', 'unknown'];

function preferenceBreedMatches(preferred_breed, cat_breed) {
  if (!preferred_breed) return false;
  const p = normalizeText(preferred_breed);
  const c = normalizeText(cat_breed);

  if (p.includes('mixed') || p.includes('rescue')) {
    if (!c) return true;
    return MIXED_KEYWORDS.some((kw) => c.includes(kw));
  }

  if (!c) return false;
  return c.includes(p) || p.includes(c);
}

// ── Gender ───────────────────────────────────────────────

function preferenceGenderMatches(preferred_gender, cat_gender) {
  if (!preferred_gender || !cat_gender) return false;
  const p = normalizeText(preferred_gender);
  if (p === 'no preference') return true;
  return p === normalizeText(cat_gender);
}

// ── Age match ────────────────────────────────────────────

function preferenceAgeMatches(preferred_age, age_months) {
  if (preferred_age == null || age_months == null || Number.isNaN(Number(age_months))) {
    return false;
  }
  const range = parsePreferredAgeRangeMonths(preferred_age);
  if (!range) return false;
  const n = Number(age_months);
  return n >= range.min && n <= range.max;
}

// ── Scoring ──────────────────────────────────────────────

/**
 * @param {object}      cat           - Prisma Cat row (includes tags[])
 * @param {object|null} pref          - AdopterPreference row or null
 * @param {Set<string>} likedBreedSet - breeds from cats the user liked
 * @param {Set<string>} likedTagSet   - tags  from cats the user liked
 */
function scoreCatForUser(cat, pref, likedBreedSet, likedTagSet) {
  let score = 0;
  const breakdown = {
    preferred_breed: 0,
    preferred_gender: 0,
    preferred_age: 0,
    liked_breed: 0,
    liked_tags: 0
  };

  if (pref) {
    if (preferenceBreedMatches(pref.preferred_breed, cat.breed)) {
      breakdown.preferred_breed = WEIGHT_PREF_BREED;
      score += WEIGHT_PREF_BREED;
    }
    if (preferenceGenderMatches(pref.preferred_gender, cat.gender)) {
      breakdown.preferred_gender = WEIGHT_PREF_GENDER;
      score += WEIGHT_PREF_GENDER;
    }
    if (preferenceAgeMatches(pref.preferred_age, cat.age_months)) {
      breakdown.preferred_age = WEIGHT_PREF_AGE;
      score += WEIGHT_PREF_AGE;
    }
  }

  const catBreedNorm = normalizeText(cat.breed);
  if (catBreedNorm && likedBreedSet.has(catBreedNorm)) {
    breakdown.liked_breed = WEIGHT_LIKED_BREED;
    score += WEIGHT_LIKED_BREED;
  }

  if (Array.isArray(cat.tags)) {
    for (const row of cat.tags) {
      const t = normalizeText(row.tag);
      if (t && likedTagSet.has(t)) {
        breakdown.liked_tags += WEIGHT_LIKED_TAG;
        score += WEIGHT_LIKED_TAG;
      }
    }
  }

  return {
    score,
    recommendation_score: score,
    score_breakdown: breakdown
  };
}

module.exports = {
  scoreCatForUser,
  normalizeText,
  WEIGHT_PREF_BREED,
  WEIGHT_PREF_GENDER,
  WEIGHT_PREF_AGE,
  WEIGHT_LIKED_BREED,
  WEIGHT_LIKED_TAG
};
