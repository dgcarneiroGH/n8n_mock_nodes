const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const getGrantsData = JSON.parse(
  fs.readFileSync("../results/getters/get_grant_data.json"),
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
  const result = getGrantsData.map((grant) => {
    const grantCode = grant.codigoBDNS;
    const description = (grant.anuncios ?? [])
      .map((anuncio) => anuncio.texto ?? "")
      .join("\n")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n");

    const match = notionGrants.find(
      (notionItem) => notionItem.property_c_digo === grantCode,
    );

    return {
      code: grantCode,
      title: grant.descripcion,
      description,
      benefactor_id: notionCombination.property_id_beneficiario,
      region_id: notionCombination.property_id_regi_n,
      purpose_id: notionCombination.property_id_finalidad,
      receivedDate: grant.fechaRecepcion,
      organization: grant.nivel3 ?? grant.nivel2,
      urlHtml: `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatoria/${grantCode}`,
      urlApi: `https://www.pap.hacienda.gob.es/bdnstrans/api/convocatorias?numConv=${grantCode}&vpd=GE`,
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
