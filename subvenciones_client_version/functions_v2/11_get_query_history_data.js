const fs = require("fs");

// Minimum grants required to mark a combo as active.
// Change this constant to tune Phase 2 entry criteria.
const MIN_RESULTS_FOR_ACTIVE = 10;

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const getGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_subvenciones.json"),
);
const notionCombination = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_combinations.json"),
)[0];
//#endregion

try {
  //#region Node Logic
  const countResults = getGrants[0].totalElements;
  const status =
    countResults === 0
      ? "no_results"
      : countResults < MIN_RESULTS_FOR_ACTIVE
        ? "low_volume"
        : "active";

  const apiUrlCalled = `https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda?pageSize=50&order=fechaRecepcion&direccion=desc&descripcionTipoBusqueda=0&&regiones=${notionCombination.property_id_regi_n}&tiposBeneficiario=${notionCombination.property_id_beneficiario}&finalidad=${notionCombination.property_id_finalidad}`;

  const result = {
    last_checked_at: new Date().toISOString(),
    count_results: countResults,
    status,
    api_url_called: apiUrlCalled,
    query_history_id: notionCombination.id,
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/grants_formatted.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${countResults} grants formateadas`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
