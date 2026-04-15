const fs = require('fs');

let filterSubvenciones;
try {
  filterSubvenciones = JSON.parse(fs.readFileSync('./results/filter_subvenciones.json', 'utf8'));
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const clientes = filterSubvenciones;


//#region Node Logic
const results = clientes.flatMap(client =>
  (Array.isArray(client.subvenciones) ? client.subvenciones : []).map(grant => ({
    numeroConvocatoria: grant.numeroConvocatoria,
    descripcion_oficial: grant.descripcion,
    fechaRecepcion: grant.fechaRecepcion,
    organo: grant.organo,
    url_html: grant.url_html,
    url_api: grant.url_api,
    client:{
      id: client.id,
      name: client.name,
      sectors: client.sectors
    }
  }))
);
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync('./results/flat_subvenciones.json', JSON.stringify(results, null, 2), 'utf8');
  console.log("✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.");
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}