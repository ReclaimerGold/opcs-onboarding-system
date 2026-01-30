# Server Error Analysis

This document traces where the frontend shows "Server error" and identifies every backend code path that can produce HTTP 500 or unhandled exceptions, with diagnostic steps and common causes.

---

## 1. Where the frontend shows "Server error"

| Location | Trigger | User-facing message |
|----------|--------|---------------------|
| **LoginView.vue** | `POST /api/auth/login` or signup returns **500** | "Server error. Please try again in a few moments." (or backend `error` / `message` / `details` if present) |
| **FormWizardView.vue** | `POST /api/forms/preview/:step` returns **500** or network error | "Server error generating preview" or backend `error` / `message` |

So "Server error" always means: **the backend returned HTTP 500** (or the request failed before a response). The frontend does not know the underlying cause; the real reason is in backend code and logs.

---

## 2. Auth (login / signup) → 500

### Endpoints

- **POST /api/auth/signup** — `backend/src/routes/auth.js` (signup handler)
- **POST /api/auth/login** — `backend/src/routes/auth.js` (login handler)

### Code path to 500

Both handlers are wrapped in `try/catch`. Any uncaught exception leads to:

- **Signup:** `res.status(500).json({ error: '...', code: 'SIGNUP_ERROR', details })`
- **Login:** `res.status(500).json({ error: '...', code: 'LOGIN_ERROR', details })`

Backend logs: `Signup error:` or `Login error:` plus the exception and stack.

### Failure points (what can throw)

| Step | Code | What can throw |
|------|------|----------------|
| Existing applicant check | `findApplicantByCredentials(...)` | DB not initialized, wrong schema, or DB file missing/read-only |
| Submissions count (existing user) | `db.prepare(...).get(existingApplicant.id)` | Missing `form_submissions` table or schema mismatch |
| Create applicant | `createApplicant(firstName, lastName, email)` | DB write failure, constraint violation, transaction error |
| Session write | `req.session.applicantId = ...` | Session store failure (e.g. SQLite session DB missing, permissions, disk full) |
| Audit log | `await auditLog({...})` | Missing `audit_log` table or DB error (audit catches and logs but does not rethrow) |
| Reload applicant (signup) | `db.prepare('SELECT * FROM applicants WHERE id = ?').get(applicant.id)` | DB read error |
| Login: applicant lookup | `findApplicantByCredentials(...)` | Same as above |
| Login: failed-attempt insert | `db.prepare('INSERT INTO login_attempts ...').run(...)` | Missing `login_attempts` table or schema mismatch |
| Login: password verify | `await verifyPassword(password, applicant.password_hash)` | bcrypt failure (e.g. invalid hash) |
| Login: success-attempt insert | Same `login_attempts` insert | Same as above |
| Login: session write | `req.session.applicantId = ...` | Same session store issues |

### Common causes (auth)

1. **Database not initialized or missing**  
   - `backend/database/onboarding.db` not created (first run) or path wrong.  
   - Fix: Run app once so `initializeDatabase()` runs; ensure `backend/database` is writable.

2. **Session store failure**  
   - `backend/database/sessions.db` missing or not writable; `better-sqlite3-session-store` throws.  
   - Fix: Ensure `backend/database` exists and is writable; check process user permissions.

3. **Schema / migration mismatch**  
   - Old DB missing `login_attempts`, `audit_log`, `is_active`, `password_hash`, etc.  
   - Fix: Align DB with `backend/src/database/init.js` (recreate or add migrations).

4. **SESSION_SECRET**  
   - Not required for 500; only affects cookie signing. Missing env is not a direct cause of 500 in this code.

---

## 3. Form preview (PDF) → 500

### Endpoint

- **POST /api/forms/preview/:step** — `backend/src/routes/forms.js` (preview handler)
- Uses **requireAuth** (session must be valid; 401 if not).
- Steps 1, 2, 6 map to W4, I9, 8850; only those allow preview.

### Code path to 500

Handler is in `try/catch`. Any thrown error leads to:

- `res.status(500).json({ error: 'Failed to generate preview', message: error.message })`

Backend logs: `Preview generation error:` and `Error stack:`.

### Failure points (what can throw)

| Step | Code | What can throw |
|------|------|----------------|
| Parse body | `formData = req.body.formData \|\| req.body` or `JSON.parse(req.body.formData)` | Invalid JSON → SyntaxError |
| DB read | `getDatabase()` then `db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.applicantId)` | DB not initialized, missing table, read error |
| Applicant missing | Handled with 404, not 500 | — |
| PDF generation | `generateW4PDF(formData, applicantData)` or I9/8850 | See below |
| Send response | `res.send(Buffer.from(pdfBytes))` | If `pdfBytes` is not a valid buffer/type, or headers already sent |

### PDF service failure points

