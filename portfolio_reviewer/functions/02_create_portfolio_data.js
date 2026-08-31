const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "create_portfolio_data.json";

let financialEngineRaw, notionHistoricRaw;
try {
  financialEngineRaw = JSON.parse(
    fs.readFileSync("../files/responses/financial_engine.json", "utf8"),
  );
  notionHistoricRaw = JSON.parse(
    fs.readFileSync("../files/payloads/notion_historic.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N
const financialEngine = Array.isArray(financialEngineRaw)
  ? financialEngineRaw[0]
  : financialEngineRaw; // $("Financial Engine").first().json
const notionHistoric = notionHistoricRaw; // $input.all().map(item=>item.json);

//#region Node Logic
const sumEurValue = (movements) =>
  movements.reduce((sum, m) => sum + m.price_eur * m.amount, 0);

const operationsLog = financialEngine.crypto.map((asset) => {
  const movements = asset.movements || [];
  const buyMovements = movements.filter((m) => !m.is_sale);
  const sellMovements = movements.filter((m) => m.is_sale);
  const totalInvested = sumEurValue(buyMovements);
  const totalWithdrawn = sumEurValue(sellMovements);

  return {
    asset: asset.name,
    price: asset.actual_price,
    totalInvested,
    totalWithdrawn,
    netProfit: totalWithdrawn - totalInvested,
    totalRoi: asset.roi,
    finalBalance: asset.total_amount,
    newsContext: (asset.news || []).map((news) => ({
      headline: news.title,
      link: news.link,
      date: news.isoDate,
    })),
    assetLimits: asset.limits,
    executedSales: sellMovements.map((m) => ({
      price: m.price_eur,
      amount: m.amount,
      date: m.date,
    })),
  };
});

const economy = financialEngine.fiat.map((currency) => ({
  currency: currency.name,
  currentPriceEur: currency.rate_eur,
  recentNews: (currency.coin_news || [])
    .filter((news) => news.titular)
    .map((news) => ({
      headline: news.titular,
      date: news.fecha,
    })),
}));

const previousHistory = notionHistoric.slice(0, 9).map((report) => ({
  date: report.property_fecha_de_an_lisis?.start || "",
  liquidity: report.property_fondos_disponibles,
  crypto: report.property_snapshot_crypto,
  fiat: report.property_snapshot_fiat,
}));

const result = {
  operationsLog,
  availableFunds: financialEngine.available_funds,
  economy,
  previousHistory,
  fearAndGreed: financialEngine.fear_and_greed,
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
    `✅ ¡Éxito! El archivo ${RESULT_FILE_NAME}.json se ha creado o actualizado correctamente en tu carpeta.`,
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
