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

const SCORING_MODES = {
  LEGACY: 'legacy',
  DEMO: 'demo'
};

let _weights = { ...DEFAULT_WEIGHTS };
let _mode = SCORING_MODES.LEGACY;

function normalizeMode(mode) {
  const value = normalizeText(mode);
  if (value === SCORING_MODES.LEGACY) return SCORING_MODES.LEGACY;
  if (value === SCORING_MODES.DEMO) return SCORING_MODES.DEMO;
  return '';
}

function loadWeights() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const nextMode = normalizeMode(parsed.mode);
    _mode = nextMode || SCORING_MODES.LEGACY;
    _weights = { ...DEFAULT_WEIGHTS, ...parsed };
  } catch {
    _weights = { ...DEFAULT_WEIGHTS };
    _mode = SCORING_MODES.LEGACY;
  }
  return _weights;
}

loadWeights();

function getWeights() {
  return { mode: _mode, ..._weights };
}

function updateWeights(patch) {
  const updated = { ..._weights };
  const nextMode = normalizeMode(patch && patch.mode);
  for (const [key, val] of Object.entries(patch)) {
    if (key in DEFAULT_WEIGHTS && typeof val === 'number' && val >= 0) {
      updated[key] = val;
    }
  }
  if (nextMode) {
    _mode = nextMode;
  }
  _weights = updated;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ mode: _mode, ..._weights }, null, 2) + '\n', 'utf-8');
  return { mode: _mode, ..._weights };
}

// ── Helpers ─────────────────────────────────────────────

function normalizeText(s) {
  if (s == null) return '';
  return String(s).trim().toLowerCase();
}

function isNeutralPreference(value) {
  const normalized = normalizeText(value);
  return !normalized || normalized === 'any' || normalized === 'no preference' || normalized === 'no_preference';
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

function parsePreferredAgeRangeMonthsDemo(preferred_age) {
  if (isNeutralPreference(preferred_age)) return null;
  const normalized = normalizeText(preferred_age);
  if (normalized === 'young') {
    return { min: 6, max: 24 };
  }
  return parsePreferredAgeRangeMonths(preferred_age);
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
  if (p === 'no preference' || p === 'no_preference') return true;
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

function preferenceAgeMatchesDemo(preferred_age, age_months) {
  if (isNeutralPreference(preferred_age) || age_months == null || Number.isNaN(Number(age_months))) {
    return false;
  }
  const range = parsePreferredAgeRangeMonthsDemo(preferred_age);
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
function scoreCatForUserLegacy(cat, pref, likedBreedSet, likedTagSet) {
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

function scoreCatForUserDemo(cat, pref, likedBreedSet, likedTagSet) {
  const w = _weights;
  let score = 0;
  let matchedPreferenceCount = 0;
  const breakdown = {
    preferred_breed: 0,
    preferred_gender: 0,
    preferred_age: 0,
    preferred_color: 0,
    liked_breed: 0,
    liked_tags: 0,
    preference_synergy: 0
  };

  if (pref) {
    if (!isNeutralPreference(pref.preferred_breed)) {
      if (preferenceBreedMatches(pref.preferred_breed, cat.breed)) {
        breakdown.preferred_breed = w.preferred_breed + 10;
        score += breakdown.preferred_breed;
        matchedPreferenceCount += 1;
      } else {
        breakdown.preferred_breed = -Math.max(10, Math.round(w.preferred_breed * 0.6));
        score += breakdown.preferred_breed;
      }
    }

    if (!isNeutralPreference(pref.preferred_gender)) {
      if (preferenceGenderMatches(pref.preferred_gender, cat.gender)) {
        breakdown.preferred_gender = w.preferred_gender + 5;
        score += breakdown.preferred_gender;
        matchedPreferenceCount += 1;
      } else {
        breakdown.preferred_gender = -Math.max(6, Math.round(w.preferred_gender * 0.75));
        score += breakdown.preferred_gender;
      }
    }

    if (!isNeutralPreference(pref.preferred_age)) {
      if (preferenceAgeMatchesDemo(pref.preferred_age, cat.age_months)) {
        breakdown.preferred_age = w.preferred_age + 8;
        score += breakdown.preferred_age;
        matchedPreferenceCount += 1;
      } else {
        breakdown.preferred_age = -Math.max(6, Math.round(w.preferred_age * 0.75));
        score += breakdown.preferred_age;
      }
    }

    if (!isNeutralPreference(pref.preferred_color)) {
      if (preferenceColorMatches(pref.preferred_color, cat.color)) {
        breakdown.preferred_color = w.preferred_color + 4;
        score += breakdown.preferred_color;
        matchedPreferenceCount += 1;
      } else {
        breakdown.preferred_color = -Math.max(4, Math.round(w.preferred_color * 0.6));
        score += breakdown.preferred_color;
      }
    }
  }

  if (w.liked_breed > 0) {
    const catBreedNorm = normalizeText(cat.breed);
    if (catBreedNorm && likedBreedSet.has(catBreedNorm)) {
      breakdown.liked_breed = w.liked_breed + 8;
      score += breakdown.liked_breed;
    }
  }

  if (w.liked_tag > 0 && Array.isArray(cat.tags)) {
    let matchedTags = 0;
    for (const row of cat.tags) {
      const t = normalizeText(row.tag);
      if (t && likedTagSet.has(t)) matchedTags += 1;
    }
    if (matchedTags > 0) {
      breakdown.liked_tags = Math.min(30, matchedTags * Math.max(10, w.liked_tag));
      score += breakdown.liked_tags;
    }
  }

  if (matchedPreferenceCount >= 2) {
    breakdown.preference_synergy = matchedPreferenceCount >= 3 ? 18 : 10;
    score += breakdown.preference_synergy;
  }

  return {
    score,
    recommendation_score: score,
    score_breakdown: breakdown
  };
}

function scoreCatForUser(cat, pref, likedBreedSet, likedTagSet) {
  if (_mode === SCORING_MODES.DEMO) {
    return scoreCatForUserDemo(cat, pref, likedBreedSet, likedTagSet);
  }
  return scoreCatForUserLegacy(cat, pref, likedBreedSet, likedTagSet);
}

module.exports = {
  scoreCatForUser,
  normalizeText,
  getWeights,
  updateWeights,
  loadWeights,
  DEFAULT_WEIGHTS,
  SCORING_MODES
};
