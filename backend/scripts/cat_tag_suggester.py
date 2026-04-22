import json
import math
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
VOCAB_PATH = PROJECT_ROOT / "src" / "data" / "cat-tag-vocabulary.json"
NEGATION_HINTS = (" not ", " no ", " never ", " without ", " isn't ", " aren't ", " doesn't ", " don't ", " didnt ", " doesn't ", " not-", "non ")
FIELD_WEIGHTS = {
    "personality": 1.35,
    "notes": 1.0,
    "health": 0.85,
}
GENERIC_PHRASES = {
    "personality",
    "health",
    "notes",
    "note",
    "status",
    "currently",
    "very",
    "quite",
    "really",
    "more",
    "less",
    "little",
    "cat",
    "kitten",
}
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "for", "from", "has",
    "have", "he", "her", "hers", "him", "his", "in", "into", "is", "it", "its", "of", "on",
    "or", "she", "that", "the", "their", "them", "they", "this", "to", "very", "was", "we",
    "will", "with", "would", "you", "our", "can", "does", "did", "after", "before", "around",
    "just", "also", "gets", "get", "got", "than", "then", "too", "not", "no", "still"
}
STEM_SUFFIXES = ("ingly", "edly", "ing", "edly", "edly", "ed", "ly", "ness", "ment", "tion", "s")
SEMANTIC_ALIAS_MIN_SIMILARITY = 0.46
SEMANTIC_FALLBACK_MIN_SCORE = 0.48
SEMANTIC_BONUS_WEIGHT = 0.35
EMBEDDING_BONUS_WEIGHT = 0.55
EMBEDDING_FALLBACK_MIN_SCORE = 0.32
HEURISTIC_TAG_PATTERNS = {
    "friendly": [
        (r"\b(good|great|nice|sweet|lovely)\s+personality\b", 0.78),
        (r"\bsuper\s+good\s+personality\b", 0.86),
        (r"\bfriendly\b", 0.88),
        (r"\bpeople[-\s]?friendly\b", 0.88),
        (r"\bloves?\s+people\b", 0.82),
    ],
    "affectionate": [
        (r"\bclose\s+to\s+(people|family|humans?)\b", 0.74),
        (r"\bsuper\s+sweet\b", 0.75),
        (r"\bvery\s+sweet\b", 0.72),
        (r"\baffectionate\b", 0.86),
        (r"\bloves?\s+cuddles?\b", 0.78),
    ],
    "calm": [
        (r"\bcalm\b", 0.86),
        (r"\bgentle\b", 0.72),
        (r"\beasygoing\b", 0.74),
        (r"\bquiet\b", 0.72),
    ],
    "happy": [
        (r"\bhappy\b", 0.88),
        (r"\bcheerful\b", 0.84),
        (r"\bjoyful\b", 0.82),
        (r"\bin\s+a\s+good\s+mood\b", 0.76),
    ],
    "sweet": [
        (r"\bsweet\b", 0.84),
        (r"\bvery\s+sweet\b", 0.86),
        (r"\bsuper\s+sweet\b", 0.88),
        (r"\blovely\b", 0.74),
    ],
    "gentle": [
        (r"\bgentle\b", 0.86),
        (r"\bmild\b", 0.72),
        (r"\bsoft[-\s]?natured\b", 0.8),
        (r"\btender\b", 0.68),
    ],
    "timid": [
        (r"\bnot\s+at\s+ease\b", 0.78),
        (r"\banxious\b", 0.78),
        (r"\bnervous\b", 0.75),
        (r"\beasily\s+startled\b", 0.8),
    ],
    "cute": [
        (r"\bcute\b", 0.82),
        (r"\badorable\b", 0.82),
        (r"\bprecious\b", 0.74),
        (r"\bcharming\b", 0.7),
    ],
    "needs-companionship": [
        (r"\bneeds?\s+(company|companionship)\b", 0.86),
        (r"\bgets?\s+anxious\s+when\s+alone\b", 0.85),
        (r"\bclose\s+to\s+family\b", 0.7),
    ],
}


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def normalize_text(text):
    value = str(text or "").strip().lower()
    if not value:
        return ""

    replacements = {
        "\u3000": " ",
        "\n": " ",
        "\r": " ",
        "\t": " ",
        "，": ",",
        "。": ".",
        "；": ";",
        "：": ":",
        "（": "(",
        "）": ")",
        "！": "!",
        "？": "?",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)

    return re.sub(r"\s+", " ", value)


def is_negated(text, start_index):
    prefix = f" {text[max(0, start_index - 20):start_index]} "
    return any(hint in prefix for hint in NEGATION_HINTS)


