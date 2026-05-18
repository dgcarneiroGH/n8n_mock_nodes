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
const filterGrantsData = filterGrantsDataRaw;

//#region Node Logic
const acceptedCodes = new Set(
  filterBenefactors.accepted.map((g) => g.codigoBDNS),
);

const cleanedGrants = filterGrantsData
  .filter((grant) => acceptedCodes.has(grant.codigoBDNS))
  .map((grant) => ({
    bdnsCode: grant.codigoBDNS,
    receptionDate: grant.fechaRecepcion,
    applicationStartDate: grant.fechaInicioSolicitud,
    applicationEndDate: grant.fechaFinSolicitud,
    startText: grant.textInicio,
    endText: grant.textFin,
  }));

const result = { grants_to_process: cleanedGrants };
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/clean_boe_response.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
