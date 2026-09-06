# Provider Evaluation & Connection Checklist
## SEXSOCIALIZATION.COM Platform

**Version:** Draft v1.0  
**Last Updated:** 2026-09-06  
**Purpose:** Standardized evaluation criteria and connection workflow for all third-party providers

---

## PROVIDER CATEGORIES & PRIORITY

### Tier 1: CRITICAL (Required for Go-Live)

| Provider Type | Use Case | Status | Priority |
|---|---|---|---|
| **Age/Identity Verification** | 18+ dual verification (Partner A & B) | **PENDING SELECTION** | 🔴 URGENT |
| **Payment Processor #1** | Ozow EFT | Candidate Confirmed | ✅ Proceed |
| **Payment Processor #2** | Paystack Card/EFT | Candidate Confirmed | ✅ Proceed |
| **Database Hosting** | Neon (PostgreSQL) | Candidate Confirmed | ✅ Proceed |
| **App Hosting** | Vercel (Frontend/API) | Candidate Confirmed | ✅ Proceed |

### Tier 2: SUPPORTING (Recommended Before Launch)

| Provider Type | Use Case | Status | Priority |
|---|---|---|---|
| **Legal/Compliance Review** | South African attorney review of policies | Required | 🟡 IMPORTANT |
| **Backup/DR Provider** | Additional data backup | Optional | 🟢 Post-Launch |
| **Email Service Provider** | Transactional emails (verification, receipts) | Optional | 🟢 Post-Launch |

---

## AGE/IDENTITY VERIFICATION PROVIDER SELECTION

### Candidates Under Evaluation

#### 1. **ThisIsMe**
- **Website:** https://thisisme.co.za
- **Service:** SA ID verification, liveness detection, age confirmation
- **Compliance:** POPIA-compliant, FICA-aligned
- **Strengths:**
  - South African company (local support)
  - Dedicated POPIA compliance officer
  - Proven track record with fintech/dating platforms
  - Fast turnaround on queries
- **Weaknesses:**
  - [To be evaluated during discovery call]

#### 2. **Smile ID**
- **Website:** https://www.smileid.com
- **Service:** Pan-African ID verification, liveness, age confirmation
- **Compliance:** GDPR/ISO 27001 certified; POPIA alignment under review
- **Strengths:**
  - Multi-country support (scales if expansion needed)
  - Advanced liveness detection (spoofing resistant)
  - API-first, simple integration
- **Weaknesses:**
  - Not SA-based (may require sub-processor approval if data stored outside SA)
  - Higher transaction cost

#### 3. **LexisNexis Identity Plus**
- **Website:** https://www.lexisnexis.co.za
- **Service:** SA ID verification, fraud detection, age confirmation
- **Compliance:** POPIA-approved, extensive compliance documentation
- **Strengths:**
  - Enterprise-grade security
  - Comprehensive compliance certifications
  - Established relationship with SA regulators
- **Weaknesses:**
  - Highest cost tier
  - Longer onboarding process
  - Enterprise-focused (may be oversized for startup needs)

---

## EVALUATION CRITERIA MATRIX

### Section A: Compliance & Legal (Weight: 40%)

| Criterion | ThisIsMe | Smile ID | LexisNexis | Required Standard |
|---|---|---|---|---|
| **POPIA Compliance** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Signed DPA Available** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Data Retention Policy Acceptable** | ☐ Yes | ☐ Yes | ☐ Yes | **Max 24h raw media; outcome metadata 6-12mo** |
| **Cross-Border Transfer Documented** | ☐ Yes | ☐ Yes | ☐ Yes | **If non-SA storage, POPIA Sec 72 mechanism required** |
| **Regulatory Approval (SA FinReg/IR)** | ☐ Yes | ☐ Yes | ☐ Yes | **Preferred** |
| **Sub-Processor Transparency** | ☐ Yes | ☐ Yes | ☐ Yes | **Full list provided** |

