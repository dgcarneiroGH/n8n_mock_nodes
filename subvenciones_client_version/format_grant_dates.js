const fs = require("fs");

let grantDatesCalculatorAIResponseRaw;
try {
  grantDatesCalculatorAIResponseRaw = JSON.parse(
    fs.readFileSync(
      "./results/grant_dates_calculator_AI_response.json",
      "utf8",
    ),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const grantDatesCalculatorAIResponse = grantDatesCalculatorAIResponseRaw;

//#region Node Logic

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/format_grant_dates.json",
    JSON.stringify(resultItems, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
