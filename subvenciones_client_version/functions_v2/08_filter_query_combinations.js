const fs = require("fs");

//#region Inputs
const queryCombinations = JSON.parse(fs.readFileSync("./results/builders/query_combinations.json"));
const notionCombinations = JSON.parse(fs.readFileSync("./results/getters/get_notion_combinations.json"));
//#endregion

try {
  //#region Node Logic
  const result = queryCombinations.map((originalItem) => {
    const match = notionCombinations.find(
      (notionItem) =>
        notionItem.property_id ===
        `${originalItem.benefactor_id}-${originalItem.region_id}-${originalItem.purpose_id}`,
    );
    return {
      ...originalItem,
      existsInNotion: !!match,
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
