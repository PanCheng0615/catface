import base64
import hashlib
import json
import re
import sys
from pathlib import Path


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


def load_payload(path_str):
    payload_path = Path(path_str)
    return json.loads(payload_path.read_text(encoding="utf-8"))


def decode_data_url(data_url):
    match = re.match(r"^data:(?P<mime>[^;]+);base64,(?P<data>.+)$", data_url)
    if not match:
      raise ValueError("image_data_url must be a valid base64 data URL")
    return base64.b64decode(match.group("data"))


def build_fallback_face_id(image_bytes):
    digest = hashlib.sha256(image_bytes).hexdigest().upper()
    return f"CAT-FACE-{digest[:12]}"


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
        payload = load_payload(sys.argv[1])
        image_data_url = str(payload.get("image_data_url", "")).strip()
        if not image_data_url:
            emit(
                {
                    "success": False,
                    "error": "ValidationError",
                    "message": "image_data_url is required.",
                    "status_code": 422,
                }
            )
            return

        image_bytes = decode_data_url(image_data_url)
        generated_id = build_fallback_face_id(image_bytes)

        emit(
            {
                "success": True,
                "generated_id": generated_id,
                "provider": "hash_fallback",
                "note": "Notebook-style cat face runtime is not packaged in this repository yet, so the current integration uses a deterministic image fingerprint as a fallback.",
            }
        )
    except Exception as error:
        emit(
            {
                "success": False,
                "error": "CatFaceServiceError",
                "message": str(error),
                "status_code": 500,
            }
        )


if __name__ == "__main__":
    main()
