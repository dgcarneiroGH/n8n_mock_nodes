const fs = require("fs");

let loopSubvencionesRaw, filterSubvencionesRaw;
try {
  loopSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/loop_subvenciones.json", "utf8"),
  );
  filterSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/filter_subvenciones.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const loopSubvenciones = loopSubvencionesRaw;
const filterSubvenciones = filterSubvencionesRaw;

//#region Node Logic

// Simple mapping from beneficiary_type to grantBeneficiaryTypes
const synonymMap = {
  "Asociación": "PERSONAS JURÍDICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA",
  "ONG": "PERSONAS JURÍDICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA",
  "PYME": "PYME Y PERSONAS FÍSICAS QUE DESARROLLAN ACTIVIDAD ECONÓMICA",
  "Autónomo": "PYME Y PERSONAS FÍSICAS QUE DESARROLLAN ACTIVIDAD ECONÓMICA",
  "Particular": "PERSONAS FÍSICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA",
  "Empresa": "GRAN EMPRESA",
};

const accepted = [];
const discarded = [];

for (const client of filterSubvenciones) {
  const clientName = client.name;
  const clientId = client.id;
  // Get valid grant beneficiary types for the client
  const validTypes = (client.beneficiary_type || [])
    .map((b) => synonymMap[b])
    .filter(Boolean);

  for (const grant of client.subvenciones) {
    const match = loopSubvenciones.find(
      (item) => item.codigoBDNS === grant.numeroConvocatoria,
    );
    if (!match) continue;
    const grantBeneficiaryTypes = (match.tiposBeneficiarios || []).map(
      (t) => t.descripcion,
    );
    const hasMatch = grantBeneficiaryTypes.some((type) =>
      validTypes.includes(type),
    );
    if (hasMatch) {
      accepted.push({
        codigoBDNS: grant.numeroConvocatoria,
        clientId,
        clientName,
      });
    } else {
      discarded.push({
        codigoBDNS: grant.numeroConvocatoria,
        description: grant.descripcion,
        grantBeneficiaryTypes: grantBeneficiaryTypes.join(", "),
        clientName,
      });
    }
  }
}

const finalResult = { accepted, discarded };
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filter_benefactors.json",
    JSON.stringify(finalResult, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