| Source | What can throw |
|--------|----------------|
| **pdfTemplateService.getTemplate(formType)** | • Unknown form type → `throw new Error('Unknown form type: ...')` • File read error other than ENOENT (e.g. EACCES) → rethrown after download attempt • Non-ENOENT errors in `getTemplate` are rethrown |
| **pdf-lib** | `PDFDocument.load(templateBuffer)` — corrupt or non-PDF buffer |
| **fillPDFTemplate / field mapping** | Type errors, missing methods, or unexpected form structure (rare if templates are official) |
| **Fallbacks** | `generateW4PDFFallback` etc. use `PDFDocument.create()` and `embedFont()` — can throw on OOM or font embed failure (rare) |

Template download (when file missing):

- `updateTemplate(formType, true)` → `downloadTemplate()` can throw:
  - Network/IRS/USCIS down → `Failed to download ...`
  - Response not OK → same
  - Body not PDF → `Downloaded file for ... is not a valid PDF`
- If download throws, `getTemplate()` may rethrow (depending on code path), and that propagates to the route’s catch → 500.

### Common causes (preview)

1. **PDF template missing and download fails**  
   - First run or cleared storage; IRS/USCIS URLs unreachable or return non-PDF.  
   - Fix: Ensure `backend/storage/pdf-templates/{w4,i9,8850}/` exist and contain valid PDFs; check network from server to IRS/USCIS.

2. **Invalid or corrupt template file**  
   - File exists but is truncated or not PDF.  
   - Fix: Replace with known-good template (e.g. re-download via admin or script).

3. **req.body / formData shape**  
   - Frontend sends wrong shape; code expects certain keys (e.g. for I9/W4/8850 mapping).  
   - Can cause errors inside mapping or PDF fill. Fix: Align frontend payload with `validatePreviewFormData` and mapping in `pdfService` / `pdfFieldMapping`.

4. **Database or session**  
   - Same as auth: DB or session store failure before/during `requireAuth` or applicant lookup can lead to 500 if an error is thrown instead of returning 401.

---

## 4. Other backend 500s (for completeness)

These do not currently show the generic "Server error" in the two places above but can return 500 and appear as server errors in the UI or Network tab:

- **Settings:** Failed to retrieve/update settings, list folders, etc.
- **Admin:** Dashboard, users, onboarding-status, login-attempts, audit logs, system health, exports, PDF template status/update, etc.
- **Forms:** Submit form, retrieve submissions/draft, upload I9 document, view submission PDF, etc.
- **Applicants:** Get/update applicant, get progress.
- **Auth:** Logout failed, get user, password status, set/change password, forgot password, etc.

Any of these log their own error and return `res.status(500).json({ error: '...' })` (and sometimes `details`).

---

## 5. How to find the real reason

### 1) Backend logs (primary)

Run the backend in a terminal (e.g. `npm run dev` or `node …`) and reproduce the error. Look for:

- **Auth:** `Signup error:` or `Login error:` + exception + stack.
- **Preview:** `Preview generation error:` + `Error stack:`.

The first line of the stack trace (and message) is the direct cause (e.g. table missing, ENOENT, "Unknown form type", "Failed to download", etc.).

### 2) Browser Network tab

1. Open DevTools → Network.
2. Trigger the failing action (login, signup, or Preview).
3. Find the failing request (e.g. `login`, `signup`, or `preview/1`, `preview/2`, `preview/6`).
4. Open it → Response (or Preview).  
   - If JSON with `error` or `message`, that’s the server’s message; the frontend may show it when the UI uses `error` / `message` / `details`.  
   - If HTML or empty, the backend may have crashed before sending JSON (check backend logs).

### 3) Environment and files

- **Database:**  
  - `backend/database/onboarding.db` exists and is writable.  
  - `backend/database/sessions.db` exists and is writable (session store).

- **Templates:**  
  - `backend/storage/pdf-templates/w4/fw4-latest.pdf`  
  - `backend/storage/pdf-templates/i9/i9-latest.pdf`  
  - `backend/storage/pdf-templates/8850/f8850-latest.pdf`  
  If missing, the app may try to download them; if download or write fails, preview can 500.

- **Optional env:**  
  - `SESSION_SECRET` — recommended for production; not required to avoid 500.  
  - `FRONTEND_URL` — for CORS; wrong value gives CORS errors, not necessarily 500.

---

## 6. Quick checklist when you see "Server error"

- [ ] Reproduce with backend running in a terminal and note the **exact** log line (e.g. `Signup error: ...` or `Preview generation error: ...`).
- [ ] Confirm `backend/database/onboarding.db` and `backend/database/sessions.db` exist and are writable.
- [ ] For **login/signup:** Confirm DB schema matches `backend/src/database/init.js` (tables: `applicants`, `form_submissions`, `audit_log`, `login_attempts`, etc.).
- [ ] For **preview:** Confirm PDF templates exist under `backend/storage/pdf-templates/` or that the server can download them from IRS/USCIS.
- [ ] In Network tab, inspect the failing request’s **response body** for `error` or `message` and use that plus backend logs to pinpoint the line of code and fix (DB, session, template, or request payload).

This analysis covers all code paths that can lead to the "Server error" message on the frontend and how to diagnose the underlying cause from backend behavior and logs.
