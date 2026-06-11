# Lugha — Test Case Registry

Living checklist of app flows. Update this file when adding automated tests or completing manual verification.

**Last automated run:** 55 unit tests + 5 emulator integration tests (`npm test`, `npm run test:integration`)  
**Legend:** ✅ automated · ☑️ manually verified · ⬜ not yet verified · 🚫 blocked (needs live cloud / browser-only)

---

## 1. Public / auth

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| PUB-01 | Home page load | Open `/` logged out | Hero, CTAs, feature sections, scroll works | ✅ `HomePage.test.tsx` |
| PUB-02 | Home → signup | Click "Create free account" | Navigates to `/signup` | ☑️ |
| PUB-03 | Home → login | Click "Sign in" | Navigates to `/login` | ☑️ |
| PUB-04 | Home teacher CTA | Click "Start as a teacher" | `/signup?role=teacher`, Teacher tab active | ✅ `SignupPage.test.tsx` |
| PUB-05 | Home student CTA | Click "Join as a student" | `/signup?role=student`, Student tab active | ☑️ |
| PUB-06 | Logged-in redirect | Visit `/` while authenticated | Redirect to `/library` | ✅ `HomePage.test.tsx` (mock) |
| AUTH-01 | Login form render | Open `/login` | Email, password, sign in, forgot password, sign up link | ✅ `LoginPage.test.tsx` |
| AUTH-02 | Signup tabs | Open `/signup` | Student + Teacher tabs, role-specific fields | ✅ `SignupPage.test.tsx` |
| AUTH-03 | Teacher signup | Fill form, submit | Org + user created, land on `/library` | ✅ `appFlows.integration.test.ts` (FB-02) |
| AUTH-04 | Student signup | Valid invite code, submit | Join org, land on `/library` | ✅ `appFlows.integration.test.ts` (FB-05) |
| AUTH-05 | Login | Valid credentials | Session persists, redirect to library or `from` | ✅ `appFlows.integration.test.ts` |
| AUTH-06 | Password reset | Forgot password + email | Reset email sent message | 🚫 needs Firebase |
| AUTH-07 | Protected route | Visit `/library` logged out | Redirect to `/login` with return state | ✅ `ProtectedRoute.test.tsx` |
| AUTH-08 | Student blocked from teacher routes | Student visits `/library/:id/edit` | Redirect to `/library` | ✅ `ProtectedRoute.test.tsx` |
| AUTH-09 | Sign out | Account → Sign out | Session cleared, land on `/` | ☑️ |

---

## 2. Library (teacher)

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| LIB-T01 | Empty library | Teacher, no books | Empty state + Add book button | ✅ `LibraryPage.test.tsx` |
| LIB-T02 | New book modal typing | Add book → type full title | Can type multiple characters without focus loss | ✅ `LibraryPage.test.tsx` + `Modal.test.tsx` |
| LIB-T03 | Create book | Enter title → Create | Book created, navigate to edit page | ✅ `LibraryPage.test.tsx` (mock) |
| LIB-T04 | Book list by category | Books in categories | Grouped sections, uncategorized bucket | ☑️ |
| LIB-T05 | Open book | Click book card | Reader opens | 🚫 needs Firebase |
| LIB-T06 | Categories page | `/teacher/categories` | Add, edit, delete category | ✅ `TeacherCategoriesPage.test.tsx` |
| LIB-T07 | Students page | `/teacher/students` | Invite code visible, student list | ✅ `TeacherStudentsPage.test.tsx` |
| LIB-T08 | Import local banner | Local IndexedDB data exists | "Import local" button on library | ☑️ |
| LIB-T09 | Import local flow | `/import-local` → Import | Creates cloud book from local data | 🚫 needs local + Firebase |

---

## 3. Library (student)

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| LIB-S01 | Student HUD | Student on library | Name, level, points bar | ☑️ |
| LIB-S02 | Empty library | Student, no books | "Ask your teacher" message | ✅ `LibraryPage.test.tsx` |
| LIB-S03 | No teacher actions | Student library | No Add book / Categories / Students | ✅ `LibraryPage.test.tsx` |

---

## 4. Book edit (teacher)

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| EDIT-01 | Edit page load | Open `/library/:id/edit` | Title, category, actions, page count | ✅ `BookEditPage.test.tsx` |
| EDIT-02 | Save title | Change title → Save | Persists without forced navigation | ✅ `BookEditPage.test.tsx` (mock) |
| EDIT-03 | Import images | Select JPG/PNG files | Pages added, thumbnails shown, success msg | ✅ `bookService.test.ts` |
| EDIT-04 | Import PDF by extension | PDF with empty/octet-stream MIME | Pages imported | ✅ `bookService.test.ts` |
| EDIT-05 | Unsupported file | Select .txt | Clear error message | ✅ `bookService.test.ts` |
| EDIT-06 | Open book | Click "Open book" | Navigate to reader with pages | ☑️ |
| EDIT-07 | Export bundle | Click Export | JSON download (when pages exist) | ⬜ |
| EDIT-08 | Delete book | Confirm delete | Book + storage removed, back to library | 🚫 needs Firebase |

---

