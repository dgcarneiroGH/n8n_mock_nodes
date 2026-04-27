const fs = require("fs");

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// ============================================================================
let buildMailInfoRaw;
try {
  // Intenta leer tu archivo local con los datos reales
  buildMailInfoRaw = JSON.parse(
    fs.readFileSync("./results/build_mail_info.json", "utf8"),
  );
  console.log("✅ Datos cargados desde ./results/build_mail_info.json");
} catch (error) {
  console.log(
    "⚠️ No se encontró el archivo JSON. Usando datos de prueba por defecto.",
  );
  // Datos de respaldo para que el entorno local siempre funcione
  buildMailInfoRaw = [
    {
      "client": {
        "id": "123",
        "name": "María Casado",
        "email": "test@test.com",
      },
      "grants": [
        {
          "code": "897213",
          "title": "Resolución de prueba para entorno local",
          "agency": "INSTITUTO DE PRUEBAS",
          "url": "https://boe.es",
          "dates": { "startDate": "2026-04-10", "endDate": "2026-05-08" },
          "description":
            "Esta es una subvención simulada para que puedas ver el diseño.",
          "requirements": ["Requisito 1", "Requisito 2"],
        },
      ],
    },
  ];
}

// Simulamos la entrada de n8n
const $input = {
  all: () => buildMailInfoRaw.map((item) => ({ json: item })),
};

// ============================================================================
// BLOQUE 2: CÓDIGO N8N REAL (CÓPIA DESDE AQUÍ HASTA EL FINAL DEL BLOQUE)
// ============================================================================
function codigoN8n() {
  // Función para formatear fecha a DD/MM/YYYY
  const formatDate = (d) => {
    if (!d) return "No definido";
    const date = new Date(d);
    if (isNaN(date)) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Renderiza una subvención
  const grantHTML = (g) => `
    <tr><td style="padding-bottom:35px;">
      <table border="0" width="100%" style="background-color:transparent; border:3px solid #0f3254; border-bottom:8px solid #0f3254; border-radius:16px;">
        <tr><td style="padding:20px 25px 0 25px;">
          <span style="display:inline-block; background-color:#29b6f6; color:#0f3254; font-family:'Space Grotesk',Arial,sans-serif; font-weight:700; font-size:11px; padding:5px 12px; border-radius:20px; border:2px solid #0f3254; text-transform:uppercase;">
            ${g.agency || "Agencia no especificada"}
          </span>
        </td></tr>
        <tr><td style="padding:15px 25px 25px 25px;">
          <h2 style="font-family:'Space Grotesk',Arial,sans-serif; color:#0f3254; font-size:20px; line-height:1.3; margin:0 0 10px 0;">${g.title || "Título no disponible"}</h2>
          <p style="font-family:'Space Grotesk',Arial,sans-serif; font-size:14px; color:#115f51; font-weight:700; margin:0 0 15px 0;">▶ INICIO: ${formatDate(g.startDate || g.dates?.startDate)} &nbsp;&nbsp; 🛑 FIN: ${formatDate(g.endDate || g.dates?.endDate)}</p>
          <p style="font-family:'Inter',Arial,sans-serif; font-size:15px; line-height:1.6; color:#24292e; margin:0 0 20px 0;">${g.description || "Sin descripción disponible."}</p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(41,182,246,0.1); border:2px dashed #0f3254; border-radius:12px; margin-bottom:25px;">
            <tr><td style="padding:15px;">
              <p style="font-family:'Space Grotesk',Arial,sans-serif; font-size:13px; color:#0f3254; font-weight:700; margin:0 0 10px 0;">REQUISITOS:</p>
              <ul style="margin:0; padding-left:20px; font-family:'Inter',Arial,sans-serif; font-size:13px; line-height:1.5; color:#24292e;">
                ${g.requirements && g.requirements.length ? g.requirements.map((r) => `<li style='margin-bottom:5px;'>${r}</li>`).join("") : '<li style="margin-bottom:5px;">No se han especificado requisitos concretos.</li>'}
              </ul>
            </td></tr>
          </table>
          <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="${g.url || "#"}" target="_blank" style="display:inline-block; background-color:#ffa726; color:#0f3254; font-family:'Space Grotesk',Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:12px 25px; border-radius:6px; margin-bottom:10px; border:2px solid #0f3254;">Ver Convocatoria Oficial</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  `;

  // Procesa los datos y genera el HTML
  return $input
    .all()
    .filter((item) => (item.json.grants || []).length > 0)
    .map((item) => {
      const c = item.json.client;
      const grantsHTML = item.json.grants.map(grantHTML).join("");
      const htmlContent = `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nuevas Subvenciones | Nomacoda</title>
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
                    NUEVAS SUBVENCIONES DISPONIBLES
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px; font-family: 'Inter', Arial, sans-serif; color: #0f3254;">
                <strong>${c.name}</strong>, he mapeado el terreno. <br>
                Estas son las convocatorias clave que he encontrado para tu proyecto:
              </td>
            </tr>
            ${grantsHTML}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
      return {
        emailTo: c.email,
        clientName: c.name,
        htmlContent,
      };
    });
}
// ============================================================================
// FIN DEL BLOQUE 2
// (AL COPIAR A N8N, IGNORA "function codigoN8n() {" Y LA LLAVE FINAL "}")
// ============================================================================

// ============================================================================
// BLOQUE 3: EJECUCIÓN Y GENERACIÓN DEL HTML (NO COPIAR EN N8N)
// ============================================================================
const itemsFinales = codigoN8n();

if (itemsFinales.length > 0) {
  // En tu entorno local el JSON devuelve { json: { htmlContent, emailTo } }
  const htmlParaTest = itemsFinales[0].json.htmlContent;

  // Guardamos en la misma carpeta para evitar errores de rutas si "templates/" no existe
  fs.writeFileSync("templates/grant-mail.html", htmlParaTest, "utf8");
  console.log(
    "\x1b[32m%s\x1b[0m",
    '✅ Archivo "grant-mail.html" generado. Ábrelo en tu navegador.',
  );
  console.log(
    `📤 Simulación: Se enviaría un correo a ${itemsFinales[0].json.emailTo}`,
  );
} else {
  console.log(
    "\x1b[33m%s\x1b[0m",
    "⚠️ Ningún cliente pasó el filtro (el array de subvenciones estaba vacío).",
  );
}
