# Ngang 1.0.28 — final review-only candidate checkpoint (2026-10-17)

- User authorized preparation ONLY. No merge/Pages deploy, real customer sends, SQLite/E:/F: writes, or paid CI.
- True public main is `4be5e0924c65e5128b415e11cc428c7b4513be6a` (Ngang 1.0.27). Qualified feature base `e02ba7635a289712979defab509c7a33df70e6f2`. This staged candidate code/test HEAD before checkpoint `44cc65dc0dc20bdda9a7e63ba1f1fd8e8c3ee1e2`.
- Version `1.0.28` in `index.html`, `version.json`, `sw.js`, unique PWA cache `tach-dai-ngang-v1.0.28-mb-raw-prefix-safe`. Release asset test updated.
- New mandatory standalone UI **raw-line fail-closed** detector runs before the PWA `preprocessChatText` can discard `| 52`, `|52`, `||52`, `|.52` or `.. 52`. Returns correct physical line and empties result list; keeps the operator-approved single leading dot, normal MB wager amounts and standalone dividers.
- `tests/mb-leading-dot-chat-envelope.js` now includes 6 raw-prefix malformed cases and the two positive preservation fixtures; test Git blob matches Mobile companion.
- Static direct engine V8 check at staged source SHA **PASS** for all 6 rejected fixtures, approved single dot, valid divider and exact 20n/50n/10n. **Native Node/UI/browser QA NOT_RUN** at this changed source SHA.
- Business engine/calendar unchanged. Engine SHA `046935677f9d88468b71246410444c27435c72e1415aeb359c799452584c36eb`.
- Companion Mobile `2.0.32` and Unified `1.0.20` staging is Draft PR #13; actual release-root Router integration is private KTS Draft PR #13, based on Router release SHA `fc730fdd84b5ab0f06829d74ec12be9823dd9f13`. The old KTS private branch had divergent history and cannot be merged whole.
- Required C:-only QA: Node `tests/mb-leading-dot-chat-envelope.js` + `tests/release-review-asset-consistency.js`, actual Router bridge atomic test, approved corpus 44 for this **new Ngang HTML**, Desktop pytest on composite Router release branch. No live Telegram.
- Published production and its local browser ledger remain unchanged. Preserve current published main SHA for rollback; any eventual rollback must use new cache epoch and preserve localStorage.
- `COST_USD=0`, `GITHUB_CI=NOT_RUN`, `MERGE=NO`, `DEPLOY=NO`, `RELEASE_READY=FALSE`, `NEXT_SAFE_ACTION=SHA_BOUND_C_ONLY_QA`.
