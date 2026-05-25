const fs = require("fs");

const RESULT_FILE_ROUTE = "../files/templates";
const RESULT_FILE_NAME = "build_html.html";

let formatAgentResponseRaw;
try {
  formatAgentResponseRaw = JSON.parse(
    fs.readFileSync("../files/responses/format_agent_response.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// ============================================================================
const inputData = formatAgentResponseRaw;

// Simulamos la entrada de n8n
const $input = {
  all: () =>
    (Array.isArray(inputData) ? inputData : []).map((item) => ({ json: item })),
  first: () => ({
    json: Array.isArray(inputData) ? inputData[0] || {} : {},
  }),
};

const COLORS = {
  bgApp: "#0c2738",
  bgSection: "#113448",
  textMain: "#f0f4f8",
  accentOrange: "#ffa726",
  alertRed: "#d9534f",
  alertGreen: "#2ecc71",
  alertGray: "#a0aec0",
  borderMain: "#1e4b65",
};

const getTrendColor = (trend, colors) => {
  if (!trend) return colors.textMain;

  const normalizedTrend = String(trend).toUpperCase();
  if (normalizedTrend.includes("BULL") || normalizedTrend.includes("ALCISTA")) {
    return colors.alertGreen;
  }
  if (normalizedTrend.includes("BEAR") || normalizedTrend.includes("BAJISTA")) {
    return colors.alertRed;
  }

  return colors.textMain;
};

const getRoiColor = (roi, colors) => {
  if (!roi) return colors.textMain;
  return String(roi).includes("-") ? colors.alertRed : colors.alertGreen;
};

const colorizeMarketBiasTerms = (text, colors) =>
  text.replace(/\b(BAJISTA|ALCISTA|ESTABLE)\b/gi, (match) => {
    const normalized = match.toUpperCase();
    if (normalized === "BAJISTA") {
      return `<span style="color: ${colors.alertRed}; font-weight: bold;">${match}</span>`;
    }
    if (normalized === "ALCISTA") {
      return `<span style="color: ${colors.alertGreen}; font-weight: bold;">${match}</span>`;
    }
    return `<span style="color: ${colors.textMain}; font-weight: bold;">${match}</span>`;
  });

const renderCryptoRows = (assets, colors) => {
  if (!Array.isArray(assets)) return "";

  return assets
    .map(
      (asset) => `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid ${colors.borderMain}; font-size: 14px; color: ${colors.textMain} !important;"><strong style="color: ${colors.textMain} !important;">${asset.nombre || "-"}</strong></td>
          <td style="padding: 15px; border-bottom: 1px solid ${colors.borderMain}; font-size: 14px; color: ${colors.textMain} !important;"><span style="color: ${colors.textMain} !important;">${asset.precio_actual || "-"}</span></td>
          <td style="padding: 15px; border-bottom: 1px solid ${colors.borderMain}; color: ${getRoiColor(asset.roi, colors)}; font-size: 14px;">${asset.roi || "-"}</td>
          <td style="padding: 15px; border-bottom: 1px solid ${colors.borderMain}; font-size: 14px; color: ${colors.textMain};">
              <span style="color: ${getTrendColor(asset.tendencia, colors)}; font-weight: bold;">${asset.tendencia || "-"}</span><br>
              <span style="font-size: 11px; color: ${colors.alertGray};">${asset.media_texto || "-"}</span>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid ${colors.borderMain}; font-size: 13px; color: ${colors.textMain};">${asset.distancia_objetivo || "-"}</td>
        </tr>`,
    )
    .join("");
};

const renderFiatCols = (fiatItems, colors) => {
  if (!Array.isArray(fiatItems) || fiatItems.length === 0) return "";

  const widthPercentage = Math.floor(100 / fiatItems.length);
  return fiatItems
    .map(
      (fiat) => `
        <td style="width: ${widthPercentage}%; padding: 0 10px; vertical-align: top; color: ${colors.textMain};">
            <div style="background-color: ${colors.bgSection}; border-radius: 6px; padding: 15px; border: 1px solid ${colors.borderMain};">
                <h4 style="color: ${colors.accentOrange}; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase;">${fiat.currency || fiat.moneda || "N/A"}</h4>
                <div style="font-size: 12px; line-height: 1.6; color: ${colors.textMain};">
                    <strong style="color: ${colors.textMain};">${fiat.tasa_actual || "-"}</strong><br>
                    <span style="color: ${colors.alertGray};">${fiat.media_texto || "-"}</span><br>
                    <span style="color: ${colors.textMain};">${fiat.tendencia || "-"}</span><br><br>
                    <span style="color: ${colors.alertGray};">${fiat.veredicto || "-"}</span>
                </div>
            </div>
        </td>`,
    )
    .join("");
};

function codigoN8n() {
  // #region Node Logic
  const data = $input.first().json || {};
  if (data.error || data.parsing_failed) {
    return [{ htmlContent: `<h1>Report generation error</h1>` }];
  }

  const colors = COLORS;
  const cryptoRows = renderCryptoRows(data.activos, colors);
  const fiatCols = renderFiatCols(data.fiat, colors);

  const correlationBanner = `
<div style="background-color: #0f3d32; border-left: 4px solid ${colors.alertGreen}; padding: 15px; margin-top: 15px; color: ${colors.alertGreen}; font-size: 13px; line-height: 1.5;">
    ${data.correlation_analysis || data.analisis_correlacion || "No correlation data."}
</div>`;

  const html = `
<div style="background-color: ${colors.bgApp}; padding: 30px; color: ${colors.textMain}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
    <h1 style="color: ${colors.accentOrange}; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">
        FINANCIAL INTELLIGENCE ANALYSIS
    </h1>
    <div style="background-color: #2d3748; border-left: 4px solid ${colors.alertRed}; padding: 12px 15px; margin-bottom: 30px; font-size: 14px; font-weight: bold; color: ${colors.textMain};">
        ${data.global_status || data.estado_global || "Status not defined."}
    </div>
    <h2 style="color: ${colors.accentOrange}; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid ${colors.accentOrange}; padding-bottom: 5px;">
        1. LIQUIDITY STATUS
    </h2>
    <p style="font-size: 14px; margin-top: 10px; margin-bottom: 30px; color: ${colors.textMain};">
        ${data.liquidity_text || data.liquidez_texto}
    </p>
    <h2 style="color: ${colors.accentOrange}; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid ${colors.accentOrange}; padding-bottom: 5px;">
        2. CRYPTO PORTFOLIO PERFORMANCE
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; background-color: ${colors.bgSection};">
        <thead>
            <tr>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain}; font-style: italic;">Asset</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain}; font-style: italic;">Current Price</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain}; font-style: italic;">ROI</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain}; font-style: italic;">Trend vs Mean (10 reg)</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain}; font-style: italic;">Target Distance</th>
            </tr>
        </thead>
        <tbody>
            ${cryptoRows}
        </tbody>
    </table>
    ${correlationBanner}
    <h2 style="color: ${colors.accentOrange}; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid ${colors.accentOrange}; padding-bottom: 5px; margin-top: 40px;">
        3. FIAT MARKET
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed;">
        <tr>
            ${fiatCols}
        </tr>
    </table>
</div>
`;
  const htmlWithColoredBiasTerms = colorizeMarketBiasTerms(html, colors);
  return [{ htmlContent: htmlWithColoredBiasTerms }];
  // #endregion
}

// ============================================================================
// BLOQUE 3: EJECUCIÓN Y GENERACIÓN DEL HTML (NO COPIAR EN N8N)
// ============================================================================
const itemsFinales = codigoN8n();

if (itemsFinales.length > 0) {
  const htmlParaTest = itemsFinales[0].htmlContent;

  if (!fs.existsSync("templates")) fs.mkdirSync("templates");
  fs.writeFileSync(
    `${RESULT_FILE_ROUTE}/${RESULT_FILE_NAME}`,
    htmlParaTest,
    "utf8",
  );

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Archivo "${RESULT_FILE_NAME}" generado. Ábrelo en tu navegador.`,
  );
} else {
  console.log("\x1b[33m%s\x1b[0m", "⚠️ Ningún trabajo procesado.");
}
