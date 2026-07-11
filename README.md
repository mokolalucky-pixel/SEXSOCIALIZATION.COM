# SEXSOCIALIZATION.COM

A privacy-conscious relationship communication app focused on long-distance connection.

## What was added (Essentials Baseline)

- Frontend app scaffolded with Vite + React
- Core pages:
  - Home
  - Login
  - Sign Up
  - Dashboard
  - 404 fallback
- Navigation + route protection scaffold
- Basic form validation and user-friendly errors
- Responsive layout and accessible semantic structure
- Environment configuration (`.env.example`)
- Security headers for Vercel via `vercel.json`
- Updated `.gitignore` for Node/Vite projects
- Deployment-ready scripts in `package.json`

## Project Structure

- `client/` – React frontend application
  - `src/main.jsx` – app entrypoint
  - `src/App.jsx` – route definitions
  - `src/layouts/AppLayout.jsx` – shared app layout
  - `src/pages/` – page-level views
  - `src/components/ProtectedRoute.jsx` – auth guard shell
  - `src/styles.css` – responsive base styling

## Local Development

From `client/`:

```bash
npm install
npm run dev
```

## Build

From `client/`:

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` in `client/` and set values as needed.

## Notes

This is a production-ready **baseline scaffold**. For full functionality, next steps include:

- Real authentication backend integration
- End-to-end encrypted messaging implementation
- Video calling integration (WebRTC provider/service)
- Persistent datastore setup
- Role-based admin moderation tools
