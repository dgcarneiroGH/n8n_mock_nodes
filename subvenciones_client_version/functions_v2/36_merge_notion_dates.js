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
    notionGrants.map((item) => [item.property_c_digo, item]),
  );

  function mergeDates(item) {
    const notionGrant = notionGrantsByCode.get(item.code);
    if (!notionGrant) return item;

    const merged = { ...item };

    if (notionGrant.property_fecha_de_recepci_n?.start) {
      merged.receptionDate = notionGrant.property_fecha_de_recepci_n.start;
    }
    if (notionGrant.property_fecha_de_inicio_de_convocatoria?.start) {
      merged.startDate = notionGrant.property_fecha_de_inicio_de_convocatoria.start;
    }
    if (notionGrant.property_fecha_de_fin_de_convocatoria?.start) {
      merged.endDate = notionGrant.property_fecha_de_fin_de_convocatoria.start;
    }

    return merged;
  }

  const result = Array.isArray(formatGrantDataRaw)
    ? formatGrantDataRaw.map(mergeDates)
    : mergeDates(formatGrantDataRaw);
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/merge_notion_dates.json",
    JSON.stringify(result, null, 2),
  );
  const resultCount = Array.isArray(result) ? result.length : 1;
  console.log(`✅ ${resultCount} grant(s) merged with Notion dates`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
