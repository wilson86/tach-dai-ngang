# KTS Tách Ngang — grouped checkbox scroll regression (2026-10-16)

- Base `main`: `909d4c6c29a1c0e1adea07a43e81ee6056ca09c7`.
- **Qualified-code candidate** (before this docs commit): `f9ec1911334f3682a5d5e221cf836df70be1efd2`.
- Branch: `fix/chat-envelope-checkbox-no-scroll-20261016`.
- Companion Mobile/Unified code SHA: `edb760d5cebb54a9bf69797d0049dbe87f2682a7`.
- Full cross-surface checkpoint: `wilson86/tach-dai-mobile/docs/CHAT_ENVELOPE_CHECKBOX_SCROLL_CHECKPOINT_20261016.md`.
- Root cause: grouped checkbox selection (individual row/group and bulk select) rebuilt entire DOM, destroying focused checkbox and browser scroll anchor. Selection-only synchronization now updates state without replacing the result list.
- The root Tách Ngang chat envelope parser already strips timestamp and sender at Run. New test validates the exact user copy/paste with `[10/16/2026 5:36 PM] Hiền:` and multiline continuation, with Undo restoring the original.
- 2 files changed: `index.html`, `tests/grouped-checkbox-results.js`. Business/amount allocation, generated engine and station calendar untouched.
- **GitHub-file V8 syntax PASS** and isolated fake DOM smoke PASS: 2 groups, 3 wager result rows; single checkbox selection 0 DOM replacements, original group/checkbox node stable, selected count updates correctly; raw source unchanged during selection.
- Actual Node suites: NOT_RUN. Browser/on-device visual: NOT_RUN. Router/backend/Desktop: UNMODIFIED_BY_DESIGN but no parity claim. PWA versions/SW cache keys unchanged; no deployment, no production, no Telegram.
- `COST_USD=0`, `GITHUB_CI=NOT_RUN`, `MERGE=NO`, `DEPLOY=NO`, `RELEASE_READY=FALSE`.
- Next: run targeted `node tests/grouped-checkbox-results.js` plus impacted regression with C:-only checkout at matching code SHA; then explicit human approval for versioned SW/PWA release and mobile scroll QA. Do not merge automatically.
