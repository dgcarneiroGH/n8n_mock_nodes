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
  const notionById = new Map(
    notionPurposes.map((item) => [item.property_id, item]),
  );

  const result = purposesFormatted.map((item) => {
    const match = notionById.get(item.id);
    return {
      ...item,
      existsInNotion: Boolean(match),
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
