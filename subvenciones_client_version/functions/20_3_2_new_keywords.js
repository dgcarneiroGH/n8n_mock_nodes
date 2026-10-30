const fs = require("fs");

// ============================================================================
// BLOCK 1: REUSABLE LOGIC (VALID FOR N8N AND NODE.JS)
// ============================================================================
//#region Node Logic

/**
 * Main function to build the HTML alert mail for new keywords pending review.
 * @param {Array<Object>} items - The array of new keyword objects.
 * @returns {Array<Object>} An array containing the final HTML content object and the keyword count, or an empty array if there are no items.
 */
function buildKeywordsAlertHtml(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const keywordCount = items.length;
  const countHtml = renderKeywordCount(keywordCount);
  const buttonHtml = renderCtaButton();
  const htmlContent = getHtmlTemplate(countHtml, buttonHtml);

  return [{
    htmlContent,
    keywordCount
  }];
}

/**
 * Renders the dashed highlight box with the count of keywords pending review.
 * @param {number} count - The number of keywords pending review.
 * @returns {string} The HTML string for the count box row.
 */
function renderKeywordCount(count) {
  return `
    <tr>
      <td style="padding-bottom: 35px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(41, 182, 246, 0.08); border: 2px dashed #29b6f6; border-radius: 12px;">
          <tr>
            <td style="padding: 15px">
              <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 13px; color: #0f3254; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">🔢 KEYWORDS PENDIENTES DE REVISIÓN:</p>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #24292e;">
                ${count}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Renders the centered CTA button row pointing to the Tags-SEO Notion page.
 * @returns {string} The HTML string for the button row.
 */
function renderCtaButton() {
  return `
    <tr>
      <td align="center" style="padding-bottom: 35px">
        <a href="https://app.notion.com/p/Tags-SEO-3f283f947b2c804a9ff6e5080b19cb9c?source=copy_link" target="_blank" style="display: inline-block; background-color: #ffa726; color: #0f3254; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 25px; border-radius: 6px; margin-bottom: 10px; border: 2px solid #0f3254;">Ver en Notion</a>
      </td>
    </tr>
  `;
}

/**
 * Returns the full HTML document template.
 * @param {string} countHtml - The HTML string of the keyword count row.
 * @param {string} buttonHtml - The HTML string of the CTA button row.
 * @returns {string} The complete HTML document.
 */
function getHtmlTemplate(countHtml, buttonHtml) {
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
                Nuevos keywords pendientes de revisión
              </td>
            </tr>
            ${countHtml}
            ${buttonHtml}
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
  const items = $input.all().map(item => item.json);
  return buildKeywordsAlertHtml(items);
}
// ============================================================================
// END OF N8N BLOCK
// ============================================================================


// ============================================================================
// BLOCK 3: LOCAL SANDBOX (DO NOT COPY INTO N8N)
// ============================================================================
if (require.main === module) {
  let newKeywords;
  try {
    // Attempt to load real data for testing
    newKeywords = JSON.parse(
      fs.readFileSync("../results/getters/add_keywords.json", "utf8"),
    );
    console.log("✅ Loaded data from add_keywords.json");
  } catch (error) {
    // Fallback to default data if the file doesn't exist
    console.log("⚠️ Could not load from file. Using default test data.");
    newKeywords = [
      {
        id: "3f283f94-7b2c-804a-9ff6-e5080b19cb9c",
        name: "keyword de prueba",
        url: "https://app.notion.com/p/Tags-SEO-3f283f947b2c804a9ff6e5080b19cb9c",
        property_estado: "En Observación",
      },
    ];
  }

  const results = buildKeywordsAlertHtml(newKeywords);

  if (results.length > 0) {
    const htmlOutput = results[0].htmlContent;
    const outputDir = "../templates";
    const outputPath = `${outputDir}/new-keywords-mail.html`;

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, htmlOutput, "utf8");
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Successfully generated ${outputPath}`);
    console.log(`📤 Simulation: ${results[0].keywordCount} new keywords pending review.`);
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ No items met the criteria to generate HTML.");
  }
}
// ============================================================================
// END OF LOCAL SANDBOX
// ============================================================================
