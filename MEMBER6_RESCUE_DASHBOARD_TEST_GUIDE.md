# Member 6 Test Guide

This document is for teammates or reviewers who need to test the rescue organization features completed by Member 6.

## Scope

Features covered in this round:

- Organization login
- Rescue dashboard analytics
- Cat List database integration
- Add New Cat / Edit Cat
- Application Review
- Notifications / chat
- Organization logout
- Cat Face ID flow in Add New Cat

## Pre-test Setup

### 1. Backend

From `backend/`:

```bash
npm install
npm run db:generate
npm run dev
```

Expected result:

- Backend starts on `http://localhost:3000`
- `http://localhost:3000/api/healthcheck` returns success

### 2. Database

Make sure the local database is connected and already contains:

- at least one `Organization`
- rescue cats
- adoption applications
- chat/conversation data if available

Recommended test organization account:

- Email: `rescue@catface.local`
- Password: `1234`

### 3. Frontend

Open the frontend page through a browser or static server:

- `frontend/pages/org-login.html`

Do not start from `rescue-dashboard.html` directly. Log in from the organization login page first.

## Smoke Test

### Test 1. Organization Login

Steps:

1. Open `frontend/pages/org-login.html`
2. Enter `rescue@catface.local`
3. Enter password `1234`
4. Click `Log in to Rescue Dashboard`

Expected result:

- Login succeeds
- Browser redirects to `rescue-dashboard.html`
- Rescue dashboard page loads without blank sections or script errors

## Functional Test Cases

### Test 2. Dashboard Analytics

Steps:

1. Enter the dashboard after login
2. Check `Available Cats`, `Total Applications`, `Approval Rate`, `Completed Adoptions`, `Active Conversations`, `Avg Review Time`
3. Check these panels:
   - `Application Funnel`
   - `Monthly Trend`
   - `Status Breakdown`
   - `Breed Preference`
   - `Recent Workflow Records`
   - `Needs Attention`

Expected result:

- Cards show real values from database
- Chart areas are rendered as visible visual components, not empty white blocks
- Recent records and attention items can be opened

### Test 3. Cat List Reads from Database

Steps:

1. Open `Cat List`
2. Compare the listed cats with records in the database

Expected result:

- Cat table is populated from database
- Data is not fixed mock data
- Cat IDs, names, breeds, status, and health information match backend data

### Test 4. Add New Cat

Steps:

1. Open `Cat List`
2. Click `Add New Cat`
3. Confirm the form expands
4. Fill at least:
   - `Cat Name`
   - `Breed`
   - `Gender`
   - `Estimated Age`
   - `Adoption Status`
5. Optionally upload a display photo
6. Click `Save Cat Account`

Expected result:

- Form opens correctly
- Save succeeds
- New cat appears in Cat List immediately after save
- New record is written into database

### Test 5. Edit Existing Cat

Steps:

1. In `Cat List`, click `Edit` for an existing cat
2. Change one or two fields such as breed, location, or notes
3. Save changes

Expected result:

- Edited values update in the table
- Reloading the page still shows updated values
- Database record is updated

### Test 6. Cat Profile Modal

Steps:

1. In `Cat List`, click `View` on any cat

Expected result:

- Cat profile modal opens
- Profile shows real database-driven information
- Status, tags, summary, and photo display correctly

### Test 7. Application Review List

Steps:

1. Open `Application Review`
2. Verify the list contains real applications
3. Open one application with `View`

Expected result:

- Application list is loaded from database
- Applicant name, cat name, status, and submission time are shown correctly
- Detail modal opens correctly

### Test 8. Approve Application

Steps:

1. In `Application Review`, choose an application with `pending` status
2. Click `Approve`

Expected result:

- Status updates to `approved`
- Buttons become locked/disabled afterward
- Refreshing the page still shows `approved`
- Database reflects the review result

Additional check:

- The related cat status should update according to current review logic

### Test 9. Reject Application

Steps:

1. Choose a `pending` application
2. Click `Reject`
3. Enter an optional reject note if prompted

Expected result:

- Status updates to `rejected`
- Reject note is saved if entered
- Application cannot be changed again afterward
- Database reflects the review result

### Test 10. Review Lock

Steps:

1. Open an application that has already been reviewed
2. Try clicking the opposite action again

Expected result:

- Reviewed application cannot be approved/rejected again
- UI remains locked
- Backend does not allow second status change

### Test 11. Notifications List

Steps:

1. Open `Notifications`
2. Check whether conversation threads appear
3. Use search box to search by adopter name or message snippet

Expected result:

- Notification list loads from real conversations
- Search filters the thread list
- Thread count label updates correctly

### Test 12. Open Chat Thread

Steps:

1. In `Notifications`, click a thread

Expected result:

- Chat modal opens
- Message history loads from database
- User messages and organization messages are aligned in opposite directions
- Organization-side messages appear on the right

### Test 13. Send Message

Steps:

1. Open any chat thread
2. Enter a message
3. Click `Send`

Expected result:

- Message appears in the conversation immediately
- After refresh, message is still present
- Message is stored in database

### Test 14. Contact Applicant from Application Review

Steps:

1. Open an application detail modal
2. Click `Contact Applicant`

Expected result:

- System opens or creates a related conversation
- Page switches into the notifications/chat flow
- Chat can continue from there

### Test 15. Organization Logout

Steps:

1. Click `Organization Logout` in the sidebar

Expected result:

- Session tokens are cleared from browser storage
- Browser redirects to `org-login.html`
- Re-entering protected functions requires login again

## Optional Test: Cat Face ID

Only run this if the local Python cat-face runtime and model weights are configured.

### Test 16. Generate Cat Face ID

Steps:

1. Open `Cat List`
2. Click `Add New Cat`
3. Click `Cat Face ID`
4. Upload a cat face image
5. Use the generated ID

Expected result:

- Recognition modal opens
- System returns either:
  - a matched existing face code, or
  - a suggested new face code
- Clicking `Use This ID` fills the Cat ID field in the form

### Test 17. Save Cat with Face ID

Steps:

1. Complete the Add New Cat form after generating Cat Face ID
2. Save the new cat

Expected result:

- Cat is created successfully
- Face code is stored on the cat record
- Embedding registration succeeds if runtime is available

## Regression Checklist

Before signing off, confirm:

- Login page is not garbled
- Rescue dashboard loads after login
- `Add New Cat` button works
- Dashboard analytics still display visual charts
- `Organization Logout` works
- No major browser console errors appear during normal use

## Known Notes

- Some application fields in the modal, such as living situation or work schedule, are currently limited by the existing schema and may show simplified values
- Cat Face ID testing depends on local ML runtime availability
- Exact counts in dashboard cards depend on current database contents

## Pass / Fail Template

Tester name:

- 

Test date:

- 

Environment:

- 

Passed items:

- 

Failed items:

- 

Screenshots / notes:

- 