## 5. Book reader

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| READ-01 | Empty book | Open book with 0 pages | Empty state + Import button (teacher) | ✅ `BookReaderPage.test.tsx` |
| READ-02 | Inline import (toolbar) | Teacher: upload icon in reader | File picker, import in place, pages appear | ✅ `BookReaderPage.test.tsx` (mock) |
| READ-03 | Page navigation | Prev / next | Page counter updates | ⬜ |
| READ-04 | Draw mode | Draw box on page | Box saved to Firestore | 🚫 needs Firebase |
| READ-05 | Assign audio | Tap box in assign mode | Audio modal, upload/record | ⬜ |
| READ-06 | Play mode | Tap mapped box | Audio plays, student earns points | 🚫 needs Firebase |
| READ-07 | Delete box | Delete mode → tap box | Box + audio removed | 🚫 needs Firebase |
| READ-08 | Swipe pages | Swipe left/right | Changes page | ⬜ |

---

## 6. Account & routing

| ID | Flow | Steps | Expected | Status |
|----|------|-------|----------|--------|
| ROUTE-01 | Unknown URL | Visit `/foo` | Redirect to `/` | ✅ `App.routes.test.tsx` |
| ROUTE-02 | Account page | `/account` | Profile info, sign out | ✅ `AccountPage.test.tsx` |
| ACC-01 | Sign out destination | Sign out from account | Lands on home `/` | ☑️ |

---

## 7. Services / units

| ID | Area | Coverage | File |
|----|------|----------|------|
| SVC-01 | Validation helpers | Email, password, invite code | `validation.test.ts` |
| SVC-02 | Progress / gamification | Points, levels | `progressService.test.ts` |
| SVC-03 | File type detection | PDF + image by MIME and extension | `bookService.test.ts` |
| SVC-04 | Import files to book | Image import, PDF extension, errors, progress, sort order | `bookService.test.ts` |
| SVC-05 | Modal focus trap | Input keeps value while typing; Escape closes | `Modal.test.tsx` |

## 7b. Automated test file index

| File | Covers |
|------|--------|
| `src/App.test.tsx` | Legacy empty state |
| `src/App.routes.test.tsx` | Route fallbacks |
| `src/components/ProtectedRoute.test.tsx` | AUTH-07, AUTH-08 |
| `src/components/ui/Modal.test.tsx` | SVC-05, LIB-T02 regression |
| `src/pages/HomePage.test.tsx` | PUB-01, PUB-06 |
| `src/pages/LoginPage.test.tsx` | AUTH-01 |
| `src/pages/SignupPage.test.tsx` | AUTH-02, PUB-04 |
| `src/pages/LibraryPage.test.tsx` | LIB-T01–03, LIB-S01–03 |
| `src/pages/BookEditPage.test.tsx` | EDIT-01–02, EDIT-06 |
| `src/pages/BookReaderPage.test.tsx` | READ-01–02 |
| `src/pages/AccountPage.test.tsx` | ROUTE-02, ACC-01 |
| `src/pages/TeacherCategoriesPage.test.tsx` | LIB-T06 |
| `src/pages/TeacherStudentsPage.test.tsx` | LIB-T07 |
| `src/services/bookService.test.ts` | SVC-03, SVC-04, EDIT-03–05 |
| `src/services/progressService.test.ts` | SVC-02 |
| `src/utils/validation.test.ts` | SVC-01 |
| `src/integration/appFlows.integration.test.ts` | FB-02–05, AUTH-03–05 |

---

## 8. Firebase emulator integration

Run locally (starts Auth, Firestore, and Storage emulators automatically):

```bash
npm run test:integration
```

| ID | Flow | Notes | Status |
|----|------|-------|--------|
| FB-01 | Deploy rules | `npm run deploy:rules` | ☑️ |
| FB-02 | Teacher signup E2E | Org, user doc, invite code | ✅ `appFlows.integration.test.ts` |
| FB-03 | Storage upload | Page image import to emulator storage | ✅ `appFlows.integration.test.ts` |
| FB-04 | Org isolation | Teacher B cannot see org A books | ✅ `appFlows.integration.test.ts` |
| FB-05 | Invite code join | Student signup via 6-char code | ✅ `appFlows.integration.test.ts` |

**Not covered by emulators:** live `lughaapp` cloud E2E, Cloud Functions `refreshUserClaims` (uses Admin script in tests), PDF rendering in Jest, reader draw/assign/play UI.

---

## Commands

```bash
npm test                  # unit/component tests (no emulators)
npm run test:integration  # Firebase emulator integration (auth + firestore + storage)
npm run test:emulators    # unit tests while emulators are up (legacy alias)
npm run build             # production compile check
```

---

## Regression watchlist

Issues previously fixed — re-test if touching related code:

1. **Modal one-letter typing** — `Modal.tsx` must not re-focus close button on parent re-render (`LIB-T02`, `Modal.test.tsx`).
2. **PDF import on Mac** — PDFs without `application/pdf` MIME must still import (`EDIT-04`, `bookService.test.ts`).
3. **Reader import redirect** — Toolbar upload must import inline, not only navigate to edit (`READ-02`).
4. **Homepage scroll** — `body` must allow vertical scroll (`PUB-01` manual).
