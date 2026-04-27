const fs = require("fs");

let loopSubvencionesRaw,
  flatSubvencionesRaw,
  filterBenefactorsRaw,
  formatAgentResponseToJSONRaw;
try {
  loopSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/loops/loop_subvenciones.json", "utf8"),
  );
  flatSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/flat_subvenciones.json", "utf8"),
  );
  filterBenefactorsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_benefactors.json", "utf8"),
  );
  formatAgentResponseToJSONRaw = JSON.parse(
    fs.readFileSync("./results/format_agent_response_to_json.json", "utf8"),
  );
} catch (error) {
  console.error("Error loading JSON files.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const loopSubvenciones = loopSubvencionesRaw;
const flatSubvenciones = flatSubvencionesRaw;
const filterBenefactors = filterBenefactorsRaw[0];
const formatAgentResponseToJSON = formatAgentResponseToJSONRaw;

//#region Node Logic
function getGrantUrlsMap(grantData) {
  return Object.fromEntries(
    grantData
      .filter(
        (e) =>
          e.codigoBDNS && Array.isArray(e.anuncios) && e.anuncios.length > 0,
      )
      .map((e) => {
        // Sort anuncios by datPublicacion ascending (oldest first)
        const sortedAnuncios = [...e.anuncios].sort((a, b) => {
          if (!a.datPublicacion || !b.datPublicacion) return 0;
          return a.datPublicacion.localeCompare(b.datPublicacion);
        });
        return [
          String(e.codigoBDNS),
          sortedAnuncios.map((a) => a.url).filter(Boolean),
        ];
      }),
  );
}

// Map each grant ID to an array of all URLs
function getGrantPureTextUrlsMap(urlsMap) {
  const result = {};
  for (const [code, urls] of Object.entries(urlsMap)) {
    result[code] = urls;
  }

  return result;
}

const urlsMap = getGrantUrlsMap(loopSubvenciones);
const pureTextUrlsMap = getGrantPureTextUrlsMap(urlsMap);

// Only include grants whose numeroConvocatoria is in filterBenefactors.accepted
const acceptedCodes = new Set(
  filterBenefactors.accepted.map((g) => g.codigoBDNS),
);

// Build a map from code to agent response for quick lookup
const agentResponseMap = {};
for (const entry of formatAgentResponseToJSON) {
  if (entry && entry.code) {
    agentResponseMap[String(entry.code)] = entry;
  }
}

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const result = flatSubvenciones
  .filter((item) => {
    const code = String(item.numeroConvocatoria);
    if (!acceptedCodes.has(code) || !pureTextUrlsMap.hasOwnProperty(code))
      return false;
    const agentData = agentResponseMap[code] || {};
    // Si existe calculated_end_date y es menor que hoy, descartar
    if (
      agentData.calculated_end_date &&
      agentData.calculated_end_date < today
    ) {
      return false;
    }
    return true;
  })
  .map((item) => {
    const code = String(item.numeroConvocatoria);
    const agentData = agentResponseMap[code] || {};
    return {
      grant: {
        code: item.numeroConvocatoria,
        title: item.descripcion_oficial,
        agency: item.organo,
        portal_url: item.url_html,
        boe_urls: pureTextUrlsMap[code],
        publication_date: agentData.publication_date || null,
        calculated_start_date: agentData.calculated_start_date || null,
        calculated_end_date: agentData.calculated_end_date || null,
      },
      client: item.client,
    };
  });
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/builders/build_client_info.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ Association complete. Check results/final_client_subsidies.json",
  );
} catch (err) {
  console.error("❌ Error saving file:", err.message);
}