def find_term_matches(text, term):
    matches = []
    search_from = 0
    while search_from < len(text):
        index = text.find(term, search_from)
        if index == -1:
            break
        matches.append(index)
        search_from = index + len(term)
    return matches


def tokenize(text):
    return [
        token.strip("- ")
        for token in re.findall(r"[a-z][a-z-]{1,24}", text)
        if token.strip("- ") and token.strip("- ") not in STOPWORDS
    ]


def stem_token(token):
    value = token.lower().strip("- ")
    if len(value) <= 3:
        return value

    for suffix in STEM_SUFFIXES:
        if value.endswith(suffix) and len(value) - len(suffix) >= 3:
            return value[: -len(suffix)]
    return value


def embedding_tokens(text):
    tokens = tokenize(text)
    if not tokens:
        return []

    stems = [stem_token(token) for token in tokens if stem_token(token)]
    if not stems:
        return []

    bigrams = [f"{stems[index]}_{stems[index + 1]}" for index in range(len(stems) - 1)]
    return stems + bigrams


def build_sparse_embedding(text):
    vector = {}
    for token in embedding_tokens(text):
        vector[token] = vector.get(token, 0.0) + 1.0
    return vector


def cosine_sparse_similarity(vector_a, vector_b):
    if not vector_a or not vector_b:
        return 0.0

    dot = 0.0
    for key, value in vector_a.items():
        dot += value * vector_b.get(key, 0.0)

    norm_a = math.sqrt(sum(value * value for value in vector_a.values()))
    norm_b = math.sqrt(sum(value * value for value in vector_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


def semantic_alias_similarity(text, alias):
    normalized_alias = normalize_text(alias)
    if not normalized_alias:
        return 0.0

    alias_tokens = tokenize(normalized_alias)
    text_tokens = tokenize(text)
    if not alias_tokens or not text_tokens:
        return 0.0

    alias_stems = {stem_token(token) for token in alias_tokens}
    text_stems = {stem_token(token) for token in text_tokens}
    if not alias_stems or not text_stems:
        return 0.0

    overlap_score = len(alias_stems.intersection(text_stems)) / len(alias_stems)

    sentence_scores = []
    for sentence in re.split(r"[.!?;:]", text):
        sentence = sentence.strip()
        if sentence:
            sentence_scores.append(SequenceMatcher(None, normalized_alias, sentence).ratio())

    sequence_score = max(sentence_scores) if sentence_scores else SequenceMatcher(None, normalized_alias, text).ratio()
    semantic_score = overlap_score * 0.72 + sequence_score * 0.28

    return round(semantic_score, 4)


def heuristic_tag_score(tag, combined_text):
    patterns = HEURISTIC_TAG_PATTERNS.get(tag, [])
    best = 0.0
    for pattern, score in patterns:
        if re.search(pattern, combined_text):
            best = max(best, score)
    return best


def embedding_tag_similarity(field_text, aliases):
    field_vector = build_sparse_embedding(field_text)
    if not field_vector:
        return 0.0

    best = 0.0
    for alias in aliases:
        alias_vector = build_sparse_embedding(normalize_text(alias))
        similarity = cosine_sparse_similarity(field_vector, alias_vector)
        if similarity > best:
            best = similarity
    return round(best, 4)


def collect_keywords(source_text, suggested_tags):
    keywords = []

    for item in suggested_tags:
        for term in item["matched_terms"]:
            if term not in keywords:
                keywords.append(term)

    fragments = re.findall(r"[a-z][a-z-]{2,24}", source_text)
    for fragment in fragments:
        cleaned = fragment.strip("- ").lower()
        if len(cleaned) < 3 or len(cleaned) > 24:
            continue
        if cleaned in GENERIC_PHRASES:
            continue
        if cleaned in STOPWORDS:
            continue
        if cleaned not in keywords:
            keywords.append(cleaned)
        if len(keywords) >= 12:
            break

    return keywords[:12]


def build_explanation(suggested_tags):
    if not suggested_tags:
        return "No strong vocabulary matches were found in the input text."

    parts = []
    for item in suggested_tags[:3]:
        joined_terms = " / ".join(item["matched_terms"][:3])
        parts.append(f"{item['tag']}({joined_terms})")
    return "Matched tag signals: " + ", ".join(parts)


def score_tags(payload, vocabulary):
    candidate_tags = {
        str(tag).strip()
        for tag in payload.get("candidate_tags", []) or []
        if str(tag).strip()
    }
    limit = payload.get("limit", 5)
    try:
        limit = max(1, min(int(limit), 8))
    except (TypeError, ValueError):
        limit = 5

    fields = {
        "personality": normalize_text(payload.get("personality", "")),
        "health": normalize_text(payload.get("health", "")),
        "notes": normalize_text(payload.get("notes", "")),
    }
    combined_text = " ".join(value for value in fields.values() if value).strip()
    if not combined_text:
        return {
            "success": False,
            "error": "ValidationError",
            "message": "At least one of personality, health, or notes is required.",
            "status_code": 422,
        }

    scored = []
    available_tags = []
    for entry in vocabulary["tags"]:
        tag = entry["tag"]
        if candidate_tags and tag not in candidate_tags:
            continue

        available_tags.append(tag)
        aliases = [tag] + list(entry.get("aliases", []))
        score = 0.0
        matched_terms = []
        semantic_score = 0.0
        best_semantic_alias = None
        heuristic_score = heuristic_tag_score(tag, combined_text)
        embedding_score = 0.0

        for field_name, text in fields.items():
            if not text:
                continue

            field_weight = FIELD_WEIGHTS.get(field_name, 1.0)
            field_embedding = embedding_tag_similarity(text, aliases)
            embedding_score += field_embedding * field_weight

            for alias in aliases:
                normalized_alias = normalize_text(alias)
                if not normalized_alias:
                    continue

                alias_semantic = semantic_alias_similarity(text, normalized_alias)
                if alias_semantic > SEMANTIC_ALIAS_MIN_SIMILARITY:
                    weighted_semantic = alias_semantic * field_weight
                    semantic_score += weighted_semantic
                    if not best_semantic_alias or weighted_semantic > best_semantic_alias["score"]:
                        best_semantic_alias = {
                            "term": alias,
                            "score": weighted_semantic
                        }

                for index in find_term_matches(text, normalized_alias):
                    if is_negated(text, index):
                        score -= 0.25
                        continue

                    alias_bonus = 1.0
                    if normalized_alias == normalize_text(tag):
                        alias_bonus = 1.25
                    elif len(normalized_alias) >= 4:
                        alias_bonus = 1.1

                    score += field_weight * alias_bonus
                    if alias not in matched_terms:
                        matched_terms.append(alias)

        if score > 0:
            score += (
                semantic_score * SEMANTIC_BONUS_WEIGHT
                + heuristic_score * 0.55
                + embedding_score * EMBEDDING_BONUS_WEIGHT
            )
            scored.append(
                {
                    "tag": tag,
                    "score": round(score, 4),
                    "matched_terms": matched_terms[:5],
                }
            )
            continue

        if semantic_score >= SEMANTIC_FALLBACK_MIN_SCORE and best_semantic_alias:
            scored.append(
                {
                    "tag": tag,
                    "score": round(semantic_score * 0.85, 4),
                    "matched_terms": [best_semantic_alias["term"], "semantic_fallback"],
                }
            )
            continue

        if heuristic_score > 0:
            scored.append(
                {
                    "tag": tag,
                    "score": round(heuristic_score * 0.9, 4),
                    "matched_terms": ["heuristic_fallback"],
                }
            )
            continue

        if embedding_score >= EMBEDDING_FALLBACK_MIN_SCORE:
            scored.append(
                {
                    "tag": tag,
                    "score": round(embedding_score * 0.8, 4),
                    "matched_terms": ["embedding_fallback"],
                }
            )

    scored.sort(key=lambda item: (-item["score"], item["tag"]))
    suggestions = scored[:limit]

    return {
        "success": True,
        "provider": "cat_tag_vocab_v1_embedding_semantic_fallback",
        "available_tags": available_tags,
        "suggested_tags": suggestions,
        "keywords": collect_keywords(combined_text, suggestions),
        "explanation": build_explanation(suggestions),
        "note": "This version uses a fixed English tag vocabulary with embedding + semantic fallback. It first tries exact alias matching, then uses lightweight local embeddings and semantic similarity when exact hits are weak.",
    }


def main():
    if len(sys.argv) < 2:
        emit(
            {
                "success": False,
                "error": "MissingInput",
                "message": "Payload path is required.",
                "status_code": 422,
            }
        )
        return

    try:
        payload = load_json(sys.argv[1])
        vocabulary = load_json(VOCAB_PATH)
        emit(score_tags(payload, vocabulary))
    except Exception as error:
        emit(
            {
                "success": False,
                "error": "CatTagServiceError",
                "message": str(error),
                "status_code": 500,
            }
        )


if __name__ == "__main__":
    main()
