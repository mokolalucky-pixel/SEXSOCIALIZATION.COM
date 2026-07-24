# SEXSOCIALIZATION.COM

A privacy-conscious relationship communication app focused on long-distance connection for adults 18+.

## Current Baseline

A deployable Vite + React frontend with:

- 18+ age verification gate (session-scoped)
- Core routes: Home, Login, Sign Up, Dashboard (protected), 404
- Shared layout with navigation and accessible skip link
- Backend authentication with HTTP-only session cookies
- Form validation with accessible error messaging
- Responsive styling with dark mode and focus management
- SEO and Open Graph meta tags
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy
- GitHub Actions CI build on every push/PR
- Vercel Functions API for auth and agreement persistence

## Project Structure

```
client/
  public/
    logo.svg       – brand logo
    favicon.svg    – browser favicon
    robots.txt     – search engine directives
  src/
    main.jsx       – app entrypoint (AgeGate + BrowserRouter + AuthProvider)
    App.jsx        – route definitions
    styles.css     – global responsive styles
    context/
      AuthContext.jsx    – auth state and provider
    hooks/
      useAuth.js         – useAuth hook
    layouts/
      AppLayout.jsx      – site-wide header, footer, nav
    components/
      AgeGate.jsx        – 18+ entry confirmation
      ProtectedRoute.jsx – route guard
    pages/
      Home.jsx
      Login.jsx
      SignUp.jsx
      Dashboard.jsx
      NotFound.jsx
.github/workflows/
  ci.yml          – lint + build on push/PR
vercel.json       – Vercel deploy config and security headers
```

## Local Development

```bash
npm install
npm --prefix client install
npm --prefix client run dev
```

The frontend can run locally without the backend, but signup/login/API persistence require the environment variables below.

## Build

```bash
npm run build
npm run lint
```

## Environment Variables

Copy `.env.example` and `client/.env.example`, then configure the same values in Vercel Project Settings → Environment Variables.

## Deploying to Vercel (Go Live)

### 1. Push to GitHub
Merge your changes to `main`. The CI workflow will run automatically.

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and sign in.
2. Click **"Import Git Repository"** and select `mokolalucky-pixel/SEXSOCIALIZATION.COM`.
3. Vercel will detect `vercel.json` automatically — leave build settings as-is.
4. Click **Deploy**.

### 3. Configure Environment Variables
In the Vercel project settings → **Environment Variables**, add:

| Name | Value |
| ---- | ----- |
| `DATABASE_URL` | Neon Postgres connection string |
| `SESSION_SECRET` | Long random string used to sign session tokens |
| `ADMIN_EMAILS` | Comma-separated admin account emails for moderation review |
| `VIDEO_PROVIDER_JOIN_URL` | Optional WebRTC provider join URL used when call rooms become live |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID used for server-side SMS sending |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token used only by Vercel Functions |
| `TWILIO_FROM_NUMBER` | Twilio sender phone number in E.164 format, for example `+15551234567` |
| `VITE_APP_NAME` | `SEXSOCIALIZATION.COM` |
| `VITE_ENVIRONMENT` | `production` |
| `VITE_AUTH_PROVIDER` | `backend-api` |
| `VITE_AGREEMENT_STORAGE_MODE` | `database-backed` |

Use Neon through the Vercel Marketplace for the relational database. Vercel Postgres is no longer first-party; existing Vercel Postgres databases were migrated to Neon through the Vercel Marketplace in December 2024.

### 4. Add Your Domain
In Vercel project settings → **Domains**, add `sexsocialization.com`.
Vercel will show you the exact DNS records to set at your domain registrar.
Always use the values shown in the Vercel dashboard — do not hardcode IPs as
they can change. See [Vercel DNS documentation](https://vercel.com/docs/projects/domains/add-a-domain)
for current instructions.

Vercel will auto-provision an HTTPS/TLS certificate via Let's Encrypt.

### 5. Verify
- Visit `https://sexsocialization.com`
- Age gate should appear
- All routes should work
- Check `https://securityheaders.com/?q=sexsocialization.com` — target A rating

## Remaining Product Work

The app now has backend auth and database-backed agreement drafts. Remaining product work:

- [x] Partner invitation flow backed by the database
- [x] Authenticated partner messaging backed by the database
- [x] Call-room foundation for a WebRTC provider
- [x] Admin moderation report queue
- [x] South African payout setup with Stripe fallback handling
- [ ] End-to-end encryption for message payloads
- [ ] Live video provider integration (LiveKit, Daily.co, Twilio, etc.)
- [ ] Automated tests (Vitest + React Testing Library recommended)
- [ ] Privacy Policy and Terms of Service pages (required for adult platforms)
- [x] Social preview asset for OG/Twitter card rendering

## South Africa Payout Setup

This app supports South African (ZA) bank account payouts in ZAR. Because Stripe does not currently support automated payouts to South African bank accounts, payout processing follows a manual EFT flow.

### How to configure (admin)

1. Sign in with an admin account and go to the Dashboard.
2. Scroll to the **"Configure ZA payout bank account"** section.
3. Fill in your South African banking details:
   - **Account holder name** — full legal name
   - **Bank name** — e.g. TymeBank, FNB, Capitec, ABSA, Standard Bank
   - **Account number** — 8–16 digit numeric account number
   - **Branch code** — 6-digit universal branch code (e.g. `678910` for TymeBank, `632005` for FNB)
   - **Account type** — Cheque, Savings, or Transmission
4. Click **Save payout details**. The system will attempt to register the account with Stripe.

### Stripe fallback behavior

Stripe does not support ZA external accounts for automated payouts. When you save ZA details, the system:

- **Saves your banking details** to the database regardless of Stripe's response.
- **Attempts Stripe token creation** for the ZA bank account.
- If Stripe rejects (expected for ZA):
  - The payout method is marked **`unsupported_or_manual`**.
  - A clear admin-facing message is shown: _"Stripe does not currently support automated payouts to South African bank accounts. Your banking details have been saved. To pay out, transfer manually via EFT or use an alternative payment provider such as Wise."_
  - The admin is prompted to process payouts manually.
- If Stripe accepts (future scenario if ZA support is added):
  - The payout method is marked **`verified`**.

### Manual payout workflow

When a user submits a payout request:

1. An admin sees the pending request in the **Payout requests** table below.
2. The admin transfers the payout amount manually via EFT or Wise using the saved banking details.
3. The admin clicks **✅ Mark Complete** on the request to record it as processed.

### Environment variables (backward compatibility)

If you prefer to configure payout details via environment variables instead of the admin UI (for example, during initial deployment), set these in Vercel Project Settings:

| Variable | Description |
|----------|-------------|
| `PAYOUT_BANK_NAME` | Bank name (e.g. `TymeBank`) |
| `PAYOUT_ACCOUNT_HOLDER` | Account holder full name |
| `PAYOUT_ACCOUNT_NUMBER` | Bank account number |
| `PAYOUT_BRANCH_CODE` | 6-digit branch code |
| `PAYOUT_ACCOUNT_TYPE` | Account type (`Cheque`, `Savings`, or `Transmission`) |

DB-stored configuration (set via admin UI) takes precedence over environment variables.
