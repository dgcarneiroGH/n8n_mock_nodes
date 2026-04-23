return $input
  .all()
  .filter((item) => (item.json.grants || []).length > 0)
  .map((item) => {
    const client = item.json.client;
    const grants = item.json.grants;
    // Mostrar tarjetas en grid de 2 columnas con gradiente
    let tarjetasHTML =
      '<tr><td colspan="2"><table class="grant-grid" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:20px 0;"><tr>';
    grants.forEach((grant, idx) => {
      const requisitos = (grant.requirements || []).length
        ? grant.requirements
            .map((req) => `<li style='margin-bottom:5px'>${req}</li>`)
            .join("")
        : "<li>No se han especificado requisitos concretos.</li>";
      tarjetasHTML += `
        <td style="width:50%;vertical-align:top;">
          <div style="background:linear-gradient(135deg,#0f3254 0%,#115f51 100%);border:1px solid #29b6f6;border-radius:8px;padding:20px;min-height:100px;">
            <div style='font-size:12px;color:#29b6f6;font-weight:bold;text-transform:uppercase;margin-bottom:10px;'>${grant.agency || "Agencia no especificada"}</div>
            <h2 style='font-family:Inter,Arial,sans-serif;font-size:18px;font-weight:700;color:#f0f4f8;margin-top:0;margin-bottom:10px;line-height:1.3;'>${grant.title || "Título no disponible"}</h2>
            <div style='font-size:14px;color:#ffa726;margin-bottom:15px;font-family:Inter,Arial,sans-serif;'>
              📅 Inicio: ${grant.startDate || "No definido"} | ⏳ Fin: ${grant.endDate || "No definido"}
            </div>
            <p style='font-size:14px;color:#a0bbd8;line-height:1.5;margin-bottom:20px;'>${grant.description || "Sin descripción disponible."}</p>
            <div style='background-color:#081b2e;padding:15px;border-radius:6px;margin-bottom:20px;'>
              <p style='font-size:13px;color:#f0f4f8;font-weight:bold;text-transform:uppercase;margin-top:0;margin-bottom:10px;'>Requisitos Clave:</p>
              <ul style='margin:0;padding-left:20px;font-size:13px;color:#a0bbd8;'>${requisitos}</ul>
            </div>
            <a href='${grant.url || "#"}' target='_blank' style='display:inline-block;background-color:#ffa726;color:#0a2540;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:12px 25px;border-radius:6px;text-align:center;max-width:250px;'>Ver Convocatoria Oficial</a>
          </div>
        </td>
      `;
      if (idx % 2 === 1 && idx !== grants.length - 1)
        tarjetasHTML += "</tr><tr>";
    });
    tarjetasHTML += "</tr></table></td></tr>";
    const htmlContent = `
      <!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tus Subvenciones | Nomacoda</title>
    <style>
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        border-collapse: collapse;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        font-family: Inter, Arial, sans-serif;
        color: #0f3254;
      }
        .container {
          width: 100%;
          margin: 0;
      }
      .header {
        padding: 30px 20px;
        text-align: center;
        border-bottom: 2px solid #115f51;
      }
      .header-title {
        font-family: Inter, Arial, sans-serif;
        color: #ffa726;
        margin: 0;
        font-size: 24px;
      }
      .header-desc {
        color: #a0bbd8;
        font-size: 14px;
        margin-top: 5px;
        margin-bottom: 0;
      }
      .greeting {
        padding: 30px 20px 10px 20px;
        font-size: 16px;
        color: #0f3254;
      }
      .footer {
        text-align: center;
        padding: 30px 20px;
        font-size: 12px;
        color: #a0bbd8;
      }
    </style>
  </head>
  <body>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table
            class="container"
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
          >
            <tr>
              <td class="header">
                <h1 class="header-title">Monitor de Subvenciones</h1>
                <p class="header-desc">// Nomacoda Workflows</p>
              </td>
            </tr>
            <tr>
              <td class="greeting">
                Hola <strong>${client.name}</strong>,<br /><br />
                Hemos detectado nuevas convocatorias de subvenciones que encajan
                con tu perfil. Aquí tienes los detalles:
              </td>
            </tr>
            ${tarjetasHTML}
            <tr>
              <td class="footer">
                Este es un correo automático generado por Nomacoda.<br />
                Si tienes dudas sobre alguna convocatoria, responde a este
                correo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
    return {
      json: {
        emailTo: client.email,
        clientName: client.name,
        htmlContent,
      },
    };
  });
