const fs = require("fs");

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// Aquí metemos tus datos y creamos el objeto $input que n8n usa nativamente.
// ============================================================================
let buildMailInfoRaw;
try {
  buildMailInfoRaw = JSON.parse(
    fs.readFileSync("./results/build_mail_info.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

const datosPrueba = buildMailInfoRaw;

// Simulamos la función de n8n que devuelve el array de items envueltos en "json"
const $input = {
  all: () => datosPrueba.map((item) => ({ json: item })),
};

// ============================================================================
// BLOQUE 2: CÓDIGO N8N REAL (CÓPIA DESDE AQUÍ HASTA EL FINAL DEL BLOQUE)
// Asegúrate de que el Mode del nodo Code está en "Run Once for All Items"
// ============================================================================
// ================= FUNCIONES AUXILIARES DE GENERACIÓN HTML =================

function formatDateDMY(dateStr) {
  if (!dateStr) return "No definido";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function renderGrantRequirements(requirements) {
  if (!requirements || requirements.length === 0) {
    return "<li>No se han especificado requisitos concretos.</li>";
  }
  return requirements
    .map((req) => `<li style='margin-bottom:5px'>${req}</li>`)
    .join("");
}

function renderGrantCard(grant) {
  return `
    <td style="vertical-align: top; width: 50%; padding: 12px 10px 18px 10px; height: 100%;">
      <div
        style="
          background: linear-gradient(135deg, #0f3254 0%, #115f51 100%);
          border: 1px solid #ffa726;
          border-radius: 8px;
          padding: 20px;
          min-height: 320px;
          height: 100%;
          box-sizing: border-box;
          margin: 0;
          box-shadow: 0 2px 8px 0 rgba(15,50,84,0.07);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        "
      >
        <div
          style="
            font-size: 12px;
            color: #29b6f6;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
          "
        >
          ${grant.agency || "Agencia no especificada"}
        </div>
        <h2
          style="
            font-family: Inter, Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #f0f4f8;
            margin-top: 0;
            margin-bottom: 10px;
            line-height: 1.3;
          "
        >
          ${grant.title || "Título no disponible"}
        </h2>
        <div
          style="
            font-size: 14px;
            color: #ffa726;
            margin-bottom: 15px;
            font-family: Inter, Arial, sans-serif;
          "
        >
          📅 Inicio: ${formatDateDMY(grant.startDate || grant.dates?.startDate)} | ⏳ Fin: ${formatDateDMY(grant.endDate || grant.dates?.endDate)}
        </div>
        <p
          style="
            font-size: 14px;
            color: #a0bbd8;
            line-height: 1.5;
            margin-bottom: 20px;
          "
        >
          ${grant.description || "Sin descripción disponible."}
        </p>
        <div
          style="
            background-color: #081b2e;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          "
        >
          <p
            style="
              font-size: 13px;
              color: #f0f4f8;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 0;
              margin-bottom: 10px;
            "
          >
            Requisitos Clave:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #a0bbd8">
            ${renderGrantRequirements(grant.requirements)}
          </ul>
        </div>
        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
          <a
            href='${grant.url || "#"}'
            target="_blank"
            style="
              display: inline-block;
              background-color: #ffa726;
              color: #0a2540;
              font-family: Inter, Arial, sans-serif;
              font-size: 15px;
              font-weight: 700;
              text-decoration: none;
              padding: 12px 25px;
              border-radius: 6px;
              text-align: center;
              max-width: 250px;
            "
          >Ver Convocatoria Oficial</a>
          <a
            href="#"
            style="
              color: #d9534f;
              font-size: 15px;
              font-family: Inter, Arial, sans-serif;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
              text-decoration: none;
            "
            onClick="return false;"
          >
            <span style="font-size:1.1em;vertical-align:middle;">&#9888;&#65039;</span> No me interesa
          </a>
        </div>
      </div>
    </td>
  `;
}

function renderGrantGrid(grants) {
  let html = '<div class="grant-grid">';
  for (let i = 0; i < grants.length; i++) {
    html += renderGrantCard(grants[i]);
  }
  html += "</div>";
  return html;
}

function codigoN8n() {
  return $input
    .all()
    .filter((item) => (item.json.grants || []).length > 0)
    .map((item) => {
      const client = item.json.client;
      const grants = item.json.grants;

      const tarjetasHTML = renderGrantGrid(grants);

      const htmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tus Subvenciones | Nomacoda</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { border-collapse: collapse; }
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        font-family: Inter, Arial, sans-serif;
        color: #0f3254;
        background: radial-gradient(circle, #0f3254 0%, #f6f8fa 100%);
      }
      .container { width: 100%; max-width: 800px; margin: 0 auto; }
      .grant-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px 20px;
        margin: 0;
        align-items: stretch;
      }
      .grant-card {
        background: linear-gradient(135deg, #0f3254 0%, #115f51 100%);
        border: 1px solid #ffa726;
        border-radius: 8px;
        padding: 20px;
        min-height: 320px;
        box-sizing: border-box;
        margin: 0;
        box-shadow: 0 2px 8px 0 rgba(15,50,84,0.07);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }
      @media only screen and (max-width: 600px) {
        .grant-grid {
          grid-template-columns: 1fr;
          gap: 20px 0;
        }
      }
      .grant-agency {
        font-size: 12px;
        color: #29b6f6;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .grant-title {
        font-family: Inter, Arial, sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #f0f4f8;
        margin-top: 0;
        margin-bottom: 10px;
        line-height: 1.3;
      }
      .grant-dates {
        font-size: 14px;
        color: #ffa726;
        margin-bottom: 15px;
        font-family: Inter, Arial, sans-serif;
      }
      .grant-desc {
        font-size: 14px;
        color: #a0bbd8;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .grant-req-box {
        background-color: #081b2e;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 20px;
      }
      .grant-req-title {
        font-size: 13px;
        color: #f0f4f8;
        font-weight: bold;
        text-transform: uppercase;
        margin-top: 0;
        margin-bottom: 10px;
      }
      .grant-req-list {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: #a0bbd8;
      }
      .grant-link {
        display: inline-block;
        background-color: #ffa726;
        color: #0a2540;
        font-family: Inter, Arial, sans-serif;
        font-size: 15px;
        font-weight: 700;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 6px;
        text-align: center;
        max-width: 250px;
        margin-top: auto;
      }
      .greeting {
        padding: 30px 20px 10px 20px;
        font-size: 16px;
        color: #0f3254;
        text-align: center;
      }
      .footer {
        text-align: center;
        padding: 30px 20px;
        font-size: 12px;
        color: #0f3254;
      }
      .header { padding: 30px 20px; text-align: center; border-bottom: 2px solid #115f51; }
      .header-title { font-family: Inter, Arial, sans-serif; color: #ffa726; margin: 0; font-size: 24px; }
      .header-desc { color: #a0bbd8; font-size: 14px; margin-top: 5px; margin-bottom: 0; }
      .greeting { padding: 30px 20px 10px 20px; font-size: 16px; color: #0f3254; }
      .greeting strong { color: #ffa726; }
      .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #0f3254; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="header-title">Monitor de Subvenciones</h1>
        <p class="header-desc">// Nomacoda Workflows</p>
      </div>
      <div class="greeting">
        Hola <strong>${client.name}</strong>,<br /><br />
        Hemos detectado nuevas convocatorias de subvenciones que encajan con tu perfil.<br />
        Aquí tienes los detalles:
      </div>
      ${tarjetasHTML}
      <div class="footer">
        Este es un correo automático generado por Nomacoda.<br />
        Si tienes dudas sobre alguna convocatoria, responde a este correo.
      </div>
    </div>
  </body>
</html>`;

      // Formato estricto para n8n: devolver siempre { json: { datos } }
      return {
        emailTo: client.email,
        clientName: client.name,
        htmlContent: htmlContent,
      };
    });
}
// ============================================================================
// FIN DEL BLOQUE 2 (HASTA AQUÍ COPIAS EN N8N)
// En n8n, simplemente quita la línea "function codigoN8n() {" del principio
// y la llave de cierre "}" del final, o copia solo lo de dentro de la función.
// ============================================================================

// ============================================================================
// BLOQUE 3: EJECUCIÓN Y GENERACIÓN DEL HTML (NO COPIAR)
// ============================================================================
const itemsFinales = codigoN8n();

if (itemsFinales.length > 0) {
  // Extraemos el HTML del primer cliente (María Casado) para la prueba local
  const htmlParaTest = itemsFinales[0].htmlContent;

  fs.writeFileSync("templates/grant-mail.html", htmlParaTest, "utf8");
  console.log("\x1b[32m%s\x1b[0m", '✅ Archivo "grant-mail.html" generado.');
  console.log(`📤 Simulación: Se enviaría a ${itemsFinales[0].emailTo}`);
} else {
  console.log(
    "\x1b[33m%s\x1b[0m",
    "⚠️ Ningún cliente pasó el filtro (sin subvenciones).",
  );
}
