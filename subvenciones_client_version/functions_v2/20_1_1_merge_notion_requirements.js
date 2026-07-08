const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const formatGrantDataRaw = JSON.parse(
  fs.readFileSync("../results/builders/format_grant_data.json"),
);
const notionGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);
//#endregion

try {
  //#region Node Logic
  const notionGrantsByCode = new Map(
    notionGrants.map((item) => [item.property_c_digo, item])
  );

  function mergeTextData(item) {
    const merged = { ...item, description_already_in_notion: false };
    const notionGrant = notionGrantsByCode.get(item.code);
    if (!notionGrant) return merged;

    if (notionGrant.property_descripci_n) {
      merged.description = notionGrant.property_descripci_n;
      merged.description_already_in_notion = true;
    }
    if (notionGrant.property_requisitos) {
      merged.requirements = notionGrant.property_requisitos;
    }
    return merged;
  }

  const result = Array.isArray(formatGrantDataRaw)
    ? formatGrantDataRaw.map(mergeTextData)
    : mergeTextData(formatGrantDataRaw);
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/merge_notion_requirements.json",
    JSON.stringify(result, null, 2),
  );
  const resultCount = Array.isArray(result) ? result.length : 1;
  console.log(`✅ ${resultCount} grant(s) merged with Notion Requirements`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
