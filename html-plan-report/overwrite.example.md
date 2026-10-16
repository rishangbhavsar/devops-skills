# Overrides for html-plan-report

To change how this skill works, copy this file to `overwrite.md` in the same folder and write your instructions there. Claude reads `overwrite.md` before every plan. Anything it says replaces the matching default; anything it leaves out keeps the default. A request in the conversation still wins over this file.

Write plain sentences. The examples below are commented out, so this file changes nothing until you copy and edit it. Keep a copy of your `overwrite.md` before reinstalling the skill, in case the install replaces the whole folder.

<!--
## Where plans go
Default: `.plan/` at the repository root, `<task-in-kebab-case>.plan.html`, plus a generated `.plan/index.html`.
- Save plans in `docs/plans/` instead of `.plan/`.
- Name files `YYYY-MM-DD-<task>.plan.html`.
- Title the index "Forge plans".
- Don't keep an index.html, and leave out the "← All plans" link.

## Diagrams
- Never use flowing arrows; keep every diagram static.
- Bundle every new plan with `bundle_plan.py` too (we email plans to clients).

## Templates and sections
- Always use the full template, even for bug fixes.
- Every plan needs a Rollout and rollback section.
- Any change under `src/auth/` gets a risk row for a security review.

## Links, opening and sharing
- File links use `cursor://file/` (we use Cursor).
- Don't open the plan in a browser; print the path instead (we work over SSH).
- Don't commit plans: add `.plan/` to `.gitignore`.

## Team conventions
- The requester is always "Platform team".
- Write plans in British English.
-->
