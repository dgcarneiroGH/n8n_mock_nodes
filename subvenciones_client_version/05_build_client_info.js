const fs = require('fs');

let loopSubvencionesRaw, flatSubvencionesRaw;
try {
  loopSubvencionesRaw = JSON.parse(fs.readFileSync('./results/loop_subvenciones.json', 'utf8'));
  flatSubvencionesRaw = JSON.parse(fs.readFileSync('./results/flat_subvenciones.json', 'utf8'));
} catch (error) {
  console.error("Error loading JSON files.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const loopSubvenciones = loopSubvencionesRaw;
const flatSubvenciones = flatSubvencionesRaw;

//#region Node Logic
function getGrantUrlsMap(grantData) {
  return Object.fromEntries(
    grantData
      .filter(e => e.codigoBDNS && Array.isArray(e.anuncios) && e.anuncios.length > 0)
      .map(e => {
        // Sort anuncios by datPublicacion ascending (oldest first)
        const sortedAnuncios = [...e.anuncios].sort((a, b) => {
          if (!a.datPublicacion || !b.datPublicacion) return 0;
          return a.datPublicacion.localeCompare(b.datPublicacion);
        });
        return [
          String(e.codigoBDNS),
          sortedAnuncios.map(a => a.url).filter(Boolean)
        ];
      })
  );
}


function extractBoePureTextUrl(url) {
  if (!url) return null;
  const boeIdMatch = url.match(/c=(BOE-[A-Z]-\d{4}-\d+)/);
  if (boeIdMatch) {
    const boeId = boeIdMatch[1];
    return `https://www.boe.es/diario_boe/txt.php?id=${boeId}`;
  }
  return null;
}


// Map each grant ID to an array of all pure text BOE URLs
function getGrantPureTextUrlsMap(urlsMap) {
  const result = {};
  for (const [code, urls] of Object.entries(urlsMap)) {
    result[code] = Array.isArray(urls)
      ? urls.map(extractBoePureTextUrl).filter(Boolean)
      : [];
  }
  return result;
}


const urlsMap = getGrantUrlsMap(loopSubvenciones);
const pureTextUrlsMap = getGrantPureTextUrlsMap(urlsMap);

const result = flatSubvenciones
  .filter(item => pureTextUrlsMap.hasOwnProperty(String(item.numeroConvocatoria)))
  .map(item => ({
    grant: {
      id: item.numeroConvocatoria,
      title: item.descripcion_oficial,
      reception_date: item.fechaRecepcion,
      agency: item.organo,
      boe_urls: pureTextUrlsMap[String(item.numeroConvocatoria)]
    },
    client: item.client
  }));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync('./results/build_client_info.json', JSON.stringify(result, null, 2), 'utf8');
  console.log("✅ Association complete. Check results/final_client_subsidies.json");
} catch (err) {
  console.error("❌ Error saving file:", err.message);
}