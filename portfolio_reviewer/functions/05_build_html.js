const fs = require("fs");

const RESULT_FILE_ROUTE = "../files/templates";
const RESULT_FILE_NAME = "build_html.html";

let formatAgentResponseRaw, createPortfolioDataRaw;
try {
  formatAgentResponseRaw = JSON.parse(
    fs.readFileSync("../files/responses/format_agent_response.json", "utf8"),
  );
  createPortfolioDataRaw = JSON.parse(
    fs.readFileSync("../files/responses/create_portfolio_data.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N
// ============================================================================
const inputData = { agentResponse: formatAgentResponseRaw, availableFunds: createPortfolioDataRaw.availableFunds, fearAndGreed: createPortfolioDataRaw.fearAndGreed };

const _inputArray = Array.isArray(inputData) ? inputData : [inputData];
const $input = {
  all: () => _inputArray.map((item) => ({ json: item })),
  first: () => ({ json: _inputArray[0] || {} }),
};


// ============================================================================
// HELPERS (Node Logic)
// ============================================================================
const getTrendColorInline = (trend) => {
  if (!trend) return "";
  const normalized = String(trend).toUpperCase();
  const knownTrends = ["BULL", "BEAR", "ALCISTA", "BAJISTA", "ESTABLE"];
  return knownTrends.some((term) => normalized.includes(term)) ? "" : "color: #44474a;";
};

const colorizeMarketBiasTermsInline = (text) =>
  text.replace(/(?<![>])\b(BAJISTA|ALCISTA|ESTABLE)\b/gi, (match) => {
    const n = match.toUpperCase();
    if (n === "BAJISTA") return `<span style="color: #d9534f; font-weight: 700;">${match}</span>`;
    if (n === "ALCISTA") return `<span style="color: #2ecc71; font-weight: 700;">${match}</span>`;
    return `<span style="color: #1c1b1c; font-weight: 700;">${match}</span>`;
  });

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "-";

  // Strip euro symbols and all whitespace
  let str = String(value).replace(/[€\s]/g, "");

  // Normalize decimal commas before parsing as a float
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, ''); // US format 1,234.56
  } else if (str.includes(',')) {
    str = str.replace(/,/g, '.'); // European format 1234,56
  }

  const num = parseFloat(str);
  if (isNaN(num)) return String(value);

  return num.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4, // Allow up to 4 decimals so fiat prices keep precision
  }) + " €";
};


const renderCryptoRows = (assets) => {
  if (!Array.isArray(assets) || assets.length === 0) return "";
  return assets
    .map(
      (asset) => {
        const isNegative = asset.roiStatus === "negative";
        const roiColor = isNegative ? "#d9534f" : "#2ecc71";
        const roiIcon = isNegative ? "↓" : "↑";

        return `
        <tr>
          <td style="padding: 16px 8px; border-bottom: 1px solid #e5e2e1; font-family: sans-serif; font-size: 14px; color: #2D3748; vertical-align: top;">
            <table cellpadding="0" cellspacing="0" style="border:0;">
                <tr>
                    <td style="padding-right: 12px; vertical-align: middle;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #f0eded; text-align: center; line-height: 32px; font-size: 12px; font-weight: bold; color:#44474a; border: 1px solid #dcd9d9;">
                          ${asset.symbol || "?"}
                        </div>
                    </td>
                    <td style="vertical-align: middle;">
                        <div style="font-weight: 600;">${asset.name || "-"}</div>
                        <div style="font-size: 11px; color: #718096; margin-top: 4px; line-height: 1.2;">${asset.newsSummary || "-"}</div>
                    </td>
                </tr>
            </table>
          </td>
          <!-- Force no-wrap and assign specific width for Value -->
          <td style="padding: 16px 8px; border-bottom: 1px solid #e5e2e1; font-family: sans-serif; font-size: 14px; color: #1c1b1c; vertical-align: top; white-space: nowrap;">${formatMoney(asset.currentPrice)}</td>
          
          <!-- ROI Badge with bulletproof nested table -->
          <td style="padding: 16px 8px; border-bottom: 1px solid #e5e2e1; vertical-align: top;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 4px 8px; border-radius: 12px; border: 1px solid ${roiColor}; background-color: #fcf8f8; color: ${roiColor}; font-family: sans-serif; font-size: 12px; font-weight: 600; white-space: nowrap;">
                  ${roiIcon} ${asset.roi || "-"}
                </td>
              </tr>
            </table>
          </td>
          
          <td style="padding: 16px 8px; border-bottom: 1px solid #e5e2e1; font-family: sans-serif; font-size: 13px; vertical-align: top; white-space: nowrap;">
            <div style="font-weight: 700; ${getTrendColorInline(asset.trend)}">${asset.trend || "-"}</div>
            <div style="color: #718096; font-size: 11px; margin-top: 4px;">${asset.averagePrice ? formatMoney(asset.averagePrice) : ""}</div>
          </td>
          
          <td style="padding: 16px 8px; border-bottom: 1px solid #e5e2e1; font-family: sans-serif; font-size: 13px; color: #44474a; vertical-align: top;">${asset.targetDistance || "No target defined"}</td>
        </tr>`
      }
    )
    .join("");
};


