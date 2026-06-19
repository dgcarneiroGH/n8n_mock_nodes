const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const notionCombinations = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_combinations.json"),
);
//#endregion

try {
  //#region Node Logic
  const seenCodes = new Set();
  let duplicatesFound = 0;

  for (const combination of notionCombinations) {
    const activeCodes = combination.property_c_digos_activos;
    if (typeof activeCodes !== "string" || activeCodes === "") {
      continue;
    }

    for (const code of activeCodes.split("-")) {
      const trimmed = code.trim();
      if (trimmed === "") continue;

      if (seenCodes.has(trimmed)) {
        duplicatesFound += 1;
      } else {
        seenCodes.add(trimmed);
      }
    }
  }

  const result = [...seenCodes];
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/getters", { recursive: true });
  fs.writeFileSync(
    "../results/getters/get_grants_codes.json",
    JSON.stringify(result, null, 2),
  );
  if (duplicatesFound > 0) {
    console.log(`⚠️ ${duplicatesFound} duplicate code(s) skipped`);
  }
  console.log(`✅ ${result.length} unique grant codes collected`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
