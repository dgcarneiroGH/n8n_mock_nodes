const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const notionGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);
//#endregion

try {
  //#region Node Logic
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const result = notionGrants
    .filter((grant) => {
      const endDate = grant.property_fecha_de_fin_de_convocatoria?.start;
      return Boolean(endDate) && endDate.slice(0, 10) < today;
    })
    .map((grant) => grant.id);
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/filters", { recursive: true });
  fs.writeFileSync(
    "../results/filters/filter_deprecated_grants.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} deprecated grant ids`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}