**Scoring:** All "Yes" = Pass; 1+ "No" = Escalate to attorney review

---

### Section B: Technical & Security (Weight: 35%)

| Criterion | ThisIsMe | Smile ID | LexisNexis | Required Standard |
|---|---|---|---|---|
| **SOC 2 Type II Certified** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **ISO 27001 Certified** | ☐ Yes | ☐ Yes | ☐ Yes | **Preferred** |
| **Encryption at Rest (AES-256+)** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Encryption in Transit (TLS 1.2+)** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **API Rate Limiting & DDoS Protection** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **99.9%+ Uptime SLA** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Liveness Detection Spoofing Resistance** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory for 18+ verification** |
| **Audit Logging & Monitoring** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Incident Response Plan (24h response)** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Disaster Recovery / Backup** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |

**Scoring:** 9-10 "Yes" = Excellent; 7-8 = Acceptable; <7 = Escalate

---

### Section C: Operational & Integration (Weight: 15%)

| Criterion | ThisIsMe | Smile ID | LexisNexis | Required Standard |
|---|---|---|---|---|
| **API Documentation Clarity** | ☐ Yes | ☐ Yes | ☐ Yes | **Must be sufficient for dev team** |
| **Integration Complexity** | ☐ Low | ☐ Low | ☐ Medium | **Prefer Low complexity** |
| **Estimated Integration Time** | ☐ <2 weeks | ☐ <2 weeks | ☐ 2-4 weeks | **Goal: <2 weeks** |
| **Developer Support (Email/Slack/Phone)** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Sandbox/Test Environment Available** | ☐ Yes | ☐ Yes | ☐ Yes | **Mandatory** |
| **Production SLA & Support Response** | ☐ 24h | ☐ 24h | ☐ 4h | **Minimum: 24h** |
| **Webhook Notifications (Verification Status)** | ☐ Yes | ☐ Yes | ☐ Yes | **Preferred** |
| **Bulk API (for data subject requests)** | ☐ Yes | ☐ Yes | ☐ Yes | **Preferred** |

**Scoring:** Weighted by operational needs; Low complexity + <2 weeks = Strong preference

---

### Section D: Pricing & Commercial (Weight: 10%)

| Criterion | ThisIsMe | Smile ID | LexisNexis | Consideration |
|---|---|---|---|---|
| **Cost per Verification** | $[X] | $[X] | $[X] | **Compare against projected volume** |
| **Monthly Minimum Fee** | $[X] | $[X] | $[X] | **Budget constraint** |
| **Volume Discounts Available** | ☐ Yes | ☐ Yes | ☐ Yes | **At 10k+ verifications/month?** |
| **Contract Lock-In Period** | [___] months | [___] months | [___] months | **Prefer ≤12 months** |
| **Cancellation Terms** | [___] | [___] | [___] | **Prefer 30-day notice, no penalty** |
| **Price Increase Notice Period** | [___] days | [___] days | [___] days | **Prefer 60+ days** |

**Calculation:** (Cost per verification × 12-month volume projection) + monthly minimum = Total annual cost

---

## CONNECTION & ONBOARDING WORKFLOW

### Phase 1: DISCOVERY CALL (Week 1)

**For Each Candidate Provider:**

#### Pre-Call Preparation
- [ ] Identify dedicated contact/Sales Manager at provider
- [ ] Send over:
  - Platform overview (2-page summary: couple-based dating, 18+ only, POPIA-sensitive)
  - Expected verification volume (first 12 months: [INSERT PROJECTION])
  - Data retention requirements (raw media delete 24h, outcome retain 6-12mo)
  - Cross-border data flow questions (if applicable)
  - Timeline: need to go live by [INSERT DATE]

