const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "format_agent_response.json";

let agentResponseRaw;
try {
  agentResponseRaw = JSON.parse(
    fs.readFileSync("../files/payloads/agent_response.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N
const agentResponse = agentResponseRaw; //$input.item.json.output

//#region Node Logic
let result;
try {
  let text = agentResponse
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }
  result = JSON.parse(text);
} catch (error) {
  result = { error: "JSON parse failed", original: agentResponse };
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    `${RESULT_FILE_PATH}/${RESULT_FILE_NAME}`,
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
