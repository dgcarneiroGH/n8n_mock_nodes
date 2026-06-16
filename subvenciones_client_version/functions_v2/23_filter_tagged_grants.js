const fs = require("fs");

let grantsDataRaw;
try {
  grantsDataRaw = JSON.parse(
    fs.readFileSync("../results/loops/loop_query_history.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
const grantsData = grantsDataRaw;

//#region Node Logic

const seenCodes = new Set();
const result = grantsData.filter(item => {
  if (item.code) {
    if (!seenCodes.has(item.code)) {
      seenCodes.add(item.code);
      return true;
    }
  }
  return false;
});

//#endregion

// Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "../results/filters/filter_tagged_grants.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo se ha creado o actualizado correctamente.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
