const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const getGrantsData = JSON.parse(
  fs.readFileSync("../results/getters/get_grant_data.json"),
);
//#endregion

try {
  //#region Node Logic
  const descriptionFromAnuncios = (anuncios) =>
    (Array.isArray(anuncios) ? anuncios : [])
      .map((anuncio) => anuncio.texto ?? "")
      .join("\n")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n");

  const result = getGrantsData.map((grant) => ({
    code: grant.codigoBDNS,
    receptionDate: grant.fechaRecepcion,
    title: grant.descripcion,
    description: descriptionFromAnuncios(grant.anuncios),
    budget: grant.presupuestoTotal,
    startDate: grant.fechaInicioSolicitud,
    endDate: grant.fechaFinSolicitud,
    startDateText: grant.textInicio,
    endDateText: grant.textFin,
  }));
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/format_grant_data.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} grants formatted`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}