#### Discovery Call Agenda (60 min)
- [ ] Confirm POPIA compliance readiness
- [ ] Confirm DPA template availability (reference our DPA_TEMPLATE.md)
- [ ] Review data retention and deletion procedures
- [ ] Clarify encryption, security certifications (SOC 2, ISO 27001)
- [ ] Discuss integration timeline and resource allocation
- [ ] Pricing model and volume discounts
- [ ] Escalation path for technical/compliance issues
- [ ] Request sandbox/test credentials by [DATE]

#### Post-Call Actions
- [ ] Document responses in Section F (Provider Response Log) below
- [ ] Schedule technical deep-dive call within 2 weeks
- [ ] Request full security/compliance documentation (SOC 2, DPA draft, etc.)

**Action Items Owner:** [Product/Tech Lead]  
**Deadline:** [DATE + 3 days]

---

### Phase 2: TECHNICAL DEEP-DIVE (Week 2-3)

**For Top 2 Candidates:**

#### Pre-Call
- [ ] Assign developer(s) to lead integration assessment
- [ ] Prepare technical questions:
  - API endpoint documentation (verification initiation, status polling, webhooks)
  - Error handling and retry logic
  - Rate limiting and throttling
  - Test data/fixtures available?
  - Liveness algorithm (how does spoofing resistance work?)
  - Verification latency (how long for response?)

#### Technical Call Agenda (90 min)
- [ ] Live API walkthrough (provider demo or developer screen share)
- [ ] Sandbox access setup and test credential issuance
- [ ] Integration libraries/SDKs available (Node.js, React Native, etc.)
- [ ] Webhook security (signature verification, IP whitelisting)
- [ ] Data format and field mapping (SA ID → verification result)
- [ ] Error codes and failure scenarios
- [ ] Audit logging / data access logs available to us
- [ ] POPIA Subject Access Request (SAR) support (can they export data for our users?)

#### Post-Call Actions
- [ ] Developer team executes simple test integration in sandbox
- [ ] Document findings in Section G (Technical Assessment Log)
- [ ] Flag any blockers/concerns

**Action Items Owner:** [Developer/CTO]  
**Deadline:** [DATE + 5 days]

---

### Phase 3: LEGAL & COMPLIANCE REVIEW (Week 3-4)

**For Top 1-2 Candidates:**

#### Legal Documents to Request
- [ ] Standard DPA or Data Processing Addendum
- [ ] Security & Compliance Certifications (SOC 2 Type II, ISO 27001, pentest report)
- [ ] Incident Response Policy (breach notification timeline)
- [ ] Sub-processor list and approval mechanism
- [ ] References (especially fintech/dating/sensitive data platforms)

#### Attorney Review Tasks
- [ ] Review DPA against our DPA_TEMPLATE.md
- [ ] Confirm POPIA Sec 26 (Special Personal Information) handling
- [ ] Assess cross-border data transfer mechanisms (if applicable)
- [ ] Confirm data retention aligns with our policy (24h raw media deletion)
- [ ] Review liability and indemnification clauses
- [ ] Confirm compliance with CPA (if provider has subscription/billing component)

#### Risk Assessment
- [ ] Low Risk: All checks pass, attorney approves
- [ ] Medium Risk: Minor gaps, attorney approves with amendments
- [ ] High Risk: Major compliance issues, escalate to senior leadership

**Action Items Owner:** [General Counsel / External Attorney]  
**Deadline:** [DATE + 7 days]

---

### Phase 4: COMMERCIAL NEGOTIATION (Week 4-5)

**For Selected Provider:**

#### Negotiation Points
- [ ] Confirm pricing, volume discounts, monthly minimums
- [ ] Confirm contract term (12-month preferred)
- [ ] Confirm cancellation terms (30-day notice preferred, no penalty)
- [ ] Confirm SLA and support response times
- [ ] Confirm price increase notice period (60+ days preferred)
- [ ] Confirm data deletion/retention terms in writing

