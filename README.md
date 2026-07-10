# SEXSOCIALIZATION.COM

A platform concept focused on maintaining intimacy and emotional connection in long-distance relationships through secure virtual interactions.

## Project status

Early-stage repository. Core product features are not fully implemented yet.

## Repository layout

- `client/` — frontend application code (primary implementation area)
- `.github/workflows/` — CI workflows (added for quality checks)
- `README.md` — project overview and developer guide
- `SECURITY.md` — security, privacy, and responsible-use policy

## Quick start

> The exact frontend framework should be confirmed from files inside `client/`. The commands below are the default Node workflow.

```bash
# from repo root
cd client
npm install
npm run dev
```

## Build

```bash
cd client
npm run build
```

## Test

```bash
cd client
npm test
```

If the project uses a different package manager, replace with the equivalent (`pnpm` or `yarn`).

## Environment variables

Create a `.env` file in `client/` for local development. Suggested variables:

- `NODE_ENV=development`
- `APP_URL=http://localhost:3000`
- `API_BASE_URL=http://localhost:4000`
- `SESSION_SECRET=<strong-random-secret>`

For production, store secrets in your deployment platform’s secret manager (never commit credentials).

## Deployment guidance

Recommended deployment flow:

1. Push to `main`
2. CI validates install/lint/test/build
3. Deploy build artifacts to hosting platform (e.g., Vercel/Netlify for frontend)
4. Configure production env vars in host settings

## Safety, privacy, and consent commitments

Because this project involves intimate relationship contexts:

- Require clear consent-oriented UX for all sensitive interactions.
- Prohibit exploitative, coercive, or non-consensual use.
- Do not collect more personal data than necessary.
- Offer transparent data deletion pathways.

See `SECURITY.md` for security and reporting details.

## Contributing

1. Create a feature branch
2. Open a pull request
3. Ensure CI passes before merge

## License

GNU GPL v3.0
