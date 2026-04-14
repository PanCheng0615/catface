import json
import re
import sys
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

        for field_name, text in fields.items():
            if not text:
                continue

            field_weight = FIELD_WEIGHTS.get(field_name, 1.0)
            for alias in aliases:
                normalized_alias = normalize_text(alias)
                if not normalized_alias:
                    continue

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
            scored.append(
                {
                    "tag": tag,
                    "score": round(score, 4),
                    "matched_terms": matched_terms[:5],
                }
            )

    scored.sort(key=lambda item: (-item["score"], item["tag"]))
    suggestions = scored[:limit]

    return {
        "success": True,
        "provider": "cat_tag_vocab_v1",
        "available_tags": available_tags,
        "suggested_tags": suggestions,
        "keywords": collect_keywords(combined_text, suggestions),
        "explanation": build_explanation(suggestions),
        "note": "This version uses a fixed English tag vocabulary for online keyword and tag suggestion, which works well as a first step before BERTopic/LDA is used offline to refine the taxonomy.",
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
