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
const financialResults = financialEngine.resultadosFinancieros;
const sourceData = financialEngine.rawParaIA;
const cryptoNews = sourceData.noticiasCrypto;

const operationsLog = financialResults.map((asset) => {
  const relatedNews = cryptoNews
    .filter(
      (news) =>
        news.title && news.title.toLowerCase().includes(asset.nombre_busqueda),
    )
    .map((news) => ({
      headline: news.title,
      link: news.link,
      date: news.isoDate,
    }));

  return {
    asset: asset.activo,
    price: asset.precioActual,
    totalInvested: asset.totalInvertido,
    totalWithdrawn: asset.totalExtraido,
    netProfit: asset.beneficioNeto,
    totalRoi: asset.roiTotal,
    finalBalance: asset.saldoActual,
    newsContext: relatedNews,
    assetLimits: asset.limitesConfigurados,
    executedSales: asset.ventasEjecutadas,
  };
});

const fiatEconomy = sourceData.monedasFiat.map((currency) => ({
  currency: currency.coin_name,
  currentPriceEur: currency.rate_eur,
  recentNews: currency.coin_news
    .filter((news) => news.title)
    .map((news) => ({
      headline: news.title,
      date: news.pubDate || news.isoDate,
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
  availableFunds: sourceData.fondosDisponibles,
  economy: fiatEconomy,
  previousHistory,
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
