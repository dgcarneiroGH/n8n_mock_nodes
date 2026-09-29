const fs = require("fs");

// ============================================================================
// BLOCK 1: REUSABLE LOGIC (VALID FOR N8N AND NODE.JS)
// ============================================================================
//#region Node Logic

/**
 * Main function to build the HTML report for a discarded grant.
 * @param {Object} grant - The grant object (grantId, grantTitle, reason).
 * @returns {Array<Object>} An array containing the final HTML content object.
 */
function buildReportHtml(grant) {
  const reportRows = renderGrantRow(grant);
  const htmlContent = getHtmlTemplate(reportRows);

  return [{
    htmlContent
  }];
}

/**
 * Renders a single grant row as an HTML table row.
 * @param {Object} grant - The grant object.
 * @returns {string} The HTML string for the grant row.
 */
function renderGrantRow(grant) {
  return `
    <tr>
      <td style="padding-bottom: 35px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent; border: 3px solid #0f3254; border-bottom: 8px solid #0f3254; border-radius: 16px;">
          <tr>
            <td style="padding: 25px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 167, 38, 0.08); border: 2px dashed #ffa726; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px">
                    <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 13px; color: #0f3254; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">⚠️ MOTIVO DEL DESCARTE:</p>
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #24292e;">
                      ${grant.reason}
                    </p>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://app.notion.com/p/${grant.grantId}" target="_blank" style="display: inline-block; background-color: #ffa726; color: #0f3254; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 25px; border-radius: 6px; margin-bottom: 10px; border: 2px solid #0f3254;">Ver en Notion</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Returns the full HTML document template.
 * @param {string} reportRows - The HTML string of the grant row.
 * @returns {string} The complete HTML document.
 */
function getHtmlTemplate(reportRows) {
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reporte de Descarte | Nomacoda Workflows</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { border-collapse: collapse; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: transparent">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent">
      <tr>
        <td align="center" style="padding: 40px 15px">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px">
            <tr>
              <td align="center" style="padding-bottom: 40px">
                <div style="display: inline-block; background-color: #29b6f6; border: 3px solid #0f3254; border-radius: 12px; padding: 15px 30px; box-shadow: 4px 4px 0px #0f3254;">
                  <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #0f3254; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">
                    📋 Reporte de Subvención Descartada
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                Un usuario ha reportado un posible error de categorización.
              </td>
            </tr>
            ${reportRows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

//#endregion
// ============================================================================
// END OF REUSABLE LOGIC
// ============================================================================


// ============================================================================
// BLOCK 2: N8N INTEGRATION (COPY ONLY THIS PART INTO N8N)
// ============================================================================
if (typeof $input !== "undefined") {
  // This code runs only in the n8n environment
  const grant = $input.first().json;
  return buildReportHtml(grant);
}
// ============================================================================
// END OF N8N BLOCK
// ============================================================================


// ============================================================================
// BLOCK 3: LOCAL SANDBOX (DO NOT COPY INTO N8N)
// ============================================================================
if (require.main === module) {
  const mockedGrant =
  {
    grantId: "3d483f94-7b2c-81ec-ba43-e23585cf6aa5",
    grantTitle: "RESOLUCIÓN DEL DIRECTOR GENERAL DEL INSTITUTO DE LAS INDUSTRIAS CULTURALES Y LAS ARTES DE LA REGIÓN DE MURCIA, POR LA QUE SE CONVOCAN AYUDAS ECONÓMICAS, EN RÉGIMEN DE CONCURRENCIA COMPETITIVA, DESTINADAS AL FOMENTO DE LA ACTIVIDAD CULTURAL EN ÁREAS RURALE",
    reason: "Región incorrecta",
  };

  const results = buildReportHtml(mockedGrant);

  if (results.length > 0) {
    const htmlOutput = results[0].htmlContent;
    const outputDir = "../templates";
    const outputPath = `${outputDir}/rejection-report-mail.html`;

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, htmlOutput, "utf8");
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Successfully generated ${outputPath}`);
    console.log(`📤 Simulation: ${results[0].grantCount} grant reported.`);
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ No items met the criteria to generate HTML.");
  }
}
// ============================================================================
// END OF LOCAL SANDBOX
// ============================================================================
