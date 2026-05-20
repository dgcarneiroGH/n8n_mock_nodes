const fs = require("fs");

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// ============================================================================
const jobsRaw = [
  {
    "id_trabajo": "4212795",
    "titulo": "Systems Digitisation Consultancy",
    "empresa": "DT Global",
    "url": "https://reliefweb.int/node/4212795",
    "fecha_publicacion": "2026-05-20T04:00:45+00:00",
  },
  {
    "id_trabajo": "4212689",
    "titulo":
      "Call for External Collaborator –Framework Design for the Electronic Case Management System (ECMS) for Labour and Occupational Safety and Health (OSH)",
    "empresa": "International Labour Organization",
    "url": "https://reliefweb.int/node/4212689",
    "fecha_publicacion": "2026-05-19T11:02:59+00:00",
  },
  {
    "id_trabajo": "4212441",
    "titulo": "Head of Programmes, Ukraine",
    "empresa": "People in Peril",
    "url": "https://reliefweb.int/node/4212441",
    "fecha_publicacion": "2026-05-18T11:36:43+00:00",
  },
  {
    "id_trabajo": "4212428",
    "titulo":
      "Multisectoral Aid (Health, Nutrition & WASH) for conflict- and climate-affected refugees, IDPs, returnees & host communities in the Sudan Crisis",
    "empresa": "Humedica",
    "url": "https://reliefweb.int/node/4212428",
    "fecha_publicacion": "2026-05-18T11:34:26+00:00",
  },
  {
    "id_trabajo": "4212408",
    "titulo": "CONSULTANT SERVICES REQUEST FOR A NETWORK GOVERNANCE REVIEW",
    "empresa": "Action contre la Faim France",
    "url": "https://reliefweb.int/node/4212408",
    "fecha_publicacion": "2026-05-18T11:31:30+00:00",
  },
  {
    "id_trabajo": "4212361",
    "titulo": "Call for Applications: External Evaluation Consultant",
    "empresa": "EarthRights International",
    "url": "https://reliefweb.int/node/4212361",
    "fecha_publicacion": "2026-05-18T11:23:45+00:00",
  },
  {
    "id_trabajo": "4212264",
    "titulo":
      "Consultant: SHE SOARS Knowledge & Learning Products Documentation",
    "empresa": "Center for Reproductive Rights",
    "url": "https://reliefweb.int/node/4212264",
    "fecha_publicacion": "2026-05-18T09:50:21+00:00",
  },
  {
    "id_trabajo": "4212215",
    "titulo":
      "Research for FCDO Partnership for learning for all in Nigeria Plane II project - Re-Advertized",
    "empresa": "Plan International",
    "url": "https://reliefweb.int/node/4212215",
    "fecha_publicacion": "2026-05-17T23:16:26+00:00",
  },
  {
    "id_trabajo": "4212169",
    "titulo":
      "Consultancy services to support the Development of Management Plans and bylaws for Collaboratives Management Areas (CMAs) within North-East Unguja Sea",
    "empresa": "International Union for Conservation of Nature",
    "url": "https://reliefweb.int/node/4212169",
    "fecha_publicacion": "2026-05-17T23:15:44+00:00",
  },
  {
    "id_trabajo": "4212159",
    "titulo":
      "Consultancy services to support the Development of Management Plans and bylaws for Collaboratives Fisheries Management Areas (CFMAs) within Mtwara Sea",
    "empresa": "International Union for Conservation of Nature",
    "url": "https://reliefweb.int/node/4212159",
    "fecha_publicacion": "2026-05-17T23:15:27+00:00",
  },
  {
    "id_trabajo": "4212011",
    "titulo": "Consultant – Website Optimization and Content Migration",
    "empresa": "The BOMA Project",
    "url": "https://reliefweb.int/node/4212011",
    "fecha_publicacion": "2026-05-15T13:00:38+00:00",
  },
  {
    "id_trabajo": "4212029",
    "titulo": "MCC Data Quality Review Subject Matter Expert (Mid, Senior)",
    "empresa": "SoCha LLC",
    "url": "https://reliefweb.int/node/4212029",
    "fecha_publicacion": "2026-05-14T10:42:49+00:00",
  },
  {
    "id_trabajo": "4211875",
    "titulo": "Senior Full Stack Developer (Remote Consultancy)",
    "empresa": "Syria Justice and Accountability Centre",
    "url": "https://reliefweb.int/node/4211875",
    "fecha_publicacion": "2026-05-13T13:45:20+00:00",
  },
  {
    "id_trabajo": "4211717",
    "titulo": "Regional Disaster Risk Financing Specialist CST II",
    "empresa": "World Food Programme",
    "url": "https://reliefweb.int/node/4211717",
    "fecha_publicacion": "2026-05-13T13:25:16+00:00",
  },
  {
    "id_trabajo": "4211799",
    "titulo":
      "Third-Party Evaluation – Syria and Türkiye Humanitarian Response",
    "empresa": "ActionAid",
    "url": "https://reliefweb.int/node/4211799",
    "fecha_publicacion": "2026-05-13T08:43:24+00:00",
  },
  {
    "id_trabajo": "4211646",
    "titulo": "Business Development and Marketing Consultant",
    "empresa": "Farm Radio International",
    "url": "https://reliefweb.int/node/4211646",
    "fecha_publicacion": "2026-05-12T13:28:02+00:00",
  },
  {
    "id_trabajo": "4211605",
    "titulo":
      "External Evaluation Consultancy – Palestine Humanitarian Response Programme",
    "empresa": "SOS Children's Villages International",
    "url": "https://reliefweb.int/node/4211605",
    "fecha_publicacion": "2026-05-12T13:25:24+00:00",
  },
  {
    "id_trabajo": "4211579",
    "titulo": "Regional Consultant Lebanon / Syria (Advisory & Mapping)",
    "empresa": "Humedica",
    "url": "https://reliefweb.int/node/4211579",
    "fecha_publicacion": "2026-05-12T13:24:14+00:00",
  },
  {
    "id_trabajo": "4211559",
    "titulo": "International Administrative and HR Specialist",
    "empresa": "Food and Agriculture Organization of the United Nations",
    "url": "https://reliefweb.int/node/4211559",
    "fecha_publicacion": "2026-05-12T13:21:53+00:00",
  },
  {
    "id_trabajo": "4211626",
    "titulo": "Consultant-Instructional Designer LEARN - (4741)",
    "empresa": "International Medical Corps",
    "url": "https://reliefweb.int/node/4211626",
    "fecha_publicacion": "2026-05-12T11:48:46+00:00",
  },
];

// Simulamos la entrada de n8n
const $input = {
  all: () => jobsRaw.map((item) => ({ json: item })),
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
  fs.writeFileSync("templates/build_html.html", htmlParaTest, "utf8");

  console.log(
    "\x1b[32m%s\x1b[0m",
    '✅ Archivo "templates/build_html.html" generado. Ábrelo en tu navegador.',
  );
  console.log(
    `📤 Simulación: Se enviaría un correo a ${itemsFinales[0].emailTo} con ${itemsFinales[0].total_jobs} ofertas.`,
  );
} else {
  console.log("\x1b[33m%s\x1b[0m", "⚠️ Ningún trabajo procesado.");
}
