const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "generate_snapshot.json";

let createPortfolioDataRaw;
try {
  createPortfolioDataRaw = JSON.parse(
    fs.readFileSync("../files/responses/create_portfolio_data.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N
const agentResponse = createPortfolioDataRaw; //$("Create Portfolio Data").first().json

//#region Node Logic
// Map Crypto assets (operationsLog)
const snapshotCrypto = (agentResponse.operationsLog || [])
  .map(
    (c) => `${c.asset}: ${c.price}€ (ROI: ${Number(c.totalRoi).toFixed(2)}%)`,
  )
  .join(" | ");

// Map Fiat currencies (economy)
const snapshotFiat = (agentResponse.economy || [])
  .map((f) => `${f.currency}: ${f.currentPriceEur}€`)
  .join(" | ");

// Build the result object
const result = {
  nombre: `Informe - ${new Date().toLocaleDateString("es-ES")}`,
  fecha: new Date().toISOString().split(".")[0] + "Z",
  liquidez: agentResponse.availableFunds, // Actualizado de 'fondosDisponibles'
  snapshot_crypto: snapshotCrypto,
  snapshot_fiat: snapshotFiat,
};
//#endregion

// Write the result to the output file
try {
  fs.writeFileSync(
    `${RESULT_FILE_PATH}/${RESULT_FILE_NAME}`,
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo generate_snapshot.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
