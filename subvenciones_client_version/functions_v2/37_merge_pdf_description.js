const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const formatGrantDataRaw = JSON.parse(
  fs.readFileSync("../results/builders/format_grant_data.json"),
);

const pdfDescription =
  "Convocatoria de ayudas destinada al sector artesanal. " +
  "Texto simulado extraído del documento PDF asociado a la subvención, " +
  "incluyendo requisitos de los beneficiarios, documentación a aportar y plazos de justificación.";
//#endregion

try {
  //#region Node Logic
  const result = {
    ...formatGrantDataRaw,
    description: pdfDescription,
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/merge_pdf_description.json",
    JSON.stringify(result, null, 2),
  );
  const resultCount = Array.isArray(result) ? result.length : 1;
  console.log(`✅ ${resultCount} grant(s) merged with mocked PDF description`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
