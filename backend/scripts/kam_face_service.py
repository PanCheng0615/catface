import sys
import json
import os
import base64
import hashlib
import tempfile
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_DIR = BACKEND_DIR.parent

base_dir = (BACKEND_DIR / os.environ.get("KAM_FACE_BASE", "../KAM_Face_pipeline_demo")).resolve()
weights_dir = (BACKEND_DIR / os.environ.get("KAM_FACE_WEIGHTS_DIR", "../KAM_Face_pipeline_demo/weights")).resolve()
device = os.environ.get("KAM_FACE_DEVICE", "cpu")

sys.path.insert(0, str(base_dir))

from KAMFace.pipeline import KAMFacePipeline  # noqa: E402


def parse_image_data_url(image_data_url: str):
    if not image_data_url or "," not in image_data_url:
        raise ValueError("Invalid image_data_url")
    header, encoded = image_data_url.split(",", 1)

    ext = ".jpg"
    lower_header = header.lower()
    if "png" in lower_header:
        ext = ".png"
    elif "webp" in lower_header:
        ext = ".webp"

    return base64.b64decode(encoded), ext


def build_face_code(embedding_np: np.ndarray) -> str:
    digest = hashlib.sha1(embedding_np.astype("float32").tobytes()).hexdigest()[:12].upper()
    return f"CAT-FACE-{digest}"


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}
    image_data_url = payload.get("image_data_url")

    if not image_data_url:
        print(json.dumps({
            "success": False,
            "message": "image_data_url is required"
        }))
        sys.exit(1)

    image_bytes, ext = parse_image_data_url(image_data_url)
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(image_bytes)
            temp_path = tmp.name

        pipeline = KAMFacePipeline(
            yolo_body_detector_path=str(weights_dir / "best_body.pt"),
            yolo_face_detector_path=str(weights_dir / "best_face.pt"),
            pet_face_backbone_path=str(weights_dir / "best_backbone.pt"),
            device=device
        )

        results = pipeline(temp_path)

        if not results:
            print(json.dumps({
                "success": False,
                "message": "No cat face detected"
            }))
            sys.exit(1)

        embedding_np = results[0]["feat"].detach().cpu().numpy().reshape(-1).astype("float32")
        suggested_face_code = build_face_code(embedding_np)

        print(json.dumps({
            "success": True,
            "data": {
                "matched": False,
                "suggested_face_code": suggested_face_code,
                "embedding": embedding_np.tolist(),
                "embedding_dim": int(embedding_np.shape[0]),
                "best_match": None,
                "top_matches": [],
                "threshold": float(os.environ.get("KAM_FACE_THRESHOLD", "0.8"))
            }
        }))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    main()