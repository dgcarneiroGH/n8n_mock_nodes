const fs = require('fs');

let subvencionesRaw1, filterRegiones;
try {
  filterRegiones = JSON.parse(fs.readFileSync('./results/filter_regiones.json', 'utf8'));
  subvencionesRaw1 = JSON.parse(fs.readFileSync('./results/get_subvenciones.json', 'utf8'));
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const subvencionesRaw = subvencionesRaw1;
const clientes = filterRegiones;

//#region Node Logic

const forbiddenWords = {
  "musica": ["deporte", "deportes", "circo", "teatro", "teatrales", "circenses", "danza", "traduccion", "deportivas"],
  "juventud": ["asuntos sociales", "periodismo", "videojuego", "podcast", "eso", "primaria", "alumnado"],
  "tecnologia": ["obra civil", "mantenimiento ferroviario", "infraestructuras viarias", "maquinaria pesada"],
  "sostenibilidad": ["inia", "biodiversidad", "residuos"]
};

//#region Helpers
const removeAccents = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
const isExactMatch = (text, word) => {
  if (!word || word.trim() === "") return false;
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`\\b${escapedWord}\\b`, 'i').test(text);
};
//#endregion

let processedClients = [];

for (let i = 0; i < clientes.length; i++) {
  const client = clientes[i].client;
  const response = subvencionesRaw[i];
  const clientSectors = client.sectors.map(s => removeAccents(s.toLowerCase())) || [];
  const grants = (response && response.content) ? response.content : [];

  // Filter grants
  const filteredGrants = grants.filter(grant => {
    const grantDesc = removeAccents(grant.descripcion?.toLowerCase() || "");
    let hasForbiddenWord = false;
    for (const sector of clientSectors) {
      const exclusions = forbiddenWords[sector] || [];
      const validExclusions = exclusions.filter(excl => {
        const exclNorm = removeAccents(excl.toLowerCase());
        return !clientSectors.some(s => s.includes(exclNorm) || exclNorm.includes(s));
      });
      if (validExclusions.some(word => isExactMatch(grantDesc, removeAccents(word.toLowerCase())))) {
        hasForbiddenWord = true;
        break;
      }
    }
    return !hasForbiddenWord;
  });

  // Format output
  const formattedGrants = filteredGrants.map(grant => ({
    numeroConvocatoria: grant.numeroConvocatoria,
    descripcion: grant.descripcion,
    fechaRecepcion: grant.fechaRecepcion,
    organo: grant.nivel3,
    enlace_oficial: `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatoria/${grant.numeroConvocatoria}`
  }));

  processedClients.push({
    ...client,
    subvenciones: formattedGrants
  });
}

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync('./results/filter_subvenciones.json', JSON.stringify(processedClients, null, 2), 'utf8');
  console.log("✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.");
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}