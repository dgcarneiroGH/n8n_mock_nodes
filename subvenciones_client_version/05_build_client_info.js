const fs = require('fs');

let getSubvencionesDataRaw, flatSubvencionesRaw;
try {
  getSubvencionesDataRaw = JSON.parse(fs.readFileSync('./results/get_subvenciones_data.json', 'utf8'));
  flatSubvencionesRaw = JSON.parse(fs.readFileSync('./results/flat_subvenciones.json', 'utf8'));
} catch (error) {
  console.error("Error loading JSON files.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getSubvencionesData = getSubvencionesDataRaw;
const flatSubvenciones = flatSubvencionesRaw;

//#region Node Logic
// Map each grant ID to the last announcement URL, only if anuncios is not empty
const urlMap = Object.fromEntries(
  getSubvencionesData
    .filter(e => e.codigoBDNS && Array.isArray(e.anuncios) && e.anuncios.length > 0)
    .map(e => [String(e.codigoBDNS), e.anuncios[e.anuncios.length - 1].url])
);

// Only include grants whose convocatoria has anuncios (i.e., is in urlMap)
const result = flatSubvenciones
  .filter(item => urlMap.hasOwnProperty(String(item.numeroConvocatoria)))
  .map(item => ({
    ...item,
    url_boe: urlMap[String(item.numeroConvocatoria)]
  }));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync('./results/build_client_info.json', JSON.stringify(result, null, 2), 'utf8');
  console.log("✅ Association complete. Check results/final_client_subsidies.json");
} catch (err) {
  console.error("❌ Error saving file:", err.message);
}