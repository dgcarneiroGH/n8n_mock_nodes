const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "clean_info_to_agent.json";

let createPortfolioDataRaw;
try {
  createPortfolioDataRaw = JSON.parse(
    fs.readFileSync("../files/responses/create_portfolio_data.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$("Motor Financiero").first().json
const data = createPortfolioDataRaw; //$input.first().json
// const historicoNotion = $input.all();

//#region Node Logic
const operations = data.operationsLog;
const economy = data.economy;
const history = data.previousHistory;
const availableFunds = data.availableFunds;

const crypto = operations
  .map((operation) => {
    const limits = operation.assetLimits;
    const firstLimit = limits[0];
    const objective = firstLimit?.objetivo ?? firstLimit?.target;
    const withdrawal = firstLimit?.extraccion ?? firstLimit?.autoWithdrawal;

    const limitsText = firstLimit
      ? `Target: ${objective} | Auto-Withdrawal: ${withdrawal}`
      : "No target defined";

    const news = operation.newsContext || operation.contexto_noticias || [];
    const headlines = news
      .map((item) => item.headline || item.titular)
      .filter(Boolean)
      .join(" || ");

    const asset = operation.asset || operation.activo;
    const price = operation.price ?? operation.precio;
    const roi = operation.totalRoi ?? operation.roi_total;

    return `Asset: ${asset} | Price: ${price}€ | ROI: ${roi}% | Limits: ${limitsText} | News: ${headlines}`;
  })
  .join("\n");

const fiat = economy
  .map((item) => {
    const currency = item.currency || item.moneda;
    const eurPrice = item.currentPriceEur ?? item.precio_actual_eur;
    return `${currency}: ${eurPrice}€`;
  })
  .join(" | ");

const historyText = history
  .map((item) => {
    const date = item.date || item.fecha;
    const cryptoSnapshot = (item.crypto || "").replace(/ \(ROI: [^\)]+\)/g, "");
    const fiatSnapshot = item.fiat || "";
    const shortDate = date ? date.split("T")[0] : "Unknown";
    return `Date: ${shortDate} | ${cryptoSnapshot} | ${fiatSnapshot}`;
  })
  .join("\n");

const result = {
  availableFunds,
  crypto,
  fiat,
  history: historyText,
};
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
