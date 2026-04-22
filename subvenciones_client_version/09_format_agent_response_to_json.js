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
const resultItems = [];

for (const grant of grantDatesCalculatorAIResponse) {
  const rawText = grant.output || grant.text;

  if (rawText) {
    try {
      // Remove markdown formatting if present
      const cleanText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // Parse the string into a JavaScript object or array
      const parsedArray = JSON.parse(cleanText);

      // Split array into individual items for n8n, or add single object
      if (Array.isArray(parsedArray)) {
        for (const grantItem of parsedArray) {
          resultItems.push(grantItem);
        }
      } else {
        resultItems.push(parsedArray);
      }
    } catch (error) {
      // Handle invalid JSON gracefully
      resultItems.push({
        error: "Failed to parse JSON",
        original_text: rawText,
        details: error.message,
      });
    }
  }
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/format_agent_response_to_json.json",
    JSON.stringify(resultItems, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
