# 18+ Verification Policy

**Last Updated:** 2026-09-02  
**Status:** Draft pending legal review

## 1. Purpose
To ensure only adults (18+) access the platform and to reduce fraud and impersonation.

## 2. Provider
Verification provider is to be finalized (examples under consideration include ThisIsMe, Smile ID, LexisNexis).

> **Legal review required:** confirm FICA-aligned provider and lawful processing model.

## 3. Required Inputs
Each partner (A and B separately) may be required to submit:
- South African ID number
- ID document/photo
- Selfie
- Liveness check

## 4. Separate Verification Requirement
Both partners must pass verification independently. One partner cannot verify on behalf of the other.

## 5. Outcome Handling
- Pass: verification status stored (pass/fail + timestamp)
- Fail: access denied to protected features
- Manual review may occur within approximately 24 hours

## 6. Data Security
Verification data is encrypted in transit and at rest (target control: AES-256 at rest where applicable).

## 7. Retention and Deletion
- Raw verification artifacts are stored only for the minimum required period (target: max 24h during processing)
- After processing, raw ID media is deleted unless law requires retention
- Verification result metadata may be retained for audit, fraud prevention, and compliance purposes

## 8. Appeals and Support
Users may contact support for failed verification review, subject to anti-fraud controls.

## 9. Contact
privacy@sexsocialization.com
