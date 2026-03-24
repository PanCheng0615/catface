# Member1 Cat Face Deploy Guide

## Goal

Member1 is responsible for the user `login / sign up` flow.

For the **owner sign-up** path, the page should:

1. let the user upload a cat face image
2. call the cat-face recognition backend
3. generate or match a `cat id`
4. finish account registration
5. save the cat profile and face embedding into the database

This document explains how to connect Member1's page to the existing cat-face runtime.

---

## Current Runtime Status

The cat-face model is already runnable locally in this repository.

Model assets:

- `KAM_Face_pipeline_demo/KAMFace`
- `KAM_Face_pipeline_demo/weights/best_body.pt`
- `KAM_Face_pipeline_demo/weights/best_face.pt`
- `KAM_Face_pipeline_demo/weights/best_backbone.pt`

Python runtime:

- `backend/.venv-catface-id`

Core backend files already prepared:

- `backend/scripts/kam_face_service.py`
- `backend/src/services/cat-face.service.js`
- `backend/src/controllers/rescue.controller.js`
- `backend/src/routes/rescue.routes.js`

Database fields already prepared:

- `backend/prisma/schema.prisma`
- `Cat.face_code`
- `CatFaceEmbedding`

Current threshold:

- `backend/.env`
- `KAM_FACE_THRESHOLD=0.8`

---

## Important Limitation

The existing endpoint:

- `POST /api/rescue/cat-face/identify`

is currently protected for:

- `rescue_staff`
- `admin`

So Member1 **should not directly use this rescue endpoint in the public sign-up flow**.

For owner sign-up, the recommended solution is to add a separate public endpoint, for example:

- `POST /api/auth/cat-face/identify`

This endpoint should reuse the same backend service, but must not require an organization token.

---

## Recommended Integration Flow

### A. Frontend owner sign-up

Current owner sign-up UI already has the right placeholders in:

- `frontend/pages/log-in.html`

Relevant fields already exist:

- `#mycat-face`
- `#mycat-face-preview`
- `#mycat-id-display`
- `#mycat-name`
- `#mycat-breed`
- `#mycat-gender`
- `#mycat-birthday`

Current problem:

- the page still uses a fake local ID:
- `var generatedId = "CAT-" + Date.now().toString(36).toUpperCase();`

Member1 should replace that fake ID logic with:

1. when user selects a cat image, read it as `base64 data URL`
2. call the backend cat-face identify API
3. receive:
   - `suggested_face_code`
   - `embedding`
   - `matched`
   - `best_match`
4. fill `#mycat-id-display`
5. store returned `embedding` in memory until sign-up is submitted

---

### B. Backend public identify endpoint

Recommended new route:

- `POST /api/auth/cat-face/identify`

Recommended response format:

```json
{
  "success": true,
  "data": {
    "matched": false,
    "suggested_face_code": "CAT-FACE-703CD5007C55",
    "embedding": [0.12, -0.03, "..."],
    "embedding_dim": 512,
    "best_match": null,
    "top_matches": [],
    "threshold": 0.8
  }
}
```

Implementation suggestion:

- reuse `runKamFaceInference()` from `backend/src/services/cat-face.service.js`
- reuse `findCatFaceMatches()` from `backend/src/services/cat-face.service.js`
- do **not** duplicate Python execution logic

---

### C. Sign-up submit

When the owner finishes sign-up:

1. create the user account
2. create the cat record
3. save `face_code` into `Cat.face_code`
4. save the returned `embedding` into `CatFaceEmbedding`

Best practice:

- do this in one backend request
- use a transaction

Recommended backend flow:

1. `POST /api/auth/register-owner-with-cat`
2. payload includes:
   - user fields
   - cat fields
   - `face_code`
   - `embedding`
   - `source_photo_url` or raw image if you want to upload it later
3. backend creates:
   - `User`
   - `Cat`
   - `CatFaceEmbedding`

If Member1 does not want to add a combined endpoint, then the fallback is:

1. register user
2. create cat
3. call `cat-face/register`

But combined registration is cleaner.

---

## Exact Files Member1 Should Modify

### Frontend

- `frontend/pages/log-in.html`

What to change:

