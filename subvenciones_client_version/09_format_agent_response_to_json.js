const fs = require("fs");

let grantDatesCalculatorAIResponseRaw, flatGrantsForAgentRaw;
try {
  grantDatesCalculatorAIResponseRaw = JSON.parse(
    fs.readFileSync(
      "./results/grant_dates_calculator_AI_response.json",
      "utf8",
    ),
  );
  flatGrantsForAgentRaw = JSON.parse(
    fs.readFileSync("./results/flat_grants_for_agent.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const grantDatesCalculatorAIResponse = grantDatesCalculatorAIResponseRaw;
const flatGrantsForAgent = flatGrantsForAgentRaw;

//#region Node Logic
const resultItems = [];

const textoIA =
  grantDatesCalculatorAIResponse.output ||
  grantDatesCalculatorAIResponse.text ||
  "";

try {
  let cleanText = textoIA
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsedData;
  const isJsonLines = !cleanText.startsWith("[") && cleanText.startsWith("{");

  if (isJsonLines) {
    const lines = cleanText.split("\n").filter((linea) => linea.trim() !== "");
    parsedData = lines.map((linea) => JSON.parse(linea.trim()));
  } else {
    const startArray = cleanText.indexOf("[");
    const endArray = cleanText.lastIndexOf("]");

    if (startArray !== -1 && endArray !== -1) {
      cleanText = cleanText.substring(startArray, endArray + 1);
    }

    parsedData = JSON.parse(cleanText);
  }

  const grants = Array.isArray(parsedData) ? parsedData : [parsedData];

  for (const grant of grants) {
    const incomplete =
      grant.calculated_end_date === null ||
      grant.calculated_start_date === null;

    if (incomplete) {
      const original = flatGrantsForAgent.find(
        (item) => item.code === grant.code,
      );

      if (original) {
        resultItems.push({ ...original, _route: "smart_agent" });
      }

      continue;
    }

    resultItems.push({ ...grant, _route: "success" });
  }
} catch (error) {
  for (const original of flatGrantsForAgent) {
    resultItems.push({ ...original, _route: "smart_agent" });
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
