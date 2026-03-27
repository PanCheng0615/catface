/**
 * Adoption recommendation scoring (rule-based engine)
 * All field names match schema.prisma
 *
 * Weights are loaded from config/scoringConfig.json and can be
 * updated at runtime via PUT /api/adoption/scoring-config.
 *
 * Scoring dimensions (Cat model fields):
 *   breed, gender, age_months, color        — matched against AdopterPreference
 *   CatTag.tag                              — learned from right-swipe history
 *
 * Frontend slider options (English only):
 *
 * preferred_gender : "female" | "male" | "no preference"
 * preferred_age    : "kitten" | "adult" | "senior"
 * preferred_breed  : "domestic short hair" | "british shorthair" | "ragdoll"
 *                    | "persian" | "american shorthair" | "mixed / rescue cat"
 */

const fs = require('fs');
const path = require('path');

// ── Dynamic config ──────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'scoringConfig.json');

const DEFAULT_WEIGHTS = {
  preferred_breed: 25,
  preferred_gender: 15,
  preferred_age: 15,
  preferred_color: 10,
  liked_breed: 20,
  liked_tag: 8
};

let _weights = { ...DEFAULT_WEIGHTS };

function loadWeights() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    _weights = { ...DEFAULT_WEIGHTS, ...parsed };
  } catch {
    _weights = { ...DEFAULT_WEIGHTS };
  }
  return _weights;
}

loadWeights();

function getWeights() {
  return { ..._weights };
}

function updateWeights(patch) {
  const updated = { ..._weights };
  for (const [key, val] of Object.entries(patch)) {
    if (key in DEFAULT_WEIGHTS && typeof val === 'number' && val >= 0) {
      updated[key] = val;
    }
  }
  _weights = updated;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(_weights, null, 2) + '\n', 'utf-8');
  return { ..._weights };
}

// ── Helpers ─────────────────────────────────────────────

function normalizeText(s) {
  if (s == null) return '';
  return String(s).trim().toLowerCase();
}

// ── Age ─────────────────────────────────────────────────

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

// ── Breed ───────────────────────────────────────────────

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

// ── Gender ──────────────────────────────────────────────

function preferenceGenderMatches(preferred_gender, cat_gender) {
  if (!preferred_gender || !cat_gender) return false;
  const p = normalizeText(preferred_gender);
  if (p === 'no preference') return true;
  return p === normalizeText(cat_gender);
}

// ── Age match ───────────────────────────────────────────

function preferenceAgeMatches(preferred_age, age_months) {
  if (preferred_age == null || age_months == null || Number.isNaN(Number(age_months))) {
    return false;
  }
  const range = parsePreferredAgeRangeMonths(preferred_age);
  if (!range) return false;
  const n = Number(age_months);
  return n >= range.min && n <= range.max;
}

// ── Color match ─────────────────────────────────────────

function preferenceColorMatches(preferred_color, cat_color) {
  if (!preferred_color || !cat_color) return false;
  const p = normalizeText(preferred_color);
  const c = normalizeText(cat_color);
  if (!p || !c) return false;
  return c.includes(p) || p.includes(c);
}

// ── Scoring ─────────────────────────────────────────────

/**
 * @param {object}      cat           - Prisma Cat row (includes tags[])
 * @param {object|null} pref          - AdopterPreference row or null
 * @param {Set<string>} likedBreedSet - breeds from cats the user liked
 * @param {Set<string>} likedTagSet   - tags  from cats the user liked
 */
function scoreCatForUser(cat, pref, likedBreedSet, likedTagSet) {
  const w = _weights;
  let score = 0;
  const breakdown = {
    preferred_breed: 0,
    preferred_gender: 0,
    preferred_age: 0,
    preferred_color: 0,
    liked_breed: 0,
    liked_tags: 0
  };

  if (pref) {
    if (w.preferred_breed > 0 && preferenceBreedMatches(pref.preferred_breed, cat.breed)) {
      breakdown.preferred_breed = w.preferred_breed;
      score += w.preferred_breed;
    }
    if (w.preferred_gender > 0 && preferenceGenderMatches(pref.preferred_gender, cat.gender)) {
      breakdown.preferred_gender = w.preferred_gender;
      score += w.preferred_gender;
    }
    if (w.preferred_age > 0 && preferenceAgeMatches(pref.preferred_age, cat.age_months)) {
      breakdown.preferred_age = w.preferred_age;
      score += w.preferred_age;
    }
    if (w.preferred_color > 0 && preferenceColorMatches(pref.preferred_color, cat.color)) {
      breakdown.preferred_color = w.preferred_color;
      score += w.preferred_color;
    }
  }

  if (w.liked_breed > 0) {
    const catBreedNorm = normalizeText(cat.breed);
    if (catBreedNorm && likedBreedSet.has(catBreedNorm)) {
      breakdown.liked_breed = w.liked_breed;
      score += w.liked_breed;
    }
  }

  if (w.liked_tag > 0 && Array.isArray(cat.tags)) {
    for (const row of cat.tags) {
      const t = normalizeText(row.tag);
      if (t && likedTagSet.has(t)) {
        breakdown.liked_tags += w.liked_tag;
        score += w.liked_tag;
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
  getWeights,
  updateWeights,
  loadWeights,
  DEFAULT_WEIGHTS
};
