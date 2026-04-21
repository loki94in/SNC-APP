# AI-Augmented Development Workflow — SNC APP

## Overview
This document defines how AI and human collaboration work across the full project lifecycle — from idea to deployed product and beyond.

---

## FULL DEVELOPMENT LIFECYCLE

### Phase 0 — Environment Setup
- [x] Development environment configured
- [x] Git/version control established
- [x] Required tools installed

### Phase 1 — AI Setup
- [x] AI agent configured with project context
- [x] Memory files created (AGENTS.md)
- [x] Security boundaries established

### Phase 2 — Project Intelligence
- [x] Project goals documented
- [x] Architecture decisions recorded
- [x] Reusable patterns stored in memory

### Phase 3 — Strategy
- [x] Core features defined (PRD MVP-1.00)
- [x] Feature addendum planned (ADD-1.00)
- [x] Database schema designed

### Phase 4 — Project Structure
- [x] Monorepo setup (backend + frontend + desktop)
- [x] Framework stack chosen (Bun/Hono/React/Vite/Tailwind)
- [x] File organization established

### Phase 5 — Full-Stack Development
- [x] Backend: Hono API + SQLite
- [x] Frontend: React + Vite SPA
- [x] Desktop: Electron wrapper
- [x] Authentication: JWT + bcrypt
- [x] Permissions: RBAC matrix with EDIT/VIEW/HIDDEN

### Phase 6 — UI/UX Design
- [x] Clinic-branded design system (green/gold palette)
- [x] Responsive sidebar navigation
- [x] Screen-per-feature layout
- [x] No dead UI elements

### Phase 7 — Code Review
- [x] Security audit completed (CORS, rate limiting, token encryption)
- [x] No hardcoded secrets
- [x] Audit logging on all sensitive operations

### Phase 8 — Security Hardening ✅
- [x] Rate limiting — 5 login attempts/min per IP
- [x] CORS restricted to known origins
- [x] Security headers (CSP, X-Frame-Options, HSTS)
- [x] AES-256-GCM encryption for Telegram bot token
- [x] Input validation on all API routes
- [x] Body size limit (100KB)
- [x] Audit trail for all sensitive events

### Phase 9 — Integration
- [x] Telegram bot manager (Module A)
- [x] Credential/password manager (Module B)
- [x] Role/privilege manager (Module C)
- [x] Session notes — PRE/POST (Module D)
- [x] Regular visit tracker (Module E)

### Phase 10 — Testing
- [x] Functional testing: login, patient CRUD, sessions, permissions
- [x] Security testing: token storage, role enforcement
- [x] Browser testing: login flow, auth guard

### Phase 11 — Deployment
- [x] Electron build (snc-desktop/dist/win-unpacked/)
- [x] Portable exe ready for Windows
- [x] Inno Setup installer script ready

### Phase 12 — Post-Launch Monitoring & Improvement
- [ ] Monitor usage patterns
- [ ] Collect user feedback
- [ ] Identify bottlenecks
- [ ] Plan Phase 13 improvements

---

## ITERATION LOOP (Post-Launch)

Every change follows this strict sequence:

```
PLAN → BUILD → REVIEW → SECURE → TEST → DEPLOY → IMPROVE
  ↑_____________________________________________|
```

**PLAN** — Define scope, requirements, acceptance criteria. No implementation starts without a clear spec.
**BUILD** — Write code following existing patterns. Keep functions small and focused.
**REVIEW** — Self-audit before presenting. Check against security checklist.
**SECURE** — Run security scan. Never blind-accept AI output.
**TEST** — Write test cases. Verify all paths work, especially edge cases.
**DEPLOY** — Sandbox test first. Then human approve. Then ship.
**IMPROVE** — Analyze results, iterate, evolve product continuously.

---

## SECURITY CHECKLIST (Mandatory Before Any Deploy)

- [ ] No hardcoded secrets or tokens
- [ ] All API routes validate input
- [ ] Role-based access enforced server-side
- [ ] Audit log captures sensitive operations
- [ ] No debug flags in production
- [ ] CORS restricted
- [ ] Rate limiting active
- [ ] Sensitive data encrypted at rest

---

## PRODUCT EVOLUTION

### Current: MVP + ADD-1.00 Complete ✅

### Planned: Phase 13 Improvements
- [ ] Backup/restore feature (scheduled backup to file/ cloud)
- [ ] Full calendar month-grid view for regular visits
- [ ] WhatsApp bot manager (mirror of Telegram Module A)
- [ ] Patient history timeline view
- [ ] Bulk import patients from CSV
- [ ] Session PDF export with print layout
- [ ] Analytics dashboard (revenue trends, patient retention)
- [ ] SMS alert module (mirror of Telegram alerts)
- [ ] Multi-clinic support (branch management)

### Future: Phase 14
- [ ] Mobile companion app
- [ ] Offline-first PWAs
- [ ] Cloud sync / multi-device
- [ ] API for third-party integrations

---

## KEY RULES

- **NEVER** blind-accept AI output. Always review.
- **ALWAYS** run security + review before merge/deploy.
- **KEEP** human-in-the-loop at critical gates (write operations, security config).
- **DOCUMENT** every decision in AGENTS.md.
- **NEVER** skip phases. Iterations are not shortcuts.
- **REBUILD** project understanding after major context changes.
- **IMPROVE** product continuously post-launch. Shipping is not the end.

---

*Last updated: 2026-04-21*
*Framework: Phase 12 (Post-Launch Monitoring)*