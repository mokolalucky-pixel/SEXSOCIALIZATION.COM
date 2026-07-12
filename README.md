# SEXSOCIALIZATION.COM

A privacy-conscious relationship communication app focused on long-distance connection.

## Current Baseline

This repository now contains a deployable Vite + React frontend scaffold with:

- Core routes and pages:
  - `/` Home
  - `/login` Login
  - `/signup` Sign Up
  - `/dashboard` Protected dashboard
  - `*` Not Found fallback
- Shared layout with navigation and footer
- Authentication scaffold using local storage (placeholder for real backend auth)
- Basic form validation and accessible error messaging
- Responsive base styles and keyboard focus states
- Environment template: `client/.env.example`
- Vercel deployment configuration and security headers: `vercel.json`

## Project Structure

- `client/src/main.jsx` – app entrypoint with router + auth provider
- `client/src/App.jsx` – route definitions
- `client/src/layouts/AppLayout.jsx` – shared app layout
- `client/src/components/ProtectedRoute.jsx` – route guard scaffold
- `client/src/context/AuthContext.jsx` – auth state abstraction (scaffold)
- `client/src/pages/` – page-level views
- `client/src/styles.css` – responsive base styling

## Local Development

From `client/`:

```bash
npm install
npm run dev
```

## Build and Preview

From `client/`:

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `client/.env.example` to `client/.env` and set values as needed.

## Deployment

`vercel.json` is configured for SPA routing and baseline security headers.

## Remaining Production Work

To fully finalize product functionality, complete:

- Real authentication provider integration
- Persistent datastore integration
- End-to-end encrypted messaging
- Video calling (WebRTC service/provider)
- Role-based moderation/admin tooling
- Automated tests and CI quality gates
