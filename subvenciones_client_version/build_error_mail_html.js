// ========================
// FUNCIONES REUTILIZABLES (válidas para N8N y Node.js)
// ========================
function buildErrorMail(items) {
  return items
    .filter((item) => (item.errorsDetected || []).length > 0)
    .map((item) => {
      const errors = item.errorsDetected;
      const errorsHTML = errors.map(renderErrorCard).join("");
      const htmlContent = getHtml(errorsHTML);
      return {
        htmlContent,
        alertType: "Campos Faltantes",
        errorCount: errors.length,
      };
    });
}

function renderErrorCard(err) {
  return `
    <tr>
      <td style="padding-bottom: 35px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent; border: 3px solid #0f3254; border-bottom: 8px solid #0f3254; border-radius: 16px;">
          <tr>
            <td style="padding: 20px 25px 0 25px">
              <span style="display: inline-block; background-color: #ffa726; color: #0f3254; font-family: 'Space Grotesk', Arial, sans-serif; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 20px; border: 2px solid #0f3254; text-transform: uppercase;">
                AFECTA A: ${err.client || "CLIENTE DESCONOCIDO"}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 25px 25px 25px">
              <h2 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #0f3254; font-size: 18px; line-height: 1.3; margin: 0 0 10px 0;">
                ${err.grant_title || "Título no disponible"}
              </h2>
              <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 14px; color: #115f51; font-weight: 700; margin: 0 0 20px 0;">
                ▶ CÓDIGO REF: ${err.grant_code || "N/A"}
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(217, 83, 79, 0.08); border: 2px dashed #d9534f; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px">
                    <p style="font-family: 'Space Grotesk', Arial, sans-serif; font-size: 13px; color: #d9534f; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">⚠️ DATOS NO ENCONTRADOS:</p>
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #24292e;">
                      ${err.missing_fields || "Desconocido"}
                    </p>
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

function getHtml(errorsHTML) {
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
                    🚨 ALERTA: CAMPOS FALTANTES
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                El sistema de scraping ha detectado anomalías. <br />
                Las siguientes subvenciones se han extraído con campos incompletos y requieren revisión manual:
              </td>
            </tr>
            ${errorsHTML}
            <tr>
              <td align="center" style="padding-top: 20px">
                <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #a0bbd8; margin: 0;">
                  <strong>Nomacoda System</strong> // Log de Automatizaciones
                </p>
              </td>
            </tr>
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
  return buildErrorMail($input.all().map((item) => item.json || item));
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
  const buildAlertInfoRaw = [
    {
      errorsDetected: [
        {
          client: "María Casado",
          grant_code: "897213",
          grant_title:
            "Resolución del organismo autónomo Instituto de la Juventud, por la que se convoca el Certamen Nacional de Jóvenes Emprendedores para el año 2026.",
          missing_fields: "boeText, dates.publicationDate",
        },
        {
          client: "Diego Carneiro",
          grant_code: "821006",
          grant_title:
            "Resolución de 7 de mayo de 2025, de la Secretaria de Estado de Agricultura y Alimentación, por la que se convocan subvenciones por concesión directa a las explotaciones agrarias de titularidad compartida, para el ejercicio 2025",
          missing_fields: "dates.endDate",
        },
      ],
    },
  ];
  const items = buildAlertInfoRaw;
  const results = buildErrorMail(items);
  if (results.length > 0) {
    const htmlParaTest = results[0].htmlContent;
    if (!fs.existsSync("templates")) fs.mkdirSync("templates");
    fs.writeFileSync("templates/error-mail.html", htmlParaTest, "utf8");
    console.log(
      "\x1b[32m%s\x1b[0m",
      '✅ Archivo "templates/error-mail.html" generado. Ábrelo en tu navegador.',
    );
    console.log(
      `📤 Simulación: Se detectaron ${results[0].errorCount} errores para reportar.`,
    );
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ No hay errores para reportar.");
  }
}
