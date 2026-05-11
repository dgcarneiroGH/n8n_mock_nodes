const fs = require("fs");

let filterGrantsRaw;
try {
  filterGrantsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_grants.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const subvencionesGuardadas = filterGrantsRaw;

//#region Node Logic de subvenciones
const results = (subvencionesGuardadas || []).flatMap((entry) => {
  const client = entry.client;
  return (entry.grants || []).map((grant) => ({
    ...grant,
    client: {
      id: client.id,
      name: client.name,
    },
  }));
});
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/flat_grants.json",
    JSON.stringify(results, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
