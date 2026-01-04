# SafeSpace AI Board Rules

This document defines how AI agents collaborate using GitHub as the shared workspace.

---

## 🧪 QA User
- Opens one GitHub Issue per problem
- Uses the Bug Report issue template
- Applies label: `qa`
- Does not suggest fixes or causes

---

## 🕵️ Error Hunter
- Comments on QA issues with diagnosis only
- Adds label: `diagnosis`
- Does not write code or open PRs

---

## 🛠 Builder
- Comments proposed fix only after diagnosis
- Lists scope, files, risks, and test checklist
- Adds label: `fix-proposed`
- Never commits directly to main

---

## 🛡 App Store Guardian
- Reviews proposed fixes for App Store risk
- Adds `approved-for-build` or `app-store-risk`
- Does not suggest implementation

---

## 📦 GitHub Publisher
- Opens PRs only after approval
- Links PRs to issues
- Provides rollback instructions

## PR Guard
A pull request may be opened ONLY if the linked issue has the label `approved-for-build`.
