# KTS Ngang versioned release staging — 2026-10-16

## Source authority, no deploy
- Public `wilson86/tach-dai-ngang`, tested bug-fix PR #2 code SHA `c4a0c1a275b128f3a7629e7166a45d913c86702d` (DRAFT, unmerged), original main base `909d4c6c29a1c0e1adea07a43e81ee6056ca09c7`.
- This staging branch `release-review/chat-envelope-checkbox-20261016` starts from tested PR #2 HEAD and does NOT touch main; pre-checkpoint versioned code+test SHA `c22e7ba385ad3fa77b556fbb8ab48d78c38848b7`.
- Mobile / Unified companion tested bug-fix PR #10 `5fc9e388d3c96063b1ef40790b9a57a05676217a`, staged review candidate in separate repo. Both must be reviewed and released coherently, not auto merged.
- Operator-reported offline QA previous fixed branches: **15 Node scripts PASS / 0 FAIL**, 3 Unified-only suites skipped here because Ngang has no Unified surface. Report named `CHECKPOINT_UI_FIX_FINAL_OFFLINE_QA_20261016.md`, partial SHA256 `0C2E88A0…0D7A7B71`, unverified full artifact.

## Release-only change, no money rule changes
- `1.0.26` -> **`1.0.27`** in `index.html` label and `APP_VERSION`, `version.json`, `sw.js` unique cache `tach-dai-ngang-v1.0.27-chat-scroll-focus` and offline fallback.
- Added `tests/release-review-asset-consistency.js` (static release metadata/offline engine precache identity check).
- Shared business engine SHA `046935677f9d88468b71246410444c27435c72e1415aeb359c799452584c36eb` verified unchanged. Generated engine/calendar, Ngang money allocation, Copy/Cut/Undo and all functional UI handlers match the previously tested PR #2 code SHA; staging touches version metadata/cache only. Manifest `start_url` and `scope` unchanged.

## Stage QA, do not overclaim
- GitHub-file V8 **SYNTAX PASS** on SW and release test.
- Independent GitHub-file static asset checks **7/7 PASS**: version, cache name, APP_VERSION, fallback JSON, engine hash, manifest scope, no obsolete label.
- Real Node execution on this versioned staging SHA: **NOT_RUN**. Need C:-isolated `node tests/release-review-asset-consistency.js` plus impacted `node tests/grouped-checkbox-results.js` and offline/asset tests as appropriate, but avoid repeating old unchanged tests by default.
- GitHub CI **NOT_RUN**, Android scroll/manual smoke **NOT_RUN**; page PUBLISHED unchanged; merge, deploy and production mutation **NONE**.
- `COST_USD=0`; E/F=0; no Telegram actual sends or data cleanup.

## Controlled release / rollback requirements
- Explicit operator approval required before any main merge/Pages deploy, independent of offline QA.
- Android Chrome and desktop browser acceptance after approved release: checkbox tick remains in viewport; scrolling neither resets on individual nor group checkbox; Copy/Cut/Undo, repeated reruns and reload do not recreate cut wagers or modify Ngang integer split; original chat timestamp and sender removed on Run with continuation preserved.
- Preserve exact original release SHA and SW cache key. If rollback is required, use **new unique cache epoch**; never purge customer's original source, user local ledgers, or browser site data without approval.
- `RELEASE_READINESS=READY_FOR_VERSION_STAGE_QA_ONLY`, not installed/phone ready.

Mobile counterpart checkpoint: `wilson86/tach-dai-mobile/docs/KTS_VERSIONED_RELEASE_REVIEW_20261016.md`; `CONTEXT_RISK=ELEVATED`.
