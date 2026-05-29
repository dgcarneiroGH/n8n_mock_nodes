const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const getGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_subvenciones.json"),
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
  const pages = Array.isArray(getGrants) ? getGrants : [getGrants];
  const grantsItems = pages.flatMap((page) =>
    Array.isArray(page.content) ? page.content : [],
  );

  const beneficiarioId = notionCombination?.property_id_beneficiario ?? null;
  const regionId = notionCombination?.property_id_regi_n ?? null;
  const finalidadId = notionCombination?.property_id_finalidad ?? null;

  const result = grantsItems.map((item) => {
    const grantId = String(item.numeroConvocatoria ?? item.id ?? "");

    const match = notionGrants.find((notionItem) => {
      const notionGrantId = String(
        notionItem.property_id ??
          notionItem.property_grantId ??
          notionItem.grantId ??
          notionItem.numeroConvocatoria ??
          "",
      );
      return notionGrantId === grantId;
    });

    return {
      id: grantId,
      titulo: item.descripcion ?? "",
      descripcion: item.descripcionLeng ?? item.descripcion ?? "",
      beneficiario_id: beneficiarioId,
      region_id: regionId,
      finalidad_id: finalidadId,
      status: "active",
      tags: [],
      tag_seo: null,
      needs_review: false,
      last_tagged_at: null,
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
