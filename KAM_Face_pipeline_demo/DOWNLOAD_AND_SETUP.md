# KAM Face Pipeline Setup

This folder contains the cat face recognition pipeline code. The large model weights are not stored in Git because they are too large for normal repository upload.

## Required files

Keep this code folder in the repo:

- `KAM_Face_pipeline_demo/KAMFace/`
- `KAM_Face_pipeline_demo/demo_cat_images/`
- `KAM_Face_pipeline_demo/requirements.txt`

Download these model files separately and place them in:

- `KAM_Face_pipeline_demo/weights/best_backbone.pt`
- `KAM_Face_pipeline_demo/weights/best_body.pt`
- `KAM_Face_pipeline_demo/weights/best_face.pt`

## Recommended upload method for large weights

Use one of these:

1. GitHub Release assets
2. Google Drive shared folder
3. OneDrive / Dropbox shared folder

Then share the download links with teammates in this document or in the main project README.

## Environment setup

From the repository root:

```bash
cd KAM_Face_pipeline_demo
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

If `torch` or `torchvision` fails to install on a teammate's machine, install them manually first for that platform, then rerun:

```bash
pip install -r requirements.txt
```

## Expected folder structure

```text
KAM_Face_pipeline_demo/
├── KAMFace/
├── demo_cat_images/
├── requirements.txt
├── DOWNLOAD_AND_SETUP.md
└── weights/
    ├── best_backbone.pt
    ├── best_body.pt
    └── best_face.pt
```

## Minimal usage example

```python
from KAMFace.pipeline import KAMFacePipeline

pipe = KAMFacePipeline(
    yolo_body_detector_path="weights/best_body.pt",
    yolo_face_detector_path="weights/best_face.pt",
    pet_face_backbone_path="weights/best_backbone.pt",
    device="cpu",
)

result = pipe("demo_cat_images/米米豬1.jpg")
print(len(result))
```

## Notes for teammates

- Do not commit `.venv/` or other local virtual environments.
- Do not commit downloaded model weights to normal Git history.
- If you update model files, replace the external download link instead of re-uploading them into the repo.
- If you use Apple Silicon or GPU acceleration, you may need a machine-specific `torch` install.

## Download links

Fill in your actual links here:

- `best_backbone.pt`: `<add link here>`
- `best_body.pt`: `<add link here>`
- `best_face.pt`: `<add link here>`
