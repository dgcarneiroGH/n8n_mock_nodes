const fs = require("fs");

let agent2ResponseRaw;
try {
  agent2ResponseRaw = JSON.parse(
    fs.readFileSync("./results/agent2_response.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.first().json.output || $input.first().json.text || ""
const rawText = agent2ResponseRaw[0].output;

//#region Node Logic
let resultItems = [];
try {
  let cleanText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  let parsed;
  if (!cleanText.startsWith("[") && cleanText.startsWith("{")) {
    parsed = cleanText
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } else {
    const s = cleanText.indexOf("[");
    const e = cleanText.lastIndexOf("]");
    if (s !== -1 && e !== -1) cleanText = cleanText.substring(s, e + 1);
    parsed = JSON.parse(cleanText);
  }
  if (!Array.isArray(parsed)) parsed = [parsed];
  resultItems = parsed.map((grant) => ({ json: grant }));
} catch {
  resultItems = [{ error_status: "Parsing failed", original_text: rawText }];
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/format_agent2_response.json",
    JSON.stringify(resultItems, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