#### DPA Negotiation
- [ ] Request provider's DPA or Data Processing Addendum
- [ ] Review against our DPA_TEMPLATE.md
- [ ] Propose amendments (if needed):
  - [ ] Add POPIA Sec 26 handling for sexual-life data (if applicable)
  - [ ] Clarify 24-hour raw media deletion requirement
  - [ ] Add audit rights and compliance certification provisions
  - [ ] Confirm sub-processor approval requirement
- [ ] Obtain executed DPA before payment/access

#### Contracting
- [ ] Finalize Statement of Work (SOW) or Service Agreement
- [ ] Finalize Data Processing Agreement
- [ ] Obtain authorized signatures from both parties
- [ ] Store in secure shared repository (e.g., Google Drive, OneDrive)
- [ ] Send copy to external counsel for records

**Action Items Owner:** [Finance/Legal]  
**Deadline:** [DATE + 10 days]

---

### Phase 5: INTEGRATION & TESTING (Week 5-8)

#### Integration Checklist
- [ ] Credentials provisioned (API keys, sandbox access, etc.)
- [ ] Developer implements basic verification flow
- [ ] Webhook integration for async verification status
- [ ] Error handling and retry logic
- [ ] Encryption/secure credential storage in application
- [ ] Unit tests for verification workflows
- [ ] Integration tests with sandbox

#### UAT Testing
- [ ] QA conducts end-to-end verification flow testing
- [ ] Test both Partner A and Partner B separate verifications
- [ ] Test pass/fail scenarios
- [ ] Test failed verification → re-verification workflow
- [ ] Test data deletion on successful verification (via provider audit)
- [ ] Test POPIA Subject Access Request (SAR) flow
- [ ] Document test results and sign-off

#### Security Testing
- [ ] Penetration testing (if required by provider or internal policy)
- [ ] API rate limiting and DDoS resilience check
- [ ] Webhook signature validation
- [ ] Encrypted credential handling audit

**Action Items Owner:** [QA/Dev Lead]  
**Deadline:** [DATE + 14 days]

---

### Phase 6: LAUNCH READINESS (Week 8-9)

#### Pre-Production Checklist
- [ ] Monitoring configured (uptime, error rates, API latency)
- [ ] Alerting configured (verification failures, API errors)
- [ ] Rollback plan documented (if provider becomes unavailable)
- [ ] Support escalation path documented (provider support contact, SLA response times)
- [ ] Privacy Policy updated with provider details and data flows
- [ ] Terms of Service updated with 18+ verification requirement
- [ ] Privacy Notice sent to all beta users
- [ ] External counsel conducts final compliance review

#### Production Launch
- [ ] Provider credentials migrated to production
- [ ] Monitoring and alerting tested in production
- [ ] First 100 verifications manually QA'd
- [ ] Provider support contact on speed-dial (first week)
- [ ] Post-launch monitoring plan (24h, 7d, 30d reviews)

**Action Items Owner:** [DevOps/Product Lead]  
**Deadline:** [DATE]

---

## SECTION F: PROVIDER RESPONSE LOG

### Provider: [NAME]
**Contact:** [Name, Title, Email, Phone]  
**Company:** [Company Name & Address]  
**Discovery Call Date:** [DATE]  
**Technical Call Date:** [DATE]  
**Legal Review Date:** [DATE]

#### Compliance & Legal Responses

| Question | Response | Status | Evidence |
|---|---|---|---|
| **POPIA Compliance Status** | [Provider response] | ☐ Pass | [Link to cert/attestation] |
| **DPA Available** | [Yes/No/Draft] | ☐ Pass | [Attached/Link] |
| **Data Retention (Raw Media 24h)** | [Confirmed/Needs Revision] | ☐ Pass | [DPA Section X] |
| **Encryption at Rest (AES-256+)** | [Confirmed/Details] | ☐ Pass | [SOC 2 Report, Page X] |
| **Encryption in Transit (TLS 1.2+)** | [Confirmed/Details] | ☐ Pass | [Security Doc] |
| **Cross-Border Data Flow (if applicable)** | [Storage location, transfer mechanism] | ☐ Pass | [Privacy Policy Section X] |
| **Sub-Processor List** | [Attached/Link] | ☐ Pass | [Attachment] |

