---
version: 1.0.0
last_audited: 2026-06-12
status: verified
---

# Engineering Onboarding

## Day 1 Doctrine

Every engineer must understand:
- workflows over features
- architecture over feature piles
- boundaries over shortcuts
- observability is mandatory
- rollback is mandatory
- AI is controlled infrastructure

## Required Reading

1. `governance/doctrine/APEX_BUILD_DOCTRINE.md`
2. `memory/omni-recall/rfc/RFC_USAGE_POLICY.md`
3. `governance/architecture/ARCHITECTURE_REVIEW_GATES.md`
4. `governance/architecture/MERGE_RIGHTS_POLICY.md`
5. `governance/ci/CI_POLICY_GATES.md`
6. `governance/ai/AI_AGENT_SYSTEM_PROMPT.md`

## Merge Access Readiness

Before merge access, the engineer must explain:
- a domain boundary
- a rollback strategy
- a failure mode
- an observability plan
- a god-object risk
- an RFC approval path

## First 30 Days

The engineer must:
- author or review one RFC
- participate in one architecture review
- ship one small change through CI gates
- explain rollback and observability for that change
