const fs = require("fs");

let formatNagerDatesRaw, loopSubvencionesRaw;

try {
  formatNagerDatesRaw = JSON.parse(
    fs.readFileSync("./results/format_nager_dates.json", "utf8"),
  );
  loopSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/loop_subvenciones.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const formatNagerDates = formatNagerDatesRaw;
const loopSubvenciones = loopSubvencionesRaw;

//#region Node Logic
// Función auxiliar: Comprueba si una fecha es fin de semana o festivo
function esDiaInhabil(fechaStr) {
  // TODO:Hay un caso de uso que da error, revisa 897944
  if (fechaStr === "2026-05-1") {
    console.log({ fechaStr });
    console.log(formatNagerDates.includes(fechaStr));
  }

  const fecha = new Date(fechaStr);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

  if (diaSemana === 0 || diaSemana === 6) return true;
  if (formatNagerDates.includes(fechaStr)) return true;

  return false;
}

// Función auxiliar: Suma X días hábiles a una fecha base
function sumarDiasHabiles(fechaBase, diasASumar) {
  let fecha = new Date(fechaBase);
  let diasSumados = 0;

  while (diasSumados < diasASumar) {
    fecha.setDate(fecha.getDate() + 1);
    const fechaFormateada = fecha.toISOString().split("T")[0];

    if (!esDiaInhabil(fechaFormateada)) {
      diasSumados++;
    }
  }
  return fecha.toISOString().split("T")[0];
}

// 2. LÓGICA PRINCIPAL DEL NODO
for (const item of loopSubvenciones) {
  const fechaPublicacion = item.fechaRecepcion;

  // A. CÁLCULO FECHA INICIO
  if (item.fechaInicioSolicitud) {
    // Vía rápida: El dato duro ya existe
    item.fecha_inicio_calculada = item.fechaInicioSolicitud;
  } else {
    // Vía de cálculo: Evaluamos el texto
    const textoInicio = item.textInicio || "";
    if (
      textoInicio.toLowerCase().includes("día siguiente") &&
      fechaPublicacion
    ) {
      item.fecha_inicio_calculada = sumarDiasHabiles(fechaPublicacion, 1);
    } else {
      item.fecha_inicio_calculada = null;
    }
  }

  // B. CÁLCULO FECHA FIN
  if (item.fechaFinSolicitud) {
    // Vía rápida: El dato duro ya existe
    item.fecha_fin_calculada = item.fechaFinSolicitud;
  } else {
    // Vía de cálculo: Evaluamos el texto
    const textoFin = item.textFin || "";
    const regexDias = /(\d+)\s*días?\s*hábiles/i;
    const matchFin = textoFin.match(regexDias);

    if (matchFin && matchFin[1] && fechaPublicacion) {
      const numeroDeDias = parseInt(matchFin[1], 10);
      item.fecha_fin_calculada = sumarDiasHabiles(
        fechaPublicacion,
        numeroDeDias,
      );
    } else {
      item.fecha_fin_calculada = null;
    }
  }
}

const result = loopSubvenciones.map((subvencion) => ({
  code: subvencion.codigoBDNS,
  fecha_inicio_calculada: subvencion.fecha_inicio_calculada,
  fecha_fin_calculada: subvencion.fecha_fin_calculada,
}));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/calc_grant_start_end_dates.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
