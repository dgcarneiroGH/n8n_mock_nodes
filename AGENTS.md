# n8n Mock Nodes

Local sandbox for n8n Code node logic. Plain Node.js (no package.json, only `fs`).

## Structure

```
subvenciones_client_version/
  functions_v1/   – 22 scripts (legacy pipeline)
  functions_v2/   – 12 scripts (newer pipeline)
  results/
    getters/      – input mock JSON (16 files)
    filters/      – filter-node outputs
    builders/     – builder-node outputs
  templates/      – HTML email templates
  brainstorming/  – planning docs (not code)
```

## Running

- Run a single script from its own directory:
  - `node 02_filter_regions.js` (from `functions_v1/`)
  - `node 01_format_benefactors.js` (from `functions_v2/`)
- `run_all.js` executes v1 scripts only (it scans its own `__dirname`)
- No equivalent runner for v2 — run scripts individually

## Path differences

- **v1**: uses `./results/getters/...` when executed from `functions_v1/`
- **v2**: uses `../results/getters/...` when executed from `functions_v2/`

## Creating a new node (v2 pattern)

Follow `SKILL.md` — the authoritative pattern reference. Key rules:

- File: `<NUMBER>_<descriptive_name>.js` (sequential, no gaps)
- Output folder: filter in name → `results/filters/`, builder → `results/builders/`
- Mark logic with `//#region Node Logic` / `//#endregion`
- Never put file I/O or API calls inside the region
- Use exact variable/property names from source JSONs (no alias fallbacks)
- Prefer `Map`/`Set` for lookups over nested loops

## `.agent.md` constraints

Preserve its keyword-triggered rules:
- "refactor" — only edit inside `//#region Node Logic`
- "copy template" — inline HTML in template literal, no `fs.readFileSync` in Node Logic
- Always return `[{ json: { ... } }]` structure for n8n compatibility
