# N8N Mock Node Implementation Pattern

**Purpose**: Create new processing nodes in n8n workflows following the established pattern in `subvenciones_client_version/`. Each node is self-contained, testable locally with JSON files, and easily integrated into the orchestrated workflow.

**Context**: When you need to add a new data transformation, filter, or calculation step to an existing n8n pipeline.

---

## Workflow Steps

### 1. **Define Inputs (Before Coding)**

- Tell me which getter files you'll provide as inputs (e.g., `get_clients.json`, `get_regions.json`)
- These will be injected in lines 5-7 only
- Wait for confirmation that you've created these files before proceeding to implementation

### 2. **Plan the Node's Position**

- Determine where this node fits in the processing pipeline
- Identify which output folder/section it should use:
  - If filename contains "filter" → `results/filters/`
  - If filename contains "builder" → `results/builders/`
  - If filename contains other pattern → create corresponding section folder (e.g., "export" → `results/export/`)
- **Assign a sequential number**: Use the next available number (e.g., if latest is 14, use 15), or insert between existing numbers if it's a dependency fix

### 3. **Examine Related Nodes**

- Review 1-2 similar nodes to match code structure and patterns
- Note how inputs are read (lines 5-7)
- Understand output format and destination
- Check `run_all.js` to understand execution order
- Reuse variable/property names exactly as they appear in reference files (no extra aliases/fallback names)
- If any expected variable/property name is missing or unclear, ask before implementing

### 4. **Create the File Structure**

Create `<NUMBER>_<descriptive_name>.js` with this exact structure:

```javascript
const fs = require("fs");

let inputVar1Raw, inputVar2Raw;
try {
  inputVar1Raw = JSON.parse(
    fs.readFileSync("./results/getters/get_input1.json", "utf8"),
  );
  inputVar2Raw = JSON.parse(
    fs.readFileSync("./results/getters/get_input2.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
const inputVar1 = inputVar1Raw;
const inputVar2 = inputVar2Raw;

//#region Node Logic

// Core processing functions here
function processLogic(input) {
  // transformation logic
  return output;
}

const result = inputVar1.map((item) => processLogic(item));

//#endregion

// Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_output_name.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo se ha creado o actualizado correctamente.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
```

**Rules for input injection (lines 5-7)**:

- Only add the exact inputs you specify
- Name follows pattern: `<variableName>Raw` for the file read
- Always include try/catch for file I/O (lines 8-11 stay the same)
- Comments on lines 13-14 always stay unchanged

### 5. **Implement Node Logic**

- Write all transformation code inside `//#region Node Logic` section only
- Keep code as simple as possible (sandbox approach)
- No file I/O, API calls, or external dependencies inside this region
- Extract utility functions before the main map/reduce operation
- Use clear variable names and minimal comments
- Use only the variable/property names defined in the agreed input schema
- Avoid defensive alias chains (e.g. `a || b || c`) unless explicitly requested
- If a field name does not exist in source files, stop and ask for the exact name
- Optimize for performance and low resource usage without losing readability:
  - Prefer `Map`/`Set` for lookups (O(1)) instead of nested `.find()`/`.includes()` inside loops
  - Build lookup indexes once, then reuse them in `map`/`filter` passes
  - Avoid repeated heavy string operations inside hot loops when keys can be precomputed

### 6. **Test Locally**

- Run `node <number>_<name>.js` to verify output
- Check that output file is created in the correct `results/` subfolder
- Validate JSON format: `node -e "console.log(JSON.parse(require('fs').readFileSync('./results/filters/output.json')))"`

### 7. **Verify Integration**

- Confirm node runs without errors: `node <number>_<name>.js`
- Ensure output format matches what next node in pipeline expects
- If inserting between existing nodes, check numeric collision with other files
- Run `node run_all.js` to test full pipeline (auto-sorts by number prefix)

### 8. **Ready for n8N Migration**

- Code is clean sandbox with clear boundary at `//#region Node Logic`
- Only change needed when moving to n8N:
  - Line 5-7: Replace with `$input.all().map(item => item.json)`
  - Final return: Replace `fs.writeFileSync` with `return result` or `$output.push(result)`

---

## Quality Checklist

Before running a node:

