# SEXSOCIALIZATION.COM

A privacy-conscious relationship communication app focused on long-distance connection for adults 18+.

## Current Baseline

A deployable Vite + React frontend with:

- 18+ age verification gate (session-scoped)
- Core routes: Home, Login, Sign Up, Dashboard (protected), 404
- Shared layout with navigation and accessible skip link
- Authentication scaffold using local storage (ready for real backend)
- Form validation with accessible error messaging
- Responsive styling with dark mode and focus management
- SEO and Open Graph meta tags
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy
- GitHub Actions CI build on every push/PR
- Vercel deployment configuration

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
cd client
npm install
npm run dev
```

## Build

```bash
cd client
npm run build
npm run preview
```

## Environment Variables

Copy `client/.env.example` to `client/.env` and fill in values.

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

| Name                  | Value                              |
| --------------------- | ---------------------------------- |
| `VITE_APP_NAME`       | `SEXSOCIALIZATION.COM`             |
| `VITE_ENVIRONMENT`    | `production`                       |
| `VITE_AUTH_PROVIDER`  | `local-scaffold` (update when ready) |
| `VITE_API_BASE_URL`   | *(your backend URL when you have one)* |

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

These features are scaffolded but not yet connected to a real backend:

- [ ] Real authentication provider (Firebase Auth, Supabase, Auth0, etc.)
- [ ] Persistent datastore (Firestore, Supabase, PlanetScale, etc.)
- [ ] End-to-end encrypted messaging
- [ ] Video calling (WebRTC service: LiveKit, Daily.co, Twilio, etc.)
- [ ] Role-based admin moderation tools
- [ ] Automated tests (Vitest + React Testing Library recommended)
- [ ] Privacy Policy and Terms of Service pages (required for adult platforms)
- [ ] Social preview image: add `client/public/social-preview.png` (1200×630 px PNG) for proper OG/Twitter card rendering
