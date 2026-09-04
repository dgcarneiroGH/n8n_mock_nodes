const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const getGrantsData = JSON.parse(
  fs.readFileSync("../results/builders/format_grant_data.json"),
);
const calculatedDates = JSON.parse(
  fs.readFileSync("../results/merge_dates_data.json"),
);
const notionGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);
const notionCombination = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_combinations.json"),
)[0];
//#endregion

try {
  //#region Node Logic
  const today = new Date().toISOString().split("T")[0];

  const calculatedDatesByCode = new Map(
    calculatedDates.map((item) => [item.code, item]),
  );
  const notionGrantsByCode = new Map(
    notionGrants.map((item) => [item.property_c_digo, item]),
  );

  const result = getGrantsData.map((grant) => {
    const grantCode = grant.code;
    const calculated = calculatedDatesByCode.get(grantCode);
    if (!calculated) {
      throw new Error(`No calculated dates found for grant code: ${grantCode}`);
    }
    const match = notionGrantsByCode.get(grantCode);

    const endDate = calculated.calculated_end_date;
    const status = endDate && endDate < today ? "deprecated" : "active";

    return {
      code: grantCode,
      agency: grant.agency,
      title: grant.title,
      description: grant.description,
      publication_date: calculated.publication_date,
      calculated_start_date: calculated.calculated_start_date,
      calculated_end_date: calculated.calculated_end_date,
      _route: calculated._route,
      receivedDate: grant.receptionDate,
      status,
      benefactor_id: notionCombination.property_id_beneficiario,
      region_id: notionCombination.property_id_regi_n,
      budget: grant.budget,
      urlHtml: `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatoria/${grantCode}`,
      existsInNotion: !!match,
      notionPageId: match ? match.id : null,
    };
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/filters", { recursive: true });
  fs.writeFileSync(
    "../results/filters/filter_format_grants.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} grants formatted and filtered`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}