#### Technical Responses

| Question | Response | Status | Notes |
|---|---|---|---|
| **API Documentation Available** | [URL/Attached] | ☐ Pass | [Clarity score: 1-10] |
| **Integration Complexity** | [Low/Medium/High] | ☐ Pass | [Estimated days: X] |
| **Sandbox Credentials Issued** | [Yes/Pending Date] | ☐ Pass | [Credentials sent DATE] |
| **Test Verification Latency** | [X seconds] | ☐ Pass | [Acceptable: <5 sec] |
| **Webhook Notifications** | [Supported/Roadmap] | ☐ Pass | [Latency: X sec] |
| **Liveness Spoofing Resistance** | [Algorithm: X] | ☐ Pass | [Details/Test results] |

#### Commercial Responses

| Item | Response | Status |
|---|---|---|
| **Cost per Verification** | $[X] | ☐ Negotiating |
| **Monthly Minimum Fee** | $[X] | ☐ Negotiating |
| **Volume Discounts at 10k+** | [Yes/No, % discount] | ☐ Agreed |
| **Contract Term** | [12 months/Other] | ☐ Agreed |
| **Cancellation Terms** | [30-day notice/Other] | ☐ Agreed |

#### Overall Assessment

**Compliance Risk:** ☐ Low | ☐ Medium | ☐ High  
**Technical Fit:** ☐ Excellent | ☐ Good | ☐ Acceptable | ☐ Poor  
**Cost Competitiveness:** ☐ Below Average | ☐ Average | ☐ Above Average  

**Recommendation:** ☐ **APPROVE** | ☐ **CONDITIONAL APPROVAL** | ☐ **REJECT**

**Conditions/Notes:**  
[If conditional, list required amendments/actions before approval]

**Approved By:** [Name, Title, Date]

---

## SECTION G: TECHNICAL ASSESSMENT LOG

### Provider: [NAME]
**Developer Lead:** [Name, Contact]  
**Assessment Date:** [DATE]  
**Sandbox Access:** ☐ Active | ☐ Pending | ☐ Denied

#### API Integration Assessment

**Endpoint Summary:**
```
POST /verify/initiate
  - Input: SA ID, email, phone, date of birth (Partner A/B separate calls)
  - Output: verification_id, redirect_url
  - Latency: [X ms]

GET /verify/status/:verification_id
  - Output: status (pending/pass/fail), age_calculated, timestamp
  - Polling interval: [X seconds]

Webhook: POST /api/webhooks/verification
  - Triggered on completion (async)
  - Payload signature verification: [HMAC-SHA256]
  - Retry policy: [3 attempts, X second intervals]
```

#### Test Integration Results

| Test Case | Expected | Actual | Status |
|---|---|---|---|
| Initiate verification (Partner A) | 200 + verification_id | [Result] | ☐ Pass |
| Poll status (pending) | 200 + pending | [Result] | ☐ Pass |
| Poll status (pass) | 200 + pass + age | [Result] | ☐ Pass |
| Poll status (fail) | 200 + fail + reason | [Result] | ☐ Pass |
| Webhook delivery (on pass) | Signature valid, payload correct | [Result] | ☐ Pass |
| Error handling (invalid ID) | 400 + error message | [Result] | ☐ Pass |
| Rate limiting | 429 after X requests | [Result] | ☐ Pass |

#### Integration Blockers

| Blocker | Severity | Status | Resolution |
|---|---|---|---|
| [Issue description] | 🔴 Critical | ☐ Open | [Plan to fix] |
| [Issue description] | 🟡 Medium | ☐ Open | [Plan to fix] |

#### Developer Recommendations

**Strengths:**
- [List positive findings]

**Gaps/Concerns:**
- [List any integration concerns]

**Estimated Integration Effort:**
- Setup & credentials: X days
- API integration: X days
- Testing: X days
- **Total: X days**

