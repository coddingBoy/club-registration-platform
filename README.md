# Cape Town Spurs Registration Platform

MVP full-stack registration and onboarding platform for Cape Town Spurs academy
testing.

## Stack

- Frontend: React, TypeScript, Vite, plain CSS
- Backend: Node.js, Express
- Database: PostgreSQL with Prisma
- Auth: JWT
- Uploads: Multer locally, Supabase Storage-ready

## Features

- Public player registration form
- Admin login
- Admin dashboard
- Registration status management
- Search and filter
- Proof of payment upload
- CSV export
- Mobile responsive UI

## Project structure

```text
frontend/
backend/
```

## Setup

1. Install dependencies:

```bash
cd frontend && npm install
cd ../backend && npm install
```

2. Create environment files:

- Copy `frontend/.env.example` to `frontend/.env`
- Copy `backend/.env.example` to `backend/.env`

3. Add your PostgreSQL connection string in `backend/.env`.

4. Start the backend:

```bash
cd backend
npm run dev
```

5. Start the frontend:

```bash
cd frontend
npm run dev
```

## Default admin credentials

Set them in `backend/.env`:

```env
ADMIN_EMAIL=admin@soccerschool.com
ADMIN_PASSWORD=admin123
```

## Business Flow Testing

The backend includes an API-level business flow smoke test:

Use a test-safe backend email configuration first. For local smoke testing,
leave `RESEND_API_KEY` empty in `backend/.env` so email actions are logged as
skipped instead of sending through Resend.

For Render/free-plan email delivery, use Resend's HTTP API instead of Gmail
SMTP. Render free web services block outbound SMTP ports, while Resend uses
HTTPS.

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Cape Town Spurs <registrations@verified-domain.example>
ADMIN_NOTIFICATION_EMAIL=alexie@capetownspurs.co.za
```

`EMAIL_FROM` must use a domain verified in Resend. The default `resend.dev`
testing domain can only send to the Resend account owner's email address.

```bash
cd backend
npm start
```

In another terminal:

```bash
cd backend
npm run test:flow
```

The test expects the API at `http://localhost:5050` by default. Override it with
`TEST_API_BASE_URL` when testing another environment.

The frontend also includes a UI interaction flow test. Start the backend with
the same test-safe email configuration:

```bash
cd backend
npm start
```

In another terminal:

```bash
cd frontend
npm run test:ui
```

The UI test starts Vite automatically and covers the browser interactions for
New Trial, admin review, onboarding, Club Invite Trial lookup, and Holiday Camp
payment simulation.

## Testing Deployment

The repo includes `render.yaml` for a Render Blueprint deployment:

- One Node web service
- One managed PostgreSQL database
- Prisma migrations run during service startup
- React is built into `frontend/dist`
- Express serves both `/api/*` and the built frontend from the same Render URL

### Render Setup

1. Push the repo to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Render will detect `render.yaml`.
4. Fill the secret values Render asks for:

```env
ADMIN_PASSWORD=choose-a-temporary-testing-password
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=
RESEND_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

For the current testing phase, email, Supabase, and real payment credentials can
remain empty. Email sends will be logged as skipped when Resend is not configured.

Expected testing URL:

```text
https://cape-town-spurs-registration-test.onrender.com
```

If Render changes the service URL, update these Render environment variables to
match the final URL:

```env
CLIENT_URL
PUBLIC_API_URL
PAYMENT_RETURN_URL
PAYMENT_CANCEL_URL
LOCAL_STORAGE_BASE_URL
```
