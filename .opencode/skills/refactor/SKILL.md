---
name: refactor
description: Use when the user sends the "refactor" command in the n8n_mock_nodes project. Applies to scripts under functions_v1/ and functions_v2/ that contain a //#region Node Logic block.
---

# Refactor Node Logic

When the user types `refactor`, refactor the `//#region Node Logic` block of the current script.

## Scope

Edit **only** the code between `//#region Node Logic` and `//#endregion`. Do not touch:

- The Inputs region (`//#region Inputs` ... `//#endregion`)
- File I/O at the end (`fs.mkdirSync`, `fs.writeFileSync`, `console.log`)
- The `try` / `catch` wrapper
- Comments outside the region

## Rules

1. **English only** — all identifiers (variables, functions, parameters) and any inline comments inside the region must be in English. Spanish is allowed in the keyword dictionary (loaded from JSON at runtime, not hardcoded).
2. **Simplify** — remove dead code, inline one-liner helpers, drop redundant aliases, collapse nested logic into a single clear expression.
3. **Preserve semantics** — do not change priority order (e.g. title-before-description) or the matching strategy.
4. **No new features** — pure refactor, no behavior change.

## Process

1. Read the current Node Logic region.
2. List Spanish or mixed-language identifiers and choose English replacements.
3. Identify simplifications (inlining, dedup, removing aliases).
4. Apply changes inside the region only.
5. Run the script from its own directory to confirm the output is unchanged.

## Out of scope

- Refactoring outside the region.
- Editing `../results/getters/get_seo_tags.json` or any other data file.
- Adding features, changing thresholds, or "while I'm here" cleanups.