**Developer Sign-Off:** [Name, Date]

---

## SECTION H: LEGAL ASSESSMENT LOG

### Provider: [NAME]
**Attorney/Counsel:** [Name, Firm, Contact]  
**Assessment Date:** [DATE]  
**Provider's DPA Status:** ☐ Provided | ☐ Draft | ☐ Pending

#### POPIA Compliance Findings

| Compliance Area | Assessment | Risk | Evidence |
|---|---|---|---|
| **Special Personal Information Handling** | Does DPA address POPIA Sec 26 (sexual-life data)? | [Low/Med/High] | [DPA Section X] |
| **Lawful Basis** | Is consent requirement clear? | [Low/Med/High] | [DPA Section X] |
| **Data Retention** | Does DPA support 24h raw media deletion? | [Low/Med/High] | [DPA Section X] |
| **Cross-Border Transfer (if applicable)** | Is POPIA Sec 72 mechanism documented? | [Low/Med/High] | [DPA Section X] |
| **Data Subject Rights** | Can provider support SAR/deletion/objection? | [Low/Med/High] | [DPA Section X] |
| **Breach Notification** | 72-hour notification commitment? | [Low/Med/High] | [DPA Section X] |
| **Sub-Processor Approval** | Does DPA require Controller approval before engaging subs? | [Low/Med/High] | [DPA Section X] |

#### DPA Comparison to Our Template

| Section | Our Template | Provider's DPA | Gaps/Amendments Needed |
|---|---|---|---|
| Responsible Party Info | ☑ Complete | [Provider details] | [X] |
| Personal Information Categories | ☑ Defined | [Provider scope] | [X] |
| Special Personal Info (Sec 26) | ☑ Included | [Provided/Missing] | [Amend if missing] |
| Operator Responsibilities | ☑ Comprehensive | [Provided scope] | [Amend/expand] |
| Data Retention & Deletion | ☑ Detailed | [Provided policy] | [Amend if needed] |
| Security Controls | ☑ Required | [Provided spec] | [Strengthen if needed] |
| Audit & Inspection Rights | ☑ Included | [Provided rights] | [Expand if limited] |
| Termination & Post-Term | ☑ Clear | [Provided terms] | [Clarify if vague] |
| Liability & Indemnification | ☑ Balanced | [Provided terms] | [Negotiate if needed] |

#### Required Amendments

**High Priority (Mandatory):**
1. [Amendment 1]
2. [Amendment 2]

**Medium Priority (Recommended):**
1. [Amendment 1]
2. [Amendment 2]

**Low Priority (Nice-to-Have):**
1. [Amendment 1]

#### Legal Sign-Off

**Overall Compliance Risk:** ☐ Low | ☐ Medium | ☐ High

**Conditions for Approval:**
- [ ] All high-priority amendments made
- [ ] DPA executed and signed
- [ ] Sub-processor list provided
- [ ] Security certifications provided

**Attorney Recommendation:** ☐ **APPROVE** | ☐ **CONDITIONAL APPROVAL** | ☐ **REQUEST ALTERNATIVE PROVIDER**

**Attorney Name & Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**Firm:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## SECTION I: FINAL PROVIDER SELECTION DECISION

### Decision Date: [DATE]
### Approvals Required: Product Lead ☐ | CTO ☐ | Finance ☐ | Legal ☐

| Provider | Compliance | Technical | Commercial | Legal Risk | Overall Score | Recommendation |
|---|---|---|---|---|---|---|
| **ThisIsMe** | [Pass/Fail] | [Pass/Fail] | [Pass/Fail] | [Low/Med/High] | [Score/10] | ☐ Select |
| **Smile ID** | [Pass/Fail] | [Pass/Fail] | [Pass/Fail] | [Low/Med/High] | [Score/10] | ☐ Select |
| **LexisNexis** | [Pass/Fail] | [Pass/Fail] | [Pass/Fail] | [Low/Med/High] | [Score/10] | ☐ Select |

