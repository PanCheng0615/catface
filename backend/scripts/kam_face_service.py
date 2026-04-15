import argparse
import hashlib
import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
DEFAULT_BASE = REPO_ROOT / "KAM_Face_pipeline_demo"
DEFAULT_WEIGHTS_DIR = DEFAULT_BASE / "weights"
EXPECTED_WEIGHT_FILES = ("best_body.pt", "best_face.pt", "best_backbone.pt")


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


def to_plain_value(value):
    if value is None:
        return None
    if hasattr(value, "detach"):
        value = value.detach().cpu()
    if hasattr(value, "numpy"):
        value = value.numpy()
    if hasattr(value, "tolist"):
        return value.tolist()
    return value


def normalize_embedding(feat):
    plain = to_plain_value(feat)
    if plain is None:
        return None
    if isinstance(plain, (list, tuple)):
        if plain and isinstance(plain[0], (list, tuple)):
            return [float(item) for row in plain for item in row]
        return [float(item) for item in plain]
    return None


def build_face_code(image_bytes, embedding):
    digest_source = image_bytes
    if embedding:
        digest_source = json.dumps(embedding, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    digest = hashlib.sha256(digest_source).hexdigest().upper()
    return f"CAT-FACE-{digest[:12]}"


def get_runtime_paths():
    base = Path(os.environ.get("KAM_FACE_BASE", str(DEFAULT_BASE))).expanduser().resolve()
    weights_dir = Path(os.environ.get("KAM_FACE_WEIGHTS_DIR", str(DEFAULT_WEIGHTS_DIR))).expanduser().resolve()
    return base, weights_dir


def detect_device(torch_module):
    configured = os.environ.get("KAM_FACE_DEVICE")
    if configured:
        return configured
    return "cuda" if torch_module.cuda.is_available() else "cpu"


def validate_runtime(base, weights_dir):
    missing = []
    if not base.exists():
        missing.append(str(base))
    for filename in EXPECTED_WEIGHT_FILES:
        candidate = weights_dir / filename
        if not candidate.exists():
            missing.append(str(candidate))
    return missing


def load_pipeline(base, weights_dir):
    if str(base) not in sys.path:
        sys.path.insert(0, str(base))

    import torch  # noqa: WPS433
    from KAMFace.pipeline import KAMFacePipeline  # noqa: WPS433

    device = detect_device(torch)
    pipe = KAMFacePipeline(
        yolo_body_detector_path=str(weights_dir / "best_body.pt"),
        yolo_face_detector_path=str(weights_dir / "best_face.pt"),
        pet_face_backbone_path=str(weights_dir / "best_backbone.pt"),
        device=device,
    )
    return pipe, device


def run_inference(image_path):
    image_bytes = image_path.read_bytes()
    base, weights_dir = get_runtime_paths()
    missing = validate_runtime(base, weights_dir)
    if missing:
        return {
            "success": False,
            "provider": "kam_face_pipeline",
            "error_code": "RuntimeMissing",
            "message": "KAMFace code or model weights are missing.",
            "missing_paths": missing,
            "expected_base": str(base),
            "expected_weights_dir": str(weights_dir),
        }

    try:
        pipe, device = load_pipeline(base, weights_dir)
    except Exception as exc:  # pragma: no cover
        return {
            "success": False,
            "provider": "kam_face_pipeline",
            "error_code": "PipelineInitFailed",
            "message": str(exc),
            "expected_base": str(base),
            "expected_weights_dir": str(weights_dir),
        }

    results = pipe(str(image_path))
    if not results:
        return {
            "success": True,
            "provider": "kam_face_pipeline",
            "device": device,
            "face_detected": False,
            "message": "No cat face was detected in the uploaded image.",
        }

    first = results[0]
    embedding = normalize_embedding(first.get("feat"))
    if not embedding:
        return {
            "success": False,
            "provider": "kam_face_pipeline",
            "device": device,
            "error_code": "EmbeddingMissing",
            "message": "The model ran, but no embedding was returned.",
        }

    return {
        "success": True,
        "provider": "kam_face_pipeline",
        "device": device,
        "face_detected": True,
        "embedding": embedding,
        "embedding_dim": len(embedding),
        "suggested_face_code": build_face_code(image_bytes, embedding),
        "body_bbox": to_plain_value(first.get("body_bbox")),
        "face_kpts": to_plain_value(first.get("face_kpts")),
        "img_path": str(image_path),
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Extract cat-face embedding using KAMFacePipeline.")
    parser.add_argument("image_path", help="Local image path for inference.")
    return parser.parse_args()


def main():
    args = parse_args()
    image_path = Path(args.image_path).expanduser().resolve()
    if not image_path.exists():
        emit(
            {
                "success": False,
                "error_code": "InputImageMissing",
                "message": f"Input image not found: {image_path}",
            }
        )
        return

    try:
        payload = run_inference(image_path)
    except Exception as exc:  # pragma: no cover
        payload = {
            "success": False,
            "provider": "kam_face_pipeline",
            "error_code": "InferenceFailed",
            "message": str(exc),
        }

    emit(payload)


if __name__ == "__main__":
    main()
