# Compliance operations

This document is an operational baseline, not legal advice. A qualified lawyer must approve the applicable retention periods, lawful bases, consumer disclosures, and jurisdiction-specific procedures before launch.

## Policy acceptance

The signup flow requires affirmative acceptance of the Terms of Service and Privacy Policy. The API records the published version and acceptance timestamp in `policy_acceptances`, plus a non-content audit event. Change the version constants in the signup UI and API together whenever either policy changes materially.

## Privacy requests

Authenticated users can submit access or deletion requests from the dashboard. Requests are stored as `open` and require identity verification before fulfillment. Operations must record completion time and status, export only the requesting user's data, and delete or anonymize data according to the lawyer-approved retention schedule. Do not delete legal, fraud, security, or financial records where a lawful retention obligation applies.

## Payout data

Payout account and branch numbers are encrypted at rest with AES-256-GCM before storage. Set `PAYOUT_ENCRYPTION_KEY` to a randomly generated 32-byte base64url value in the production environment; never log, expose, or reuse it for another purpose. Restrict production access to this variable and rotate it through a planned decrypt-and-reencrypt migration. Existing plaintext payout fields remain readable only for migration compatibility; re-save each account after configuring the key, then perform an approved database migration to remove plaintext values.

## Moderation and incident response

Review open moderation reports on a defined schedule. Preserve the minimal evidence necessary for a report, apply documented sanctions consistently, and escalate credible threats, child sexual-abuse material, or non-consensual intimate imagery under counsel-approved procedures. Maintain an incident register with detection time, impact, containment, affected data categories, notification decision, and closure.

## Retention schedule

Before launch, publish a lawyer-approved retention schedule covering accounts, messages, agreements, avatar blobs, moderation reports, sessions, backups, financial/payout records, security logs, and deletion-request records. Implement scheduled deletion or anonymization and periodically test restoration and deletion workflows.