- replace fake `generatedId`
- call real cat-face identify endpoint after file upload
- keep returned `embedding` in a variable
- submit cat info together with sign-up payload

### Backend

- `backend/src/controllers/auth.controller.js`
- `backend/src/routes/auth.routes.js`

What to add:

- public cat-face identify endpoint for sign-up
- optionally combined owner registration endpoint

### Reuse existing backend helper

- `backend/src/services/cat-face.service.js`

Do not reimplement:

- base64 parsing
- temporary file handling
- Python execution
- cosine similarity

---

## Suggested Frontend Behavior

After image upload:

- if `matched === true`
  - show: "This cat may already exist in the system"
  - show existing `face_code`
  - optionally ask user to confirm before continuing

- if `matched === false`
  - show returned `suggested_face_code`
  - allow normal sign-up

- if no face detected
  - block sign-up for owner type
  - ask user to upload a clearer cat-face image

---

## Example Frontend Pseudocode

```js
let pendingCatFaceEmbedding = null;
let pendingCatFaceCode = "";

async function identifyOwnerCat(imageDataUrl) {
  const response = await fetch("http://localhost:3000/api/auth/cat-face/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_data_url: imageDataUrl })
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Cat face identification failed.");
  }

  pendingCatFaceEmbedding = payload.data.embedding;
  pendingCatFaceCode = payload.data.best_match?.cat?.face_code || payload.data.suggested_face_code || "";
  myCatIdDisplay.value = pendingCatFaceCode;
}
```

---

## Example Backend Reuse Pattern

Inside auth controller:

```js
const { runKamFaceInference, findCatFaceMatches } = require('../services/cat-face.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identifySignupCatFace(req, res) {
  const { image_data_url } = req.body;
  const inference = await runKamFaceInference(image_data_url);
  const threshold = Number(process.env.KAM_FACE_THRESHOLD || '0.8');
  const matchResult = await findCatFaceMatches(prisma, inference.embedding, threshold);

  return res.json({
    success: true,
    data: {
      matched: Boolean(matchResult.bestMatch),
      suggested_face_code: inference.suggested_face_code,
      embedding: inference.embedding,
      best_match: matchResult.bestMatch,
      top_matches: matchResult.topMatches,
      threshold
    }
  });
}
```

---

## Deployment Steps

Member1 should make sure the following are available locally:

### 1. Backend env

`backend/.env` must include:

```env
KAM_FACE_BASE=../KAM_Face_pipeline_demo
KAM_FACE_WEIGHTS_DIR=../KAM_Face_pipeline_demo/weights
KAM_FACE_DEVICE=cpu
KAM_FACE_THRESHOLD=0.8
```

### 2. Database sync

Run:

```bash
cd backend
npx prisma db push --accept-data-loss
```

### 3. Python runtime

If missing:

```bash
cd backend
python3.12 -m venv .venv-catface-id
./.venv-catface-id/bin/pip install --upgrade pip
./.venv-catface-id/bin/pip install torch torchvision ultralytics opencv-python scikit-image timm pillow numpy
```

### 4. Start backend

```bash
cd backend
npm run dev
```

### 5. Frontend test

Open:

- `frontend/pages/log-in.html`

Switch to:

- `Sign up`
- select owner type
- upload a cat face image

Expected result:

- a real `Cat ID` is returned from the model instead of a fake timestamp-based ID

---

## Current Known Good Test Data

Folder:

- `KAM_Face_pipeline_demo/demo_cat_images`

Tested results:

- `米米豬1.jpg` vs `米米豬2.jpg` cosine similarity: about `0.828`
- `米米豬1.jpg` vs `紐紐糖3.jpg` cosine similarity: about `0.076`

This is why the current threshold was adjusted to:

- `0.8`

---

## Final Recommendation To Member1

Do this in order:

1. stop using the fake local `CAT-` generator in `frontend/pages/log-in.html`
2. add a public auth-side cat-face identify endpoint
3. reuse the existing backend cat-face service instead of rewriting model logic
4. save both `face_code` and `embedding` during owner sign-up
5. test with `demo_cat_images` before merging

If Member1 only changes the frontend but does not save `embedding`, the system will show a generated cat ID but will **not** support future duplicate-cat matching.