// ============================================================================
// BLOQUE 2: LÓGICA DEL NODO
// ============================================================================
function buildReportHtml() {
  let data;
  if (typeof $ === 'function') {
    const agentNode = $('Format Agent Response').first().json || {};
    const portfolioNode = $('Create Portfolio Data').first().json || {};
    data = {
      agentResponse: agentNode.agentResponse || agentNode,
      availableFunds: portfolioNode.availableFunds,
      fearAndGreed: portfolioNode.fearAndGreed
    };
  } else {
    data = $input.first().json || {};
  }

  const payload = Array.isArray(data.agentResponse) ? data.agentResponse[0] : data.agentResponse;
  if (!payload || payload.error || payload.parsing_failed) {
    return [{ htmlContent: `<h1 style="font-family: sans-serif;">Report generation error</h1>` }];
  }

  const cryptoRows = renderCryptoRows(payload.cryptoPortfolio);
  const fiatCards = renderFiatCards(payload.fiatMarket);

  const liquidityValue = formatMoney(data.availableFunds);
  const fearAndGreed = data.fearAndGreed || {};

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Financial Intelligence Analysis</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: Arial, Helvetica, sans-serif; color: #1c1b1c;">

<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f7f6" style="min-width: 320px;">
    <tr>
        <td align="center" style="padding: 20px 10px;">
            
            <!-- CONTENEDOR PRINCIPAL -->
            <table width="100%" max-width="1200" border="0" cellpadding="0" cellspacing="0" style="max-width: 1200px; width: 100%;">
                
                <!-- HEADER -->
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h1 style="font-size: 24px; font-weight: bold; color: #2D3748; margin: 0; text-transform: uppercase;">FINANCIAL INTELLIGENCE ANALYSIS</h1>
                    </td>
                </tr>

                <tr>
                    <td>
                        <!-- GRID CON TABLAS -->
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <!-- COLUMNA IZQUIERDA -->
                                <td width="65%" valign="top" style="padding-right: 20px;">
                                    
                                    <!-- TOP WIDGETS -->
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                        <tr>
                                            <td width="48%" valign="top">
                                                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; border-bottom: 3px solid #e2e8f0;">
                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td><h3 style="font-size: 14px; font-weight: normal; color: #44474a; margin: 0 0 16px 0;">Liquidity Status</h3></td>
                                                            <td align="right" style="color: #718096; font-size: 16px;">💧</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><p style="font-size: 24px; font-weight: bold; color: #2D3748; margin: 0;">${liquidityValue}</p></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" valign="top">
                                                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; border-bottom: 3px solid #e2e8f0;">
                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td><h3 style="font-size: 14px; font-weight: normal; color: #44474a; margin: 0 0 16px 0;">Global Sentiment</h3></td>
                                                            <td align="right" style="color: #718096; font-size: 16px;">🌍</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2">
                                                                <p style="font-size: 24px; font-weight: bold; color: #2D3748; margin: 0 0 8px 0;">${fearAndGreed.classification || "-"}</p>
                                                                <div style="background-color: #e2e8f0; height: 4px; width: 100%; font-size:0; line-height:0;">
                                                                    <div style="background-color: #865300; height: 4px; width: ${fearAndGreed.value || 0}%; font-size:0; line-height:0;"></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CRYPTO TABLE -->
                                    <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; border-bottom: 3px solid #e2e8f0;">
                                        <h3 style="font-size: 18px; font-weight: bold; color: #865300; margin: 0 0 20px 0;">Crypto Portfolio</h3>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <thead>
                                                <tr>
                                                    <!-- Se configuran anchos proporcionales para evitar el salto de texto -->
                                                    <th width="32%" align="left" style="padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #718096; font-weight: normal;">Asset</th>
                                                    <th width="18%" align="left" style="padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #718096; font-weight: normal; white-space: nowrap;">Value</th>
                                                    <th width="15%" align="left" style="padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #718096; font-weight: normal; white-space: nowrap;">ROI</th>
                                                    <th width="15%" align="left" style="padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #718096; font-weight: normal; white-space: nowrap;">Trend vs Mean</th>
                                                    <th width="20%" align="left" style="padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #718096; font-weight: normal;">Target Distance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${cryptoRows}
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                                
                                <!-- COLUMNA DERECHA -->
                                <td width="35%" valign="top">
                                    <h3 style="font-size: 16px; font-weight: bold; color: #865300; margin: 0 0 16px 0;">Fiat Market</h3>
                                    ${fiatCards}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>`;

  return [{ htmlContent: colorizeMarketBiasTermsInline(html) }];
}

// ============================================================================
// BLOQUE 3: EJECUCIÓN (NO COPIAR EN N8N)
// ============================================================================
const itemsFinales = buildReportHtml();

if (itemsFinales.length > 0) {
  const htmlParaTest = itemsFinales[0].htmlContent;
  if (!fs.existsSync("templates")) fs.mkdirSync("templates");
  fs.writeFileSync(`${RESULT_FILE_ROUTE}/${RESULT_FILE_NAME}`, htmlParaTest, "utf8");
  console.log("\x1b[32m%s\x1b[0m", `✅ Archivo "${RESULT_FILE_NAME}" generado.`);
}

// ============================================================================
// BLOQUE 4: FIAT CARDS RENDERER (Para email)
// ============================================================================
function renderFiatCards(fiatItems) {
  if (!Array.isArray(fiatItems) || fiatItems.length === 0) return "";
  const iconFor = (currency) => {
    const c = String(currency).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (c.includes("libra") || c.includes("gbp") || c.includes("pound")) return "£";
    if (c.includes("dolar") || c.includes("usd") || c.includes("dollar")) return "$";
    if (c.includes("yuan") || c.includes("cny")) return "¥";
    return "¤";
  };
  return fiatItems
    .map(
      (fiat) => `
        <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #e2e8f0; border-bottom: 3px solid #e2e8f0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50" valign="top">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f4f8; text-align: center; line-height: 40px; font-size: 16px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">
                            ${iconFor(fiat.name)}
                        </div>
                    </td>
                    <td valign="top" style="padding-right: 10px;">
                        <h4 style="font-size: 14px; font-weight: bold; color: #2D3748; margin: 0 0 4px 0;">${fiat.name || "N/A"}</h4>
                        <p style="font-size: 12px; color: #718096; margin: 0 0 6px 0;">${fiat.ticker || "-"}</p>
                        <p style="font-size: 11px; color: #4a5568; margin: 0; line-height: 1.3;">${fiat.newsSummary || "-"}</p>
                    </td>
                    <td valign="top" align="right" style="width: 100px; white-space: nowrap;">
                        <p style="font-size: 14px; font-weight: bold; color: #1a202c; margin: 0 0 4px 0;">${formatMoney(fiat.currentPrice)}</p>
                        <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #4a5568; margin: 0 0 4px 0;">${fiat.trend || "-"}</p>
                        <p style="font-size: 10px; color: #718096; margin: 0;">${fiat.averagePrice || "-"}</p>
                    </td>
                </tr>
            </table>
        </div>`,
    )
    .join("");
}