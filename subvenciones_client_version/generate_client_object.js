const fs = require("fs");

let clientsRaw, benefactorsRaw, regionsRaw;
try {
  clientsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_clients.json", "utf8"),
  );
  benefactorsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_benefactors.json", "utf8"),
  );
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_regions.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const filterRegions = regionsRaw;
const getClients = clientsRaw;
const filterBenefactors = benefactorsRaw;

//#region Node Logic

//#endregion
const processedClients = getClients.map((client) => {
  const regionEntry = filterRegions.find(
    (r) => r.status === "OK" && r.clientId === client.id,
  );
  const benefactorEntry = filterBenefactors.find(
    (b) => b.status === "OK" && b.client_id === client.id,
  );
  return {
    id: client.id,
    name: client.name,
    regions_ids: regionEntry ? regionEntry.regions_ids : "",
    benefactors_ids: benefactorEntry ? benefactorEntry.benefactors_ids : "",
  };
});

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/generate_client_object.json",
    JSON.stringify(processedClients, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
