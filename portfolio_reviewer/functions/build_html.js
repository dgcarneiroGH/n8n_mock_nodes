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
const data = formatAgentResponseRaw;

// Simulamos la entrada de n8n
const $input = {
  all: () => data.map((item) => ({ json: item })),
  first: () => ({
    json: data[0],
  }),
};

function codigoN8n() {
  // #region Node Logic
  const data = $input.first().json;
  if (data.error || data.parsing_failed) {
    return { html: `<h1>Report generation error</h1>` };
  }

  const colors = {
    bgApp: "#0c2738",
    bgSection: "#113448",
    textMain: "#e2e8f0",
    accentOrange: "#f6ad55",
    alertRed: "#e53e3e",
    alertGreen: "#48bb78",
    alertGray: "#a0aec0",
    borderLines: "#1d4ed855",
  };

  const getTrendColor = (trend) => {
    if (!trend) return colors.textMain;
    if (trend.toUpperCase().includes("BULL")) return colors.alertGreen;
    if (trend.toUpperCase().includes("BEAR")) return colors.alertRed;
    return colors.textMain;
  };

  const getRoiColor = (roi) => {
    if (!roi) return colors.textMain;
    return roi.includes("-") ? colors.alertRed : colors.alertGreen;
  };

  let cryptoRows = "";
  console.log(data);
  if (Array.isArray(data.activos)) {
    data.activos.forEach((a) => {
      cryptoRows += `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #1e4b65; font-size: 14px;"><strong>${a.nombre}</strong></td>
            <td style="padding: 15px; border-bottom: 1px solid #1e4b65; font-size: 14px;">${a.precio_actual}</td>
            <td style="padding: 15px; border-bottom: 1px solid #1e4b65; color: ${getRoiColor(a.roi)}; font-size: 14px;">${a.roi}</td>
            <td style="padding: 15px; border-bottom: 1px solid #1e4b65; font-size: 14px;">
                <span style="color: ${getTrendColor(a.tendencia)}; font-weight: bold;">${a.tendencia}</span><br>
                <span style="font-size: 11px; color: ${colors.alertGray};">${a.media_texto}</span>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #1e4b65; font-size: 13px; color: ${colors.textMain};">${a.distancia_objetivo}</td>
        </tr>`;
    });
  }

  let fiatCols = "";
  if (Array.isArray(data.fiat)) {
    const widthPercentage = Math.floor(100 / data.fiat.length);
    data.fiat.forEach((f) => {
      fiatCols += `
        <td style="width: ${widthPercentage}%; padding: 0 10px; vertical-align: top;">
            <div style="background-color: ${colors.bgSection}; border-radius: 6px; padding: 15px; border: 1px solid #1e4b65;">
                <h4 style="color: ${colors.accentOrange}; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase;">${f.currency || f.moneda}</h4>
                <div style="font-size: 12px; line-height: 1.6; color: ${colors.textMain};">
                    <strong>${f.tasa_actual}</strong><br>
                    <span style="color: ${colors.alertGray};">${f.media_texto}</span><br>
                    <span style="color: ${colors.textMain};">${f.tendencia}</span><br><br>
                    <span style="color: ${colors.alertGray};">${f.veredicto}</span>
                </div>
            </div>
        </td>`;
    });
  }

  const correlationBanner = `
<div style="background-color: #0f3d32; border-left: 4px solid ${colors.alertGreen}; padding: 15px; margin-top: 15px; color: ${colors.alertGreen}; font-size: 13px; line-height: 1.5;">
    ${data.correlation_analysis || data.analisis_correlacion || "No correlation data."}
</div>`;

  const html = `
<div style="background-color: ${colors.bgApp}; padding: 30px; color: ${colors.textMain}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
    <h1 style="color: ${colors.accentOrange}; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">
        FINANCIAL INTELLIGENCE ANALYSIS
    </h1>
    <div style="background-color: #2d3748; border-left: 4px solid ${colors.alertRed}; padding: 12px 15px; margin-bottom: 30px; font-size: 14px; font-weight: bold;">
        ${data.global_status || data.estado_global || "Status not defined."}
    </div>
    <h2 style="color: ${colors.accentOrange}; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid ${colors.accentOrange}; padding-bottom: 5px;">
        1. LIQUIDITY STATUS
    </h2>
    <p style="font-size: 14px; margin-top: 10px; margin-bottom: 30px;">
        ${data.liquidity_text || data.liquidez_texto}
    </p>
    <h2 style="color: ${colors.accentOrange}; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid ${colors.accentOrange}; padding-bottom: 5px;">
        2. CRYPTO PORTFOLIO PERFORMANCE
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; background-color: ${colors.bgSection};">
        <thead>
            <tr>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain};">Asset</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain};">Current Price</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain};">ROI</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain};">Trend vs Mean (10 reg)</th>
                <th style="padding: 15px; text-align: left; font-size: 12px; border-bottom: 1px solid #1e4b65; color: ${colors.textMain};">Target Distance</th>
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
  return [{ htmlContent: html }];
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
  console.log(
    `📤 Simulación: Se enviaría un correo a ${itemsFinales[0].emailTo} con ${itemsFinales[0].total_jobs} ofertas.`,
  );
} else {
  console.log("\x1b[33m%s\x1b[0m", "⚠️ Ningún trabajo procesado.");
}
