# MEMBER3 Test Guide

## 1. Scope

This guide verifies Member3 deliverables:

- Community unified flow: `Recommended / Follow / Create post`
- Author profile navigation and follow/unfollow
- Cat profile conditional display by registration choice (`I have a cat`)
- Notifications (`Likes / New Follows / Comments`) with unread/read state
- Notification read status persistence in database

---

## 2. Environment Setup

### 2.1 Required software

- Node.js `18+`
- PostgreSQL (local)
- Browser: Chrome or Edge
- Frontend static server (Live Server or Python http server)

### 2.2 Backend environment variables

Create/update `backend/.env`:

```env
PORT=3000
NODE_ENV=development
TZ=Asia/Shanghai
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/catface_dev"
JWT_SECRET=catface_local_dev_secret_1234567890abcdef
JWT_EXPIRES_IN=7d
```

### 2.3 Install dependencies and prepare DB

```powershell
cd d:\4007\codes\catface\backend
npm install
npx prisma generate
npx prisma db push
```

---

## 3. Start Services

### 3.1 Start backend

```powershell
cd d:\4007\codes\catface\backend
npm run start
```

Expected log:

- `Server running on port 3000`

### 3.2 Start frontend

```powershell
cd d:\4007\codes\catface\frontend
python -m http.server 5500
```

Open:

- `http://localhost:5500/pages/index.html`

---

## 4. Test Accounts Preparation

Create two fresh accounts from:

- `http://localhost:5500/pages/log-in.html`

Accounts:

- **Account A (Owner)**: select `I have a cat`
- **Account B (Adopter)**: select `I want to adopt`

Tip: use separate browser windows (or incognito) to avoid session conflicts.

---

## 5. Functional Test Cases

## Case A - Community default entry

Steps:

1. Open `index.html`
2. Click left nav `Community`

Expected:

- Directly opens `cat-facebook.html?feed=recommended`
- Recommended post feed is visible (not blank)
- Left navigation remains visible on community page

## Case B - Feed tab switching

Steps:

1. In community page, click `Recommended`
2. Click `Follow`

Expected:

- Recommended shows general feed
- Follow shows only posts from followed authors

## Case C - Avatar to author profile

Steps:

1. In Recommended, click any post author avatar/name

Expected:

- Opens `cat-profile.html?...`
- Should not be intercepted by post-detail open behavior

## Case D - Follow/Unfollow sync

Steps:

1. Login as Account B, open Account A profile
2. Click `Follow`
3. Back to community, switch to `Follow`
4. Click `Following` again to unfollow

Expected:

- Button toggles `Follow` <-> `Following`
- Follow feed updates accordingly

## Case E - Cat profile conditional display (critical)

Steps:

1. Open Account A profile
2. Open Account B profile

Expected:

- Account A (Owner): `Cat profile` section is shown (details or placeholder)
- Account B (Adopter): `Cat profile` section is hidden

## Case F - Create post flow

Steps:

1. Click `Create post`
2. Upload image + input text
3. Publish

Expected:

- Post created successfully
- New post appears in Recommended feed
- Post supports like/comment interactions

## Case G - Notifications categories and read state

Steps:

1. Open `notifications.html`
2. Switch between `Likes / New Follows / Comments`
3. Open one notification item

Expected:

- Category switching works
- Data list corresponds to selected category
- Unread badge counts update
- Opened notification becomes read

## Case H - Notification DB persistence (technical)

Run:

```powershell
cd d:\4007\codes\catface\backend
node scripts/member3-smoke.js
```

Expected output includes:

- `notifications.before` has unread item (`unread_count: 1`)
- `marked.success: true`
- `notifications.after` item changes to `is_read: true` and `unread_count: 0`

Optional direct DB-read verification:

```powershell
node scripts/verify-notifications-db.js <targetUserId>
```

Expected:

- `persisted_in_db: true` (when unread item exists and gets marked)

---

## 6. Pass Criteria

Release candidate is acceptable only if:

- All cases A-H pass
- No blocking frontend error/404 on tested flows
- Follow state and notification read state remain consistent after refresh
- Cat profile conditional display matches registration selection

---

## 7. Bug Report Template

When reporting defects, include:

- Page URL
- Test account used
- Steps to reproduce
- Actual result
- Expected result
- Screenshot/video
- Console/network error (if any)