- [ ] Inputs defined and getter files created by you
- [ ] File named `<NUMBER>_<descriptive_name>.js` with correct numeric prefix
- [ ] Output folder defined: filters/, builders/, or other section in results/
- [ ] Lines 5-7: Only specified inputs injected as `<nameRaw>` variables
- [ ] Lines 8-11: Standard try/catch block (unchanged)
- [ ] Lines 13-14: Standard comments (unchanged)
- [ ] Node Logic section clearly marked with `//#region` and `//#endregion`
- [ ] Code inside Node Logic is as simple as possible
- [ ] Variable/property names match reference files exactly (no implicit aliases)
- [ ] No `||` alias fallbacks were added unless explicitly requested
- [ ] Test run succeeds: `node <number>_<name>.js` exits with code 0
- [ ] Output JSON created in correct `results/` subfolder
- [ ] Output format matches next node's expected input

---

## Example: Adding a New Filter Node

**Scenario**: Need to filter grants by budget threshold (new node after `03_filter_grants.js`)

**Your instructions to me**:

> "Create a node that filters grants. Use inputs: `get_grants_filtered.json` and `get_budget_config.json`"

**My workflow**:

1. **Wait for getter files**: Confirm you've created `results/getters/get_grants_filtered.json` and `results/getters/get_budget_config.json`
2. **Choose output folder**: File name will be `04_filter_grants_by_budget.js` → output goes to `results/filters/`
3. **Create file**: Add to line 5-7:
   ```javascript
   grantsRaw = JSON.parse(
     fs.readFileSync("./results/getters/get_grants_filtered.json", "utf8"),
   );
   budgetConfigRaw = JSON.parse(
     fs.readFileSync("./results/getters/get_budget_config.json", "utf8"),
   );
   ```
4. **Implement logic**: Inside `//#region Node Logic`, write simple filter function
5. **Test**: `node 04_filter_grants_by_budget.js` → creates `results/filters/filter_grants_by_budget.json`
6. **Ready**: Code ready for n8N with minimal changes

---

## Key Principles

1. **Sandbox First**: Code must run locally with `node <file>.js` before any n8N consideration
2. **Lines 5-7 Only**: Only inputs you explicitly request get injected
3. **Simple is Better**: Prioritize readability over complexity; this is a test harness
4. **Clear Boundaries**: Everything between `//#region Node Logic` and `//#endregion` is portable
5. **Minimal Setup**: Try/catch and file I/O patterns never change (lines 8-11, 40+)
6. **Folder Organization**: Output folder determined by filename pattern (filter → filters/, builder → builders/, etc.)
7. **Performance by Default**: Node logic should be fast and resource-efficient (prefer indexed lookups with `Map`/`Set`) while staying easy to read.
8. **Schema Fidelity First**: Use the exact variable/property names from source reference files; if any name is missing, ask before coding.

---

## Common Patterns

### Simple Mapping and Filtering

```javascript
//#region Node Logic

const result = data
  .map((item) => ({
    ...item,
    processed: item.value * 2,
  }))
  .filter((item) => item.processed > threshold);

//#endregion
```

### Recursive Tree Traversal

```javascript
//#region Node Logic

function findInTree(tree, criterion) {
  for (const node of tree) {
    if (criterion(node)) return node;
    if (node.children) {
      const found = findInTree(node.children, criterion);
      if (found) return found;
    }
  }
  return null;
}

const result = data.map((item) => findInTree(tree, (n) => n.id === item.id));

//#endregion
```

### Multi-Source Alignment

```javascript
//#region Node Logic

if (data1.length !== data2.length) {
  throw new Error(`Parity error: ${data1.length} vs ${data2.length}`);
}

const result = data1.map((item, idx) => ({
  ...item,
  related: data2[idx],
}));

//#endregion
```

---

## n8N Migration

When you decide to move this node to actual n8N, **only these lines change**:

**Before (Node.js)**:

```javascript
const inputVar1 = inputVar1Raw; // Line 13
// ... rest of file ...
fs.writeFileSync(
  "./results/filters/output.json",
  JSON.stringify(result, null, 2),
  "utf8",
); // Line 40+
```

**After (n8N)**:

```javascript
const inputVar1 = $input.all().map((item) => item.json); // Line 13
// ... rest of file stays identical ...
return result; // Replace fs.writeFileSync
```

Everything inside `//#region Node Logic` remains untouched.
