const fs = require("fs");

let filterGrantsDataRaw;
try {
  filterGrantsDataRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_grants_data.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const items = filterGrantsDataRaw;

//#region Node Logic
const clients = items.flatMap((item) => {
  return Array.isArray(item) ? item : [item];
});

const flatGrants = clients
  .flatMap((client) => (Array.isArray(client?.grants) ? client.grants : []))
  .map((grant) => ({
    code: grant.code,
    receptionDate: grant?.dates?.receptionDate,
    applicationStartDate: grant?.dates?.applicationStartDate,
    applicationEndDate: grant?.dates?.applicationEndDate,
    startText: grant?.dates?.startText,
    endText: grant?.dates?.endText,
  }));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/flat_grants_for_agent.json",
    JSON.stringify(flatGrants, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
