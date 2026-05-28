const fs = require("fs");

//#region Inputs
const purposesFormatted = JSON.parse(
  fs.readFileSync("./results/builders/purposes_formatted.json"),
);
const notionPurposes = JSON.parse(
  fs.readFileSync("./results/getters/get_notion_purposes.json"),
);
//#endregion

try {
  //#region Node Logic
  const result = purposesFormatted.map((originalItem) => {
    const match = notionPurposes.find(
      (notionItem) => notionItem.property_id === originalItem.id,
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
    "./results/filters/filter_purposes.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} purposes filtered`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
