> CI validates release readiness. Production certification is manual and owner-approved only.

---
version: 1.4.0
last_audited: 2026-09-29
status: verified
---

<!-- APEX_DOC_STAMP: VERSION=v9.9-DOC-RELEASE-INDEX | LAST_UPDATED=2026-09-29 -->

> CI validates release readiness. Production certification is manual and owner-approved only.

# APEX OmniHub Documentation

**Enterprise AI Orchestration Platform**

- **Document Version:** 2.11.0
- **Platform Version:** 1.8.3
- **Last Updated:** 2026-09-29
- **Current Documentation Index:** [Documentation Release Index](DOCUMENTATION_RELEASE_INDEX.md)
- **Current Certification Boundary:** [`docs/release/release-validation-matrix.json`](../../../docs/release/release-validation-matrix.json) records repo-verified remediations; items labeled `BLOCKED` / `REQUIRES_MANUAL_VALIDATION` still require owner/live evidence. CI is validation evidence only ([CI Status Policy](project-status/CI_STATUS_POLICY.md)).
- **Current Platform Snapshot:** [Current Platform State — 2026-09-29](CURRENT_PLATFORM_STATE_2026_09_29.md) (head `6c62fdb8`, git-verified counts, read-only production state, open owner items; supersedes the 2026-07-16 snapshot). Merged work packages and finding closure: [`.understand-anything/CANONICAL_STATE_2026-09-29.md`](../../../.understand-anything/CANONICAL_STATE_2026-09-29.md).
- **Historical Audit Baseline:** [Third-Party Code Audit 2026-03-09](../archive/docs/audits/THIRD_PARTY_CODE_AUDIT_2026_03_09.md) — Score: **94.3/100 (A)**


---

## Quick Navigation

**Start here:** [Documentation Release Index](DOCUMENTATION_RELEASE_INDEX.md) — current docs inventory, authority order, and anti-drift rules. Then read the [Canonical Repo Map](architecture/ARCHITECTURE_CANONICAL_MAP.md) for architecture + infrastructure context.

**OmniDash sidebar rail source of truth:** `apps/omnihub-site/src/contracts/omnidash-sidebar-widgets.ts`; see [OmniDash](platform/OMNIDASH.md), [Canonical Truth](architecture/CANONICAL_TRUTH.md), and [CI Guardrails Runbook](ops/OPS_RUNBOOKS_CI_GUARDRAILS.md).

