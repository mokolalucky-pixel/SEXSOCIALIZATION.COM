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
- [ ] End-to-end encryption for message payloads
- [ ] Live video provider integration (LiveKit, Daily.co, Twilio, etc.)
- [ ] Automated tests (Vitest + React Testing Library recommended)
- [ ] Privacy Policy and Terms of Service pages (required for adult platforms)
- [x] Social preview asset for OG/Twitter card rendering
