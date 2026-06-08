# Project Checkpoint

Last updated: 2026-06-03

## Current State

- Repository: `https://github.com/coddingBoy/club-registration-platform`
- Current branch: `main`
- Latest pushed commit: `500f99c Enable test admin route on Render`
- Testing deployment target: Render
- Render Blueprint file: `render.yaml`

## Testing Deployment

The app is configured for a full-stack Render testing deployment:

- One Node/Express web service
- One Render PostgreSQL database
- Prisma migrations run on service startup
- React frontend is built and served by Express
- `/api/*` routes are handled by the backend
- Non-API routes serve the React app

Expected test URL:

```text
https://cape-town-spurs-registration-test.onrender.com
```

Health check:

```text
/api/health
```

Expected response:

```json
{"status":"ok"}
```

Admin notification recipient:

```env
ADMIN_NOTIFICATION_EMAIL=tsyukiamkiet@gmail.com
```

Real email delivery still requires `RESEND_API_KEY` and a valid `EMAIL_FROM`
sender/domain configuration.

## Admin Access

The frontend now shows a normal `Admin` tab. Users must sign in through the
admin login form before the admin dashboard is shown.

Admin login endpoint:

```text
POST /api/auth/login
```

The frontend stores the returned JWT session locally and provides a sign-out
button. Temporary `?admin=true` access and the `VITE_ENABLE_TEST_ADMIN` build flag
have been removed.

## Backend

Current backend stack:

- Node.js
- Express
- PostgreSQL
- Prisma
- JWT auth foundation
- Resend email service integration scaffold
- PayFast payment scaffold
- Supabase Storage scaffold with local upload fallback

Important backend files:

- `backend/prisma/schema.prisma`
- `backend/src/routes/academyRoutes.js`
- `backend/src/controllers/academyController.js`
- `backend/src/services/academyService.js`
- `backend/src/services/paymentService.js`
- `backend/src/services/emailService.js`
- `backend/src/services/storageService.js`
- `backend/src/services/authService.js`
- `backend/src/services/auditService.js`

## Frontend

Current frontend stack:

- React
- TypeScript
- Vite
- Plain CSS

Important frontend files:

- `frontend/src/App.tsx`
- `frontend/src/utils/api.ts`
- `frontend/src/components/PlayerRegistration.tsx`
- `frontend/src/components/TrialRegistration.tsx`
- `frontend/src/components/UrbanWarriorOnboarding.tsx`
- `frontend/src/components/AdminLogin.tsx`
- `frontend/src/components/AdminPanel.tsx`
- `frontend/src/components/PlaceholderForm.tsx`

## Working Database-Backed Flows

These are already wired to backend/Postgres:

- Simple registration submit:
  - `POST /api/academy/simple-registrations`
  - `GET /api/academy/simple-registrations`

- Trial application submit:
  - `POST /api/academy/trials`
  - `GET /api/academy/trials`

- Renewal code validation:
  - `POST /api/academy/codes/validate`

- Onboarding creation:
  - `POST /api/academy/onboarding`

## Current Trial Flow

For local/testing phase:

1. Fill trial form.
2. Click `Pay R500`.
3. Frontend marks payment as simulated.
4. Click `Save Trial Application`.
5. Frontend calls `POST /api/academy/trials`.

The PayFast real confirmation flow is scaffolded but not production-ready.

## Still Prototype / Not Production-Ready

- Admin panel actions are not fully wired through authenticated frontend tokens.
- Real PayFast payment confirmation is not finalized for production.
- Real email delivery needs provider credentials/domain setup.
- Document upload storage needs Supabase or S3 production credentials.
- Admin login UI exists; admin dashboard API actions still need token wiring.
- Production domain and environment variables still need final setup.

## Production Integration Next Steps

1. Wire admin panel buttons to backend APIs using the stored auth token.
2. Configure real email provider.
3. Configure real storage provider.
4. Configure real payment gateway callbacks/webhooks.
5. Set production domain and final Render environment variables.
6. Run full end-to-end test with boss/client.