| Category                                            | Description                                |
| --------------------------------------------------- | ------------------------------------------ |
| [Documentation Release Index](DOCUMENTATION_RELEASE_INDEX.md) | Current maps, READMEs, status, audits, and runbooks |
| [Platform Modules](#platform-modules)               | Core Omni-\* module documentation          |
| [Architecture](#architecture)                       | System design and technical specifications |
| [Project Status](#project-status)                   | Current status and readiness reports       |
| [Infrastructure](#infrastructure)                   | Deployment, cloud, and DevOps              |
| [Operations](#operations)                           | Runbooks and operational procedures        |
| [Security](#security)                               | Security controls and policies             |
| [Compliance](#compliance)                           | SOC2, GDPR, audit readiness                |
| [Knowledge](#knowledge)                             | Developer guides and onboarding            |
| [Quality & Scalability](#quality--scalability)      | QA framework and scaling architecture      |
| [API & Extensibility](#api--extensibility)          | API docs and plugin architecture           |
| [Institutional Readiness](#institutional-readiness) | M&A due diligence and valuation            |
| [Testing](#testing)                                 | Test results and simulation                |
| [Audits](#audits)                                   | Audit reports and remediation              |

---

## Platform Modules

Core platform components with dedicated documentation:

| Module            | Description                     | Documentation                                                     |
| ----------------- | ------------------------------- | ----------------------------------------------------------------- |
| **OmniTrace**     | Workflow observability & replay | [OMNITRACE.md](platform/OMNITRACE.md)                             |
| **OmniPolicy**    | Deterministic policy evaluation | [OMNIPOLICY.md](platform/OMNIPOLICY.md)                           |
| **OmniEval**      | Security evaluation & CI gate   | [OMNIEVAL.md](platform/OMNIEVAL.md)                               |
| **OmniPort**      | Ingress engine & API            | [OMNIPORT_API_REFERENCE.md](platform/OMNIPORT_API_REFERENCE.md)   |
| **OmniDash**      | Executive dashboard + 9-widget sidebar rail contract | [OMNIDASH.md](platform/OMNIDASH.md)                               |
| **OmniLink**      | Integration bus                 | [OMNILINK_MANIFESTO_LITE.md](platform/OMNILINK_MANIFESTO_LITE.md) |
| **OmniBoard**     | Client-facing modal for app integration onboarding | [OMNIBOARD.md](platform/OMNIBOARD.md)                             |
| **OmniLink PWA**  | Mobile PWA capabilities         | [OMNILINK_MOBILE_PWA.md](platform/OMNILINK_MOBILE_PWA.md)         |
| **OmniSentry**    | Health & monitoring system      | [OMNISENTRY.md](platform/OMNISENTRY.md)                           |
| **Connector Kit** | Integration adapters            | [CONNECTOR_KIT.md](platform/CONNECTOR_KIT.md)                     |
| **Protocol Conformance** | MCP/A2A gateway conformance     | [OMNIHUB_PROTOCOL_CONFORMANCE.md](platform/OMNIHUB_PROTOCOL_CONFORMANCE.md) |

---

## Architecture

System design and technical specifications:

| Document                                                                            | Description                 |
| ----------------------------------------------------------------------------------- | --------------------------- |
| [Executive Architecture Summary](architecture/EXECUTIVE_ARCHITECTURE_SUMMARY.md)    | High-level technical specs  |
| [Bounded-Context Map](./architecture/BOUNDED_CONTEXT_MAP.md) | Operational boundaries & handoffs |
| [General Tech Specs](architecture/GENERAL_TECH_SPECS.md)                            | Platform specifications     |
| [Detailed System Design](architecture/DETAILED_SYSTEM_DESIGN.md)                    | Complete system design      |
| [OmniLink Portability & SRE](architecture/OMNILINK_PORTABILITY_AND_SRE_STRATEGY.md) | Integration bus strategy    |
| [MAN Mode Workflows](architecture/MAN_MODE_WORKFLOW_DIAGRAMS.md)                    | Manual Approval Node flows     |
| [Frontend Structure Map](architecture/frontend-map.md)                              | Frontend topology + diagram |

---

## Project Status

Current deployment state and ecosystem overview:

| Document                                                    | Description              |
| ----------------------------------------------------------- | ------------------------ |
| [CI Status Policy](project-status/CI_STATUS_POLICY.md) | CI status interpretation; production certification still defers to release-validation-matrix plus owner/live evidence |
| [Release Readiness v1.6.1 (archived)](../archive/docs/project-status/APEX_RELEASE_READINESS_REPORT_v1.6.1.md) | Historical release readiness report — 2026-05-20 |

---

## Infrastructure

Deployment, cloud infrastructure, and DevOps:

| Document                                                               | Description                    |
| ---------------------------------------------------------------------- | ------------------------------ |
| [Production Deployment](infrastructure/PRODUCTION_DEPLOYMENT_GUIDE.md) | Deployment guide               |
| [CI Runtime Gates](infrastructure/CI_RUNTIME_GATES.md)                 | Quality gates (canonical CI reference) |
| [Disaster Recovery](infrastructure/DISASTER_RECOVERY_PLAN.md)          | DR procedures                  |
| [Cloud Agnostic](infrastructure/CLOUD_AGNOSTIC_ARCHITECTURE.md)        | Multi-cloud support            |
| [Supabase Setup Guide](infrastructure/SUPABASE_SETUP.md)               | Supabase project configuration |
| [Observability Stack](infrastructure/OBSERVABILITY_STACK_SETUP.md)     | Monitoring setup               |
| [Blockchain Config](infrastructure/BLOCKCHAIN_CONFIG.md)               | Web3 configuration             |
| [Cost Optimization](infrastructure/COST_OPTIMIZATION.md)               | Cost management                |
| [Backup Verification](infrastructure/BACKUP_VERIFICATION.md)           | Backup procedures              |

### Deployment Paths

| Document                                                                   | Description           |
| -------------------------------------------------------------------------- | --------------------- |
| [Path A: Serverless](infrastructure/PATH_A_ENHANCED_SERVERLESS.md)         | Serverless deployment |
| [Path B: Containerized](infrastructure/PATH_B_CONTAINERIZED_MULTICLOUD.md) | Container deployment  |

### Migration

| Document                                                 | Description          |
| -------------------------------------------------------- | -------------------- |
| [Migration Notes](infrastructure/MIGRATION_NOTES.md)     | Migration guidance   |
| [Migration Runbook](infrastructure/MIGRATION_RUNBOOK.md) | Migration procedures |

---

## Operations

Operational runbooks and procedures:

| Document                                                   | Description                         |
| ---------------------------------------------------------- | ----------------------------------- |
| [CI Guardrails Runbook](ops/OPS_RUNBOOKS_CI_GUARDRAILS.md) | Canonical release/CI guardrail remediation |
| [Operational Excellence](ops/OPERATIONAL_EXCELLENCE.md)    | Enterprise operations framework     |
| [Incident Response](ops/INCIDENT_RESPONSE.md)              | Incident handling                   |
| [Adaptive Nightly Eval](ops/adaptive-nightly-eval.md)      | Automated evaluation                |
| [OmniDash RCA](ops/omnidash-asset-rca.md)                  | Historic Incident RCA               |
| [Legacy Operations Runbook](ops/OPS_RUNBOOK.md)            | Deprecated read-only historical stub |
| [Operations Runbook v1.3.8](ops/OPS_RUNBOOK_v1.3.8.md)     | Historical Omnicognition/OmniRoute runbook |

### Recovery Guides

| Document                                                 | Description             |
| -------------------------------------------------------- | ----------------------- |
| [DR Runbook](guides/DR_RUNBOOK.md)                       | Disaster recovery       |
| [Web3 Verification](guides/WEB3_VERIFICATION_RUNBOOK.md) | Blockchain verification |
| [Native Push Setup](guides/NATIVE_PUSH_SETUP.md)         | Push notification setup |
| [APEX Recon Engine V2](guides/APEX_RECON_ENGINE_V2.html) | Recon Engine Docs       |

---

## Security

Security controls, policies, and hardening:

| Document                                                                 | Description                   |
| ------------------------------------------------------------------------ | ----------------------------- |
| [Security Hardening Checklist](security/SECURITY_HARDENING_CHECKLIST.md) | Enterprise security hardening |
| [Secrets Manager Setup](security/SECRETS_MANAGER_SETUP.md)               | Secrets management            |
| [Secrets Inventory](security/SECRETS_INVENTORY_AND_ROTATION.md)          | Secret rotation               |
| [Secret Scanning](security/SECRET_SCANNING.md)                           | Scanning policies             |
| [Zero Trust Baseline](security/zero-trust-baseline.md)                   | Zero trust model              |
| [Prompt Defense](security/prompt-defense-tuning.md)                      | AI security                   |
| [Device Registry](security/device-registry.md)                           | Device management             |
| [Dependency Scanning](security/dependency-scanning.md)                    | Dependency audit process and current advisory status |
| [Security Advisory Handling](security/SECURITY_ADVISORIES.md)             | Advisory disposition log and remediation standard |
| [ENV Exposure Advisory](security/ENV_FILE_EXPOSURE_ADVISORY.md)          | Environment security          |

---

## Compliance

Regulatory compliance and audit readiness:

| Document                                                                     | Description                 |
| ---------------------------------------------------------------------------- | --------------------------- |
| [SOC2 Readiness](compliance/SOC2_READINESS.md)                               | SOC2 compliance             |
| [GDPR Compliance](compliance/GDPR_COMPLIANCE.md)                             | Data protection             |
| [GDPR Workflows](compliance/GDPR_WORKFLOWS.md)                               | Data deletion workflows     |
| [Evidence Checklist](compliance/EVIDENCE_CHECKLIST.md)                       | Audit evidence              |
| [OmniLink Hybrid Certification](compliance/OMNILINK_HYBRID_CERTIFICATION.md) | Mobile/Hybrid certification |
| [Privacy Policy](compliance/PRIVACY_POLICY.md)                               | Privacy policy template     |
| [Terms of Service](compliance/TERMS_OF_SERVICE.md)                           | Terms of service template   |
| [Third Party Notices](compliance/THIRD_PARTY_NOTICES.md)                     | Open source attributions    |

---

## Knowledge

Developer resources and engineering principles:

| Document                                                    | Description               |
| ----------------------------------------------------------- | ------------------------- |
| [Developer Onboarding](onboarding/DEVELOPER_ONBOARDING.md)  | 3-day onboarding guide    |
| [System Knowledge Base](knowledge/SYSTEM_KNOWLEDGE_BASE.md) | Critical system knowledge |
| [Developer Operating Model](knowledge/DEVELOPER_OPERATING_MODEL.md) | In-repo abstractions & simulator model |
| [OmniDev Manifesto](knowledge/OMNIDEV_MANIFESTO.md)         | Engineering principles    |

---

## Quality & Scalability

Enterprise quality assurance and scalability architecture:

| Document                                                              | Description               |
| --------------------------------------------------------------------- | ------------------------- |
| [Quality Assurance Framework](quality/QUALITY_ASSURANCE_FRAMEWORK.md) | Multi-layer quality gates |
| [Scalability Architecture](scalability/SCALABILITY_ARCHITECTURE.md)   | 100K+ user scalability    |

---

## API & Extensibility

API documentation and plugin architecture:

| Document                                                    | Description                      |
| ----------------------------------------------------------- | -------------------------------- |
| [API Extension Guide](api/API_EXTENSION_GUIDE.md)           | REST/WebSocket API documentation |
| [Plugin Architecture](extensibility/PLUGIN_ARCHITECTURE.md) | Secure plugin system             |

---

## Institutional Readiness

Machine-readable compliance and valuation data:

| Document                                                               | Description            |
| ---------------------------------------------------------------------- | ---------------------- |
| [Institutional Readiness JSON](valuation/INSTITUTIONAL_READINESS.json) | M&A due diligence data |
| [Platform Valuation Brief](valuation/PLATFORM_VALUATION_BRIEF.md)      | Valuation analysis     |

---

## Testing

Test results, simulation, and quality assurance:

| Document                                              | Description            |
| ----------------------------------------------------- | ---------------------- |
| [E2E Test Results](testing/E2E_TEST_RESULTS.md)       | End-to-end test status |
| [Wildcard Tests](testing/worldwide-wildcard-tests.md) | Edge case testing      |

### Chaos Simulation

| Document                                                                    | Description              |
| --------------------------------------------------------------------------- | ------------------------ |
| [Simulation Architecture](sim/ARCHITECTURE.md)                              | Chaos framework design   |
| [Chaos Delivery](sim/CHAOS_SIMULATION_DELIVERY.md)                          | Delivery report          |
| [Simulation Runbook](sim/RUNBOOK.md)                                        | How to run simulations   |
| [Client Story](sim/CHAOTIC_CLIENT_STORY.md)                                 | Test scenario            |
| [Chaotic Client Simulation Report](sim/CHAOTIC_CLIENT_SIMULATION_REPORT.md) | User-behavior validation |
| [Test Execution](sim/TEST_EXECUTION_REPORT.md)                              | Execution details        |

---

## Audits

Audit reports, remediation, and historical records:

| Document                                                                                                                    | Description                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Armageddon Test](../archive/docs/audits/ARMAGEDDON_TEST_SUITE_REPORT.md)                                                   | Extreme testing                                                        |
| [Voice Fortress Audit](../archive/docs/audits/VOICE_FORTRESS_TELEMETRY_AUDIT.md)                                            | Voice security                                                         |
| [Full Code Audit 2026-03-06](../archive/docs/audits/FULL_CODE_AUDIT_AND_VALUATION_2026_03_06.md)                            | Full platform audit                                                    |
| [Third-Party Code Audit 2026-03-07](../archive/docs/audits/THIRD_PARTY_CODE_AUDIT_2026_03_07.md)                            | Third-party audit                                                      |
| [Third-Party Code Audit 2026-03-08](../archive/docs/audits/THIRD_PARTY_CODE_AUDIT_2026_03_08.md)                            | Third-party audit                                                      |
| [**Third-Party Code Audit 2026-03-09 ← CURRENT**](../archive/docs/audits/THIRD_PARTY_CODE_AUDIT_2026_03_09.md)             | **Latest audit — 94.3/100 (A)**                                        |
| [Annotated PR Triage 2026-05-06](../archive/docs/audits/ANNOTATED_PR_TRIAGE_2026_05_06.md)                                  | Current merge/update/close decisions for screenshot-annotated PR queue |
| [Documentation Release Index](DOCUMENTATION_RELEASE_INDEX.md)                                                               | Current docs inventory and authority order for maps, READMEs, status, audits, and runbooks |
| [Documentation Audit 2026-05-15](../archive/docs/audits/DOCUMENTATION_AUDIT_2026-05-15.md)                                  | Historical documentation inventory, stale-document disposition, and validation evidence |

---

## Document Standards

### Naming Convention

- `UPPERCASE_WITH_UNDERSCORES.md` for formal documents
- `lowercase-with-dashes.md` for informal/working documents

### Structure

```
docs/
├── README.md                 # This index
├── DOCUMENTATION_RELEASE_INDEX.md # Current authority order and inventory
├── platform/                 # Core Omni-* modules
├── architecture/             # System design
├── project-status/           # Status and readiness
├── infrastructure/           # DevOps & cloud
├── ops/                      # Operations
├── security/                 # Security controls
├── compliance/               # Regulatory
├── knowledge/                # Developer guides
├── testing/                  # QA & testing
├── sim/                      # Chaos simulation
├── audits/                   # Audit reports
└── guides/                   # How-to guides
```

---

**Last Updated:** July 16, 2026
**Release:** v1.8.3 (HEAD `88a643d8`)


## Documentation Governance

- All strategic status changes must be reflected in `docs/release/release-validation-matrix.json`, `docs/DOCUMENTATION_RELEASE_INDEX.md`, and the latest applicable audit/status artifact.
- Security posture updates must include refreshed `security/npm-audit-latest.json` and `security/npm-audit-prod.json` evidence files.
- Remove transient logs/artifacts from source control (lint dumps, local reports, backup files) unless explicitly required for compliance evidence.

## Platform

## 2026-06-14 Status Note

Main CI was red for runs #878–#897 (20+ consecutive failures). All root causes identified and fixed:

- **PR #1392** — pyOpenSSL GEN_EMAIL crash fixed (`pyopenssl>=24.0.0`)
- **PR #1393** — SSRF IPv4-mapped IPv6 misclassification fixed
- **PR #1391** — `ENABLE_ATOMIC_ROUTING_FLIP` un-hardcoded in `release.yml`

CI run #900 (`16f06b6f`) in_progress at time of this update. `TF_TOKEN` confirmed set. All infrastructure configured. Shadow deployment path unblocked.

See `CI_GREEN_CAMPAIGN_2026-06-14.md` for full root-cause audit.

