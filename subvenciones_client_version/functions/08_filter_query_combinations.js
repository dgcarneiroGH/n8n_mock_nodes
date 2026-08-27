const fs = require("fs");

//#region Inputs
const queryCombinations = JSON.parse(
  fs.readFileSync("./results/builders/query_combinations.json"),
);
const notionCombinations = JSON.parse(
  fs.readFileSync("./results/getters/get_notion_combinations.json"),
);
//#endregion

try {
  //#region Node Logic
  const notionByPropertyId = new Map();
  for (const notionItem of notionCombinations) {
    if (!notionItem || notionItem.property_id == null) continue;
    const propertyId = String(notionItem.property_id);
    if (!notionByPropertyId.has(propertyId)) {
      notionByPropertyId.set(propertyId, notionItem);
    }
  }

  const notionPropertyIds = new Set(notionByPropertyId.keys());

  const result = queryCombinations.map((originalItem) => {
    const combinationKey = `${originalItem.benefactor_id}_${originalItem.region_id}_${originalItem.purpose_id}`;
    const existsInNotion = notionPropertyIds.has(combinationKey);
    const match = existsInNotion
      ? notionByPropertyId.get(combinationKey)
      : null;

    return {
      ...originalItem,
      existsInNotion,
      notionPageId: match ? match.id : null,
    };
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("./results/filters", { recursive: true });
  fs.writeFileSync(
    "./results/filters/filter_query_combinations.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} query combinations filtered`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