### Selected Provider: [NAME]

**Key Rationale:**
- Best compliance fit: [Why]
- Strongest technical integration: [Why]
- Most competitive pricing: [Why]
- Lowest legal risk: [Why]

**Contract Execution Date:** [DATE]  
**Integration Start Date:** [DATE]  
**Production Launch Date:** [DATE]

**Final Approval Signatures:**

Product Lead: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
CTO: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Finance Lead: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
General Counsel: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## PAYMENT PROCESSORS: OZOW & PAYSTACK CONNECTION

### Existing Contracts Status
- [ ] Ozow: DPA signed and active
- [ ] Paystack: DPA signed and active

### If Not Yet Connected:

#### OZOW (South African EFT)
**Website:** https://www.ozow.com  
**Contact:** [sales contact TBD]  
**Setup Checklist:**
- [ ] Business registration verified
- [ ] Bank account details confirmed
- [ ] API integration tested (payment redirect, callback)
- [ ] Webhook security configured
- [ ] DPA executed and signed
- [ ] PCI DSS compliance confirmed
- [ ] Refund/chargeback policy documented

#### PAYSTACK (Card & EFT Processing)
**Website:** https://paystack.com  
**Contact:** [business@paystack.com]  
**Setup Checklist:**
- [ ] Business account created
- [ ] Bank account linked
- [ ] API keys generated
- [ ] API integration tested (charge card, verify transaction)
- [ ] Webhook security configured
- [ ] DPA executed and signed
- [ ] PCI DSS Level 1 compliance confirmed
- [ ] Currency/settlement currency confirmed (ZAR)

---

## HOSTING PROVIDERS: NEON & VERCEL CONNECTION

### Database Hosting (Neon - PostgreSQL)
**Website:** https://neon.tech  
**Status:** ☐ Already active | ☐ Needs setup

**Connection Checklist:**
- [ ] Neon account created
- [ ] Database provisioned (PostgreSQL)
- [ ] Connection string secured in environment
- [ ] Automated backups enabled (daily)
- [ ] DPA/GDPR terms accepted
- [ ] SOC 2 compliance confirmed
- [ ] Monitoring & alerting configured

### App Hosting (Vercel)
**Website:** https://vercel.com  
**Status:** ☐ Already active | ☐ Needs setup

**Connection Checklist:**
- [ ] Vercel account created
- [ ] GitHub/Git repository linked
- [ ] Environment variables configured (API keys, secrets)
- [ ] Continuous deployment (CI/CD) configured
- [ ] SSL/TLS certificate (automatic with Vercel)
- [ ] DPA/compliance terms accepted
- [ ] CDN and DDoS protection enabled by default

---

## NEXT IMMEDIATE ACTIONS

### Week 1 (Starting [DATE])
- [ ] **Product Lead:** Confirm age-verification provider selection approach
- [ ] **Legal:** Schedule external attorney consultation
- [ ] **CTO:** Prepare provider evaluation scorecard
- [ ] **Business:** Prepare volume projections and budget for provider costs

### Week 2-3
- [ ] **All:** Discovery calls with ThisIsMe, Smile ID, LexisNexis
- [ ] **CTO:** Technical deep-dive calls with top 2 candidates
- [ ] **Legal:** DPA review and amendment requests

### Week 4-5
- [ ] **Finance:** Negotiate commercial terms
- [ ] **Legal:** Finalize contracts and DPA
- [ ] **All:** Final provider selection decision

### Week 6-8
- [ ] **Dev:** Integration and testing
- [ ] **QA:** UAT and sign-off

### Week 9+
- [ ] **DevOps:** Production launch
- [ ] **Product:** Post-launch monitoring

---

**Document Owner:** [Name, Title]  
**Last Updated:** 2026-09-06  
**Next Review Date:** [DATE + 30 days]

---
**End of Provider Evaluation & Connection Checklist**
