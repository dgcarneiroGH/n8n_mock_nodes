const fs = require("fs");

const RESULT_FILE_ROUTE = "../files/templates";
const RESULT_FILE_NAME = "build_html.html";

let filterAndFormatRaw;
try {
  filterAndFormatRaw = JSON.parse(
    fs.readFileSync("../files/responses/filter_and_format.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// ============================================================================
const jobs = filterAndFormatRaw;

// Simulamos la entrada de n8n
const $input = {
  all: () => jobs.map((item) => ({ json: item })),
};

// ============================================================================
// BLOQUE 2: CÓDIGO N8N REAL (CÓPIA DESDE AQUÍ HASTA EL FINAL DEL BLOQUE)
// ============================================================================
function codigoN8n() {
  const jobs = $input.all().map((item) => item.json);

  // Si no hay trabajos, no generamos nada
  if (jobs.length === 0) return [];

  // Función para formatear fecha a DD/MM/YYYY
  const formatDate = (d) => {
    if (!d) return "No definido";
    const date = new Date(d);
    if (isNaN(date)) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Renderiza una tarjeta de trabajo
  const jobHTML = (j) => `
    <tr><td style="padding-bottom:35px;">
      <table border="0" width="100%" style="background-color:transparent; border:3px solid #0f3254; border-bottom:8px solid #0f3254; border-radius:16px;">
        <tr><td style="padding:20px 25px 0 25px;">
          <span style="display:inline-block; background-color:#29b6f6; color:#0f3254; font-family:'Space Grotesk',Arial,sans-serif; font-weight:700; font-size:11px; padding:5px 12px; border-radius:20px; border:2px solid #0f3254; text-transform:uppercase;">
            ${j.empresa || "Empresa no especificada"}
          </span>
        </td></tr>
        <tr><td style="padding:15px 25px 25px 25px;">
          <h2 style="font-family:'Space Grotesk',Arial,sans-serif; color:#0f3254; font-size:20px; line-height:1.3; margin:0 0 10px 0;">${j.titulo || "Título no disponible"}</h2>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(41,182,246,0.1); border:2px dashed #0f3254; border-radius:12px; margin-bottom:20px;">
            <tr><td style="padding:12px 15px;">
              <p style="font-family:'Space Grotesk',Arial,sans-serif; font-size:13px; color:#115f51; font-weight:700; margin:0;">
                ▶ PUBLICADO: <span style="color:#0f3254;">${formatDate(j.fecha_publicacion)}</span>
              </p>
            </td></tr>
          </table>

          <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="${j.url || "#"}" target="_blank" style="display:inline-block; background-color:#ffa726; color:#0f3254; font-family:'Space Grotesk',Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:12px 25px; border-radius:6px; border:2px solid #0f3254;">Ver Oferta Oficial</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  `;

  const jobsListHTML = jobs.map(jobHTML).join("");

  const htmlContent = `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nuevas Ofertas de Trabajo | Nomacoda</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: transparent;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent;">
      <tr>
        <td align="center" style="padding: 40px 15px;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px;">
            <tr>
              <td align="center" style="padding-bottom: 40px;">
                <div style="display: inline-block; background-color: #ffa726; border: 3px solid #0f3254; border-radius: 12px; padding: 15px 30px; box-shadow: 4px 4px 0px #0f3254;">
                  <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #0f3254; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">
                    NUEVAS OFERTAS DE TRABAJO
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                <strong>Nomacoda Admin</strong>, el radar está activo. <br>
                He analizado las plataformas de empleo y he encontrado estas ${jobs.length} nuevas oportunidades que encajan con tu perfil:
              </td>
            </tr>
            ${jobsListHTML}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // Retornamos el item para n8n
  return [
    {
      htmlContent,
      total_jobs: jobs.length,
      emailTo: "admin@nomacoda.com", // Sustituye por tu email destino
    },
  ];
}
// ============================================================================
// FIN DEL BLOQUE 2
// ============================================================================

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
