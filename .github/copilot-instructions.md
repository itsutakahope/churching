# AI Coding Agent Instructions

## Project Overview
Church management system combining purchase request board and tithing calculation subsystems. Built with React + Vite frontend, Firebase Cloud Functions backend (Express.js), Cloud Firestore database, and Firebase Authentication.

## Critical Architecture Patterns

### Dual-Module Structure
Two independent subsystems share common infrastructure but have distinct workflows:
- **Purchase Module** (`/purchase` route): Public-facing board for purchase requests with comments and approval workflow
- **Tithing Module** (`/tithing` route): Role-restricted financial calculation system with cash/cheque separation logic

### Authentication & Authorization Flow
1. **Frontend**: `AuthContext.jsx` exposes `currentUser`, `userProfile`, `userRoles`, `isReimburser`
2. **Backend**: ALL authenticated endpoints MUST use `verifyFirebaseToken` middleware + `verifyRole([roles])` for restricted operations
3. **Roles** (stored in Firestore `users/{uid}.roles` array): `admin`, `finance_staff`, `treasurer`, `reimbursementContact`
4. **Status Check**: Frontend should verify `userProfile.status === 'approved'` before enabling actions

**Example API Call Pattern** (see `TithingTaskList.jsx:88` or `PurchaseRequestBoard.jsx:554`):
```javascript
const token = await currentUser.getIdToken();
await axios.post('/api/tithe-tasks', payload, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Payment Calculation Logic (Core Algorithm)
Location: `client/paymentCalculationUtils.js`

**Critical Function**: `calculatePaymentBreakdown(dedications)`
- Separates cash from cheque totals for financial reconciliation
- Performs strict validation via `validateDedication(dedication, index)`
- Returns `{cashTotal, chequeTotal, hasCheque}` with detailed error reporting
- Used by `PaymentBreakdownDisplay.jsx` and `TithingTaskDetail.jsx`

**Validation Rules** (lines 11-91):
- `amount`: Must be positive finite number
- `method`: Must be 'cash' or 'cheque'
- `dedicationCategory`, `dedicatorId`, `dedicationDate`: Required non-empty strings

### API Proxy Configuration
Development server (`localhost:5173`) proxies `/api/*` requests to Functions emulator (`http://127.0.0.1:5007`). See `vite.config.js:6-11`.

**Production**: API requests go through Firebase Hosting rewrites (see `firebase.json:23-26`).

## Development Commands

```bash
npm run dev                    # Start both frontend (5173) + Functions emulator (5007)
npm run dev:client             # Frontend only
npm run emulate:functions      # Backend only (for debugging Functions)
npm test                       # Run all tests once
npm run test:watch             # Watch mode for TDD
npm run build                  # Build to dist/client/
npm run deploy:hosting         # Build + deploy to Firebase Hosting
```

**Emulator Ports**: Auth:9099, Functions:5001, Firestore:8080, Hosting:5002, UI:4000

## Code Modification Standards

### Change Marking Convention
When modifying core logic, mark changes with:
```javascript
// --- ▼▼▼ 核心修改開始 ▼▼▼ ---
// Modified code here
// --- ▲▲▲ 核心修改結束 ▲▲▲ ---
```
Used extensively in `functions/index.js` (lines 93-116, 313-332) and component files.

### Error Handling Pattern
All API requests follow three-tier error handling (example from `TithingTaskList.jsx:88-135`):
```javascript
try {
  const response = await axios.get('/api/tithe-tasks', { headers });
  // Handle success
} catch (err) {
  if (err.response) {
    // Backend returned error with err.response.data.code
    switch(err.response.data.code) {
      case 'PERMISSION_DENIED': /* show specific Chinese message */
      case 'INVALID_PARAMETER': /* show specific Chinese message */
      default: /* show response.data.message or generic error */
    }
  } else if (err.request) {
    // Network failure (no response received)
  } else {
    // Request setup error
  }
}
```

### Styling Rules
- **Framework**: Tailwind CSS only (no custom CSS files except `index.css` for global resets)
- **Dark Mode**: Use `dark:` prefix classes, controlled by `ThemeContext.jsx`
- **Theme Tokens** (see `tailwind.config.js:13-80`):
  - Light: `glory-red-500` (#A91D22), `holy-light-gold-500` (#E4B869), `graphite-*` (grayscale)
  - Dark: `dark-primary` (#E5484D), `dark-gold` (#FFD479), `dark-background`/`dark-surface`/`dark-text-*`
- **Icons**: Use `lucide-react` exclusively (e.g., `import { LayoutDashboard, HandCoins } from 'lucide-react'`)

### Component Structure
- **Functional components + Hooks only** (no class components)
- **Lazy loading**: Main routes use `React.lazy()` in `App.jsx` (lines 7-9)
- **Context providers**: Wrap entire app with `<AuthProvider>` and `<ThemeProvider>` in `main.jsx`

## Testing Practices

**Framework**: Vitest + React Testing Library + jsdom (see `vitest.config.js`)

**Test Location**: `client/test/` (37 files), `functions/test/`

**Common Patterns**:
- Mock axios with `vi.mock('axios')` and `vi.mocked(axios)`
- Mock Firebase auth: `const mockUser = { getIdToken: vi.fn().mockResolvedValue('mock-token') }`
- Test file naming: `*.test.jsx` for component tests, descriptive names like `dark-mode-modal-verification.test.jsx`

**Run specific test**: `npm test -- payment-calculation` (Vitest filters by filename)

## Firebase Specifics

### Firestore Collections
- **users**: `{email, displayName, roles[], status, wantsNewRequestNotification}`
- **requirements**: `{userId, requesterName, text, description, accountingCategory, priority, status, reimbursementerId}` + subcollection `comments`
- **tithe**: `{taskName, calculationTimestamp, treasurerUid, financeStaffUid, status}` + subcollection `dedications`

### Security Rules (`firestore.rules`)
- **users**: Admins can full CRUD; users can update own data BUT NOT `roles` or `status` fields (lines 24-29)
- **requirements**: All authenticated users can read; only creator can update/delete
- **tithe**: Read requires `finance_staff|treasurer|admin`; write requires being assigned to task or admin (lines 39-63)

### Functions Architecture (`functions/index.js`)
**Exports**:
- `api` (HTTP Express app): 15+ REST endpoints under `/api/*` prefix
- `getUserDisplayNameCallable` (Callable): Get display name by UID
- `completeTithingTask` (Callable): Mark tithing task complete
- `createuserprofile` (Auth Trigger): Auto-create Firestore user doc on signup

**Gmail Notifications**: Uses Gmail API OAuth2 (requires env vars: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER`). See `sendNewRequestNotification` (lines 41-125) and `sendPurchaseCompleteNotification` (lines 133-203).

## Prohibited Actions

1. **No library invention**: Only use packages in `package.json` (axios, react-router-dom, lucide-react, jspdf, etc.)
2. **No path assumptions**: Verify file existence before importing
3. **No code deletion**: Modify/extend existing code unless explicitly instructed to delete
4. **No English UI text**: All user-facing text must be Traditional Chinese (繁體中文)
5. **No guessing**: Ask for clarification when requirements are unclear

## Key Files Reference

- **Routing**: `client/App.jsx` (routes: /purchase, /tithing, /tithing/:taskId)
- **Auth Logic**: `client/AuthContext.jsx` (manages currentUser, roles, profile sync)
- **API Backend**: `functions/index.js` (1172 lines, all Express endpoints)
- **Payment Core**: `client/paymentCalculationUtils.js` (486 lines, validation + calculation)
- **Category Config**: `client/acount_catagory.json` (hierarchical accounting categories)
- **PDF Generation**: `client/pdfGenerator.js` (purchase receipts), `client/tithingPdfGenerator.js` (tithing reports)
- **Main Components**: `PurchaseRequestBoard.jsx` (181KB), `TithingTaskDetail.jsx`, `DedicationEntryForm.jsx`

## Common Pitfalls

1. **Token Refresh**: After `updateProfile()`, always call `reload(auth.currentUser)` + `getIdToken(true)` to sync changes (see `AuthContext.jsx:67-73`)
2. **Proxy Config**: Local dev requires Functions emulator running on port 5007 (not 5001) due to `vite.config.js` proxy
3. **Role Checks**: Frontend role checks are UI-only; backend MUST enforce with `verifyRole()` middleware
4. **Chinese Font**: PDF generation requires loading `NotoSansTC-Regular.ttf` for Chinese character support
5. **Date Format**: Firestore stores timestamps; convert to `YYYY-MM-DD` format for UI display
