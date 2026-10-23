# KTS MB Telegram leading-dot candidate — 2026-10-17

## Authority and reproduction (operator screenshot)
- Ngang public repo baseline `main` `4be5e0924c65e5128b415e11cc428c7b4513be6a` (version 1.0.27 released).
- Branch `fix/mb-leading-dot-chat-envelope-20261017`; original screenshot reproduces on Unified/Đá Vòng Mobile 2.0.31 + Unified 1.0.19.
- Exact screenshot text:
  ```text
  [10/16/2026 5:37 PM] Thiên: . 32. B20n
  [10/16/2026 5:42 PM] Thiên: 52.79.b50n.da10n
  ```
- Already-deployed chat stripper removes timestamps/names correctly, but leaves first line `. 32 b20n`; MB check-only rejects it with `MB không cần ghi đài; cú pháp phải bắt đầu bằng số`. Second line `52 79 b50n da10n` separately validated PASS.
- Experimental comparison using published Mobile engine SHA `046935677f9d88468b71246410444c27435c72e1415aeb359c799452584c36eb` yielded `cleaned_text=". 32 b20n\n52 79 b50n da10n"`; first FAIL, second PASS; entire Đá Vòng output correctly empty/fail-closed.

## Isolated Ngang candidate — not approved semantic change
- `index.html` gets exactly **one guarded normalization** rule for a *single solitary dot* followed by whitespace and a valid-shaped whole number at the **start of a normalized betting line**. No guessing previous station/date, no stripping `..` or unknown punctuation, no money math change.
- `tests/mb-leading-dot-chat-envelope.js`: exact source fixture, 2 physical lines, positive and negative MB cases, MN-station-missing rejection, protected decimal and unchanged money tokens.
- In GitHub-code in-process V8 with real unchanged engine: sanitized candidate yields `32 b20n\n52 79 b50n da10n`; two lines validate PASS, actual processLine outputs identical to cleaned text, five malformed-neighbor inputs all reject; **DIRECT_JS_SMOKE=PASS**. Full Node script `node tests/mb-leading-dot-chat-envelope.js`, existing regression/ledger/Undo/cut and mobile parity **NOT_RUN**.
- **NEW FORMAT REVIEW_STATUS=NEEDS_ORACLE**, not business-owner approved. Corpus in private KTS `fix/full-stack-ingress-20261014` derivative `test/mb-leading-dot-provenance-review-20261017` records P016 positive candidate and N041 double-dot negative. Do NOT treat NEEDS_ORACLE as accepted real money routing.

## Cross-surface matrix
- Standalone Ngang: `CHANGED_CANDIDATE`, read-only direct JS smoke PASS, Node QA pending.
- Standalone Mobile: `BLOCKED` for GitHub feature branch creation; baseline published `main` `c0f90851b18d6e99c14256c30d427aa94ce61880` still original bug. No Mobile code mutation.
- Unified/Đá Vòng: consumes Mobile iframe engine, `BLOCKED` until Mobile candidate independently patched/tested; baseline correctly fails whole ticket without partial results.
- Router/Message Bridge/Desktop/backend/LEDGER/ACK: `UNMODIFIED` and `PARITY=NOT_PROVEN`; KTS corpus candidate status NEEDS_ORACLE.
- Generated business engine and station calendar: UNCHANGED; shared SHA `046935677f9d88468b71246410444c27435c72e1415aeb359c799452584c36eb`.
- Service workers, current app versions, public Pages: UNCHANGED; no production or phone update.

## Boundaries and next evidence
1. Ask human whether **the single initial dot in `. 32. B20n` is a separator, and intended first bet is exactly `32 b20n`**. Not authorize dropping multi-dot or malformed wager fragments without separate rule.
2. Authorized C:-only Codex baseline: prepare Mobile source candidate from verified HEAD without interacting with production, apply same single-dot rule plus provenance and regression. Verify full cross-surface parser, Router/bridge Desktop and MB money matching; no live sends.
3. Then perform targeted Node scripts on exact SHA; cross-surface money/physical source-line/ACK suppression validation; separately approve version bumps + deployment; Android smoke after.

`COST_USD=0`, `PRODUCTION_MUTATION=NONE`, `PAGES_DEPLOY=NO`, `MERGE=NO`, `E_ACCESS=NONE`, `F_ACCESS=NONE`, `RELEASE_READINESS=BLOCKED_PENDING_ORACLE_AND_PARITY`.
