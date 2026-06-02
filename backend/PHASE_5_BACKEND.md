# Phase 5 Backend Foundation

This backend is now structured around Express, PostgreSQL, and Prisma.

## Database

Set `DATABASE_URL` in `backend/.env`, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The Prisma schema covers:

- Players
- Trial applications
- One-time authorisation and renewal codes
- Onboarding records
- Payments
- Email logs
- Admin users
- Documents

## Important Rule

One-time code validation and usage must happen on the backend.

The frontend may collect the code, but it must not decide whether a code is valid,
unused, matched to a membership number, or eligible for the R500 trial credit.

Backend endpoints:

- `POST /api/academy/codes/validate`
- `POST /api/academy/onboarding`

`POST /api/academy/onboarding` validates the code and marks it used inside a Prisma
transaction before creating the onboarding record.

## Admin APIs

Admin APIs require the existing bearer-token auth middleware:

- `GET /api/academy/admin/trials`
- `PATCH /api/academy/admin/trials/:id/review`
- `GET /api/academy/admin/players`
- `POST /api/academy/admin/renewal-codes`
- `POST /api/academy/admin/renewal-codes/bulk`
- `GET /api/academy/admin/codes`
- `POST /api/academy/admin/codes/:id/send-email`
- `GET /api/academy/admin/onboarding`
- `GET /api/academy/admin/documents`
- `GET /api/academy/admin/documents/:id`
- `GET /api/academy/admin/documents/:id/file`
- `GET /api/academy/admin/audit-logs`
- `GET /api/academy/admin/export/csv`

Phase 9 role rules:

- `ADMIN` and `SUPER_ADMIN` can read and mutate admin data.
- `READ_ONLY_STAFF` can view admin data but cannot review trials, generate codes,
  send code emails, download exports, or change records.
- `PLAYER_PARENT` is reserved for parent/player account access and document upload.
- The frontend `?admin=true` switch is development-only. Production admin access
  must use backend authentication and role-checked API routes.

## Email Integration

Phase 6 uses Resend by default.

Required env vars:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Cape Town Spurs <onboarding@yourdomain.com>
ADMIN_NOTIFICATION_EMAIL=admin@soccerschool.com
```

Email types handled by the backend:

- Trial application received
- Trial successful
- Trial unsuccessful
- Renewal code email
- Onboarding complete
- Payment confirmation
- Admin notification

If `RESEND_API_KEY` is missing, emails are not sent and `EmailLog.status` is saved as
`SKIPPED_CONFIG`. This keeps local development usable while making production email
delivery real once the API key and verified sender domain are configured.

## Payment Integration

Phase 7 uses PayFast by default.

Required env vars:

```bash
PAYMENT_PROVIDER=payfast
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=
PAYFAST_PROCESS_URL=https://sandbox.payfast.co.za/eng/process
PUBLIC_API_URL=http://localhost:5050
PAYMENT_RETURN_URL=http://localhost:5173/payment/success
PAYMENT_CANCEL_URL=http://localhost:5173/payment/cancel
```

Payment rules:

- Trial applications create a `PENDING` PayFast payment for R500.
- Trial applications stay `PAYMENT_PENDING` until PayFast confirms payment.
- Admin cannot mark a trial successful or unsuccessful until payment is confirmed.
- Onboarding creates a `PENDING` programme payment.
- Onboarding records stay `PAYMENT_PENDING` until PayFast confirms payment.
- PayFast ITN/webhook confirmation updates payments to `PAID`.
- Payment confirmation emails are sent only after webhook confirmation.

Webhook endpoint:

- `POST /api/academy/payments/payfast/itn`

The webhook validates the PayFast signature before updating payment status.

## Document Storage

Phase 8 uses Supabase Storage by default, with local disk storage as a development
fallback when Supabase credentials are not configured.

Required production env vars:

```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=cape-town-spurs-documents
LOCAL_STORAGE_BASE_URL=https://your-api-domain.com
```

Supported document types:

- `BIRTH_CERTIFICATE`
- `SIGNED_CODE_OF_CONDUCT`
- `DEBIT_ORDER_AUTHORISATION`
- `MEDICAL_DOCUMENT`
- `PAYMENT_PROOF`
- `OTHER`

Upload endpoint:

- `POST /api/academy/documents`

Use multipart form data with:

- `document`: the uploaded PDF/image file
- `type`: one of the supported document types
- `playerId` or `onboardingRecordId`: the record the document belongs to

Admin can view uploaded document metadata through:

- `GET /api/academy/admin/documents`
- `GET /api/academy/admin/documents/:id`
- `GET /api/academy/admin/documents/:id/file`

The API currently accepts JPG, PNG, WEBP, and PDF files up to 5MB. In production,
Supabase buckets should use private access policies. The backend document file
endpoint redirects to a short-lived Supabase signed URL or streams the local file
after role checks pass.

## Authentication and Security

Phase 9 adds:

- Admin/staff role checks for admin routes
- Parent/player account model for future player portal login
- Code expiry through `CODE_EXPIRY_DAYS`
- Atomic one-time code claiming during onboarding
- Private document file access instead of static `/uploads` serving
- Audit logging for sensitive admin actions

Auth endpoints:

- `POST /api/auth/login` for admin and staff accounts
- `POST /api/auth/parent/login` for parent/player accounts

Audited actions include:

- Trial review
- Renewal code generation
- Bulk renewal code generation
- Code email send
- Document upload
- Document metadata view
- Document file view
- Registration CSV export
