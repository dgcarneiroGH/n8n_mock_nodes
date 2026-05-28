// ========================
// FUNCIONES REUTILIZABLES (válidas para N8N y Node.js)
// ========================

function buildErrorMail(items) {
  // El input esperado es un array de objetos, cada uno con un campo 'status' (string)
  // Solo se incluyen los objetos cuyo status es distinto de 'OK'
  const errorItems = items.filter((item) => item.status !== "OK");
  const errorRows = errorItems.map(renderErrorRow).join("");
  const htmlContent = getHtml(errorRows);
  return [{ htmlContent, alertType: "Error en filtros" }];
}

function renderErrorRow(item) {
  // Renderiza una fila de error como en error-mail.html
  return `
    <tr>
      <td style="padding-bottom: 35px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent; border: 3px solid #0f3254; border-bottom: 8px solid #0f3254; border-radius: 16px;">
          <tr>
            <td style="padding: 15px 25px 25px 25px">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(217, 83, 79, 0.08); border: 2px dashed #d9534f; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px">
                    <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 13px; color: #d9534f; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">⚠️ LOG DEL ERROR:</p>
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #24292e;">
                      ${item.status || "Sin información"}
                    </p>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://n8n.nomacoda.com/workflow/hK6AlIIjlmanKEEf" target="_blank" style="display: inline-block; background-color: #29b6f6; color: #0f3254; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 25px; border-radius: 6px; margin-bottom: 10px; border: 2px solid #0f3254;">Revisa el Workflow</a>
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

function getHtml(errorRows) {
  // Plantilla HTML principal, similar a error-mail.html
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alerta de Extracción | Nomacoda Workflows</title>
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
                <div style="display: inline-block; background-color: #d9534f; border: 3px solid #0f3254; border-radius: 12px; padding: 15px 30px; box-shadow: 4px 4px 0px #0f3254;">
                  <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #f0f4f8; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">
                    🚨 ERROR DETECTADO: WORKFLOW SUBVENCIONES
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                El sistema de scraping ha detectado anomalías. <br />
                Se ha detectado un error en los filtros iniciales:
              </td>
            </tr>
            ${errorRows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ========================
// BLOQUE PARA COPIAR EN N8N
// ========================

// Copia SOLO esta línea en tu nodo Code de n8n (modo: Run Once for All Items)
// --------------------------------------------------
if (typeof $input !== "undefined") {
  // 1. Obtenemos los datos de los dos nodos específicos
  const dataRegions = $("Filter Regions1")
    .all()
    .map((item) => item.json);
  const dataBenefactors = $("Filter Benefactors1")
    .all()
    .map((item) => item.json);

  // 2. Unimos ambos arrays y filtramos para dejar solo los que NO tengan status "OK"
  const itemsWithErrors = [...dataRegions, ...dataBenefactors].filter(
    (item) => item.status !== "OK",
  );

  // 3. Pasamos el array resultante a la función (si hay errores)
  return buildErrorMail(itemsWithErrors);
}
// --------------------------------------------------
// FIN DEL BLOQUE PARA N8N
// ========================

// ========================
// SANDBOX LOCAL (NO COPIAR EN N8N)
// ========================
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  const fs = require("fs");
  // Datos de ejemplo
  const filterRegionsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_regions.json", "utf8"),
  );
  const filterBenefactorsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_benefactors.json", "utf8"),
  );

  // Unir ambos arrays y filtrar solo los objetos con status distinto de 'OK'
  const items = [...filterRegionsRaw, ...filterBenefactorsRaw].filter(
    (item) => item.status !== "OK",
  );
  const results = buildErrorMail(items);
  if (results.length > 0) {
    const htmlParaTest = results[0].htmlContent;
    if (!fs.existsSync("templates")) fs.mkdirSync("templates");
    fs.writeFileSync("templates/filter-error-mail.html", htmlParaTest, "utf8");
    console.log(
      "\x1b[32m%s\x1b[0m",
      '✅ Archivo "templates/filter-error-mail.html" generado. Ábrelo en tu navegador.',
    );
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ No hay errores para reportar.");
  }
}
