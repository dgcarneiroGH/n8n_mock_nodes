const fs = require("fs");

let getNagerRaw;
try {
  getNagerRaw = JSON.parse(fs.readFileSync("./results/get_nager.json", "utf8"));
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getNager = getNagerRaw;

//#region Node Logic
const today = new Date().toISOString().split("T")[0];

const validDates = getNager
  .filter((holiday) => holiday.global === true && holiday.date > today)
  .map((holiday) => holiday.date);

const uniqueDates = [...new Set(validDates)];
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/format_nager_dates.json",
    JSON.stringify(uniqueDates, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
