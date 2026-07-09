const fs = require("fs");

// ============================================================================
// BLOCK 1: REUSABLE LOGIC (VALID FOR N8N AND NODE.JS)
// ============================================================================
//#region Node Logic

/**
 * Main function to build the HTML for grants pending review.
 * @param {Array<Object>} items - The array of grant items.
 * @returns {Array<Object>} An array containing the final HTML content object.
 */
function buildCompleteHtml(items) {
  const grantsHTML = items.map(item => renderGrantRow(item)).join("");
  const htmlContent = getHtmlTemplate(grantsHTML);

  return [{
    htmlContent,
    alertType: "Revisión Pendiente",
    grantCount: validItems.length,
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(41, 182, 246, 0.08); border: 2px dashed #29b6f6; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px">
                    <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 13px; color: #0f3254; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">🔑 CÓDIGO DE LA SUBVENCIÓN:</p>
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #24292e;">
                      ${grant.code || "N/A"}
                    </p>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${grant.urlHtml}" target="_blank" style="display: inline-block; background-color: #ffa726; color: #0f3254; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 25px; border-radius: 6px; margin-bottom: 10px; border: 2px solid #0f3254;">Revisar Subvención</a>
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
 * @param {string} grantsHTML - The HTML string of all grant rows.
 * @returns {string} The complete HTML document.
 */
function getHtmlTemplate(grantsHTML) {
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alerta de Revisión | Nomacoda Workflows</title>
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
                    🔔 Subvenciones Pendientes de Revisión
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                Se han identificado nuevas subvenciones que requieren una revisión manual para completar su clasificación. Por favor, accede a cada una para finalizar el proceso.
              </td>
            </tr>
            ${grantsHTML}
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
  const items = $input.all();
  return buildCompleteHtml(items);
}
// ============================================================================
// END OF N8N BLOCK
// ============================================================================


// ============================================================================
// BLOCK 3: LOCAL SANDBOX (DO NOT COPY INTO N8N)
// ============================================================================
if (require.main === module) {
    let rawData;
    try {
        // Attempt to load real data for testing
        rawData = JSON.parse(
            fs.readFileSync("../results/filters/filter_tagged_grants.json", "utf8")
        );
        console.log("✅ Loaded data from filter_tagged_grants.json");
    } catch (error) {
        // Fallback to default data if the file doesn't exist
        console.log("⚠️ Could not load from file. Using default test data.");
        rawData = [
            { code: "TEST-001", urlHtml: "https://example.com/grant1" },
            { code: "TEST-002", urlHtml: "https://example.com/grant2" }
        ];
    }

    // Mimic n8n's input structure by wrapping each item in a 'json' property
    const inputData = rawData.map(item => ({ json: item }));

    const results = buildCompleteHtml(inputData);

    if (results.length > 0) {
        const htmlOutput = results[0].htmlContent;
        const outputDir = "../templates";
        const outputPath = `${outputDir}/review-pending-mail.html`;

        // Create templates directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, htmlOutput, "utf8");
        console.log(`\x1b[32m%s\x1b[0m`, `✅ Successfully generated ${outputPath}`);
        console.log(`📤 Simulation: ${results[0].grantCount} grants pending review.`);
    } else {
        console.log("\x1b[33m%s\x1b[0m", "⚠️ No items met the criteria to generate HTML.");
    }
}
// ============================================================================
// END OF LOCAL SANDBOX
// ============================================================================
