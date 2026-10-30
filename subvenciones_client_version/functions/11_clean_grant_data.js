let fs = null;
try {
  fs = require("fs");
} catch {
  fs = null;
}

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const isN8n = typeof $ === "function";

const fromFile = (filePath, fallback) => {
  if (!fs) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch {
    return fallback;
  }
};

const fromNode = (nodeName) => {
  if (!isN8n) {
    return null;
  }

  try {
    return $(nodeName)
      .all()
      .map((item) => item.json);
  } catch {
    return null;
  }
};

// GET Grants: master query response (Spring Page shape: { content, totalElements, ... })
const getGrantsResponse = (fromNode("GET Grants") || [])[0] ||
  fromFile("../results/getters/get_grants.json", [])[0] || {
  content: [],
  totalElements: 0,
};

// GET Grants Data1: current batch of items (n8n items may or may not wrap data in { json })
const getGrantData = (fromNode("GET Grants Data1") ||
  fromFile("../results/getters/get_grant_data.json", [])).map(
    (item) => item.json || item,
  );
//#endregion

try {
  //#region Node Logic
  // 1. Valid convocatoria codes from the master query (Set for instant lookup)
  const validCodes = new Set(
    getGrantsResponse.content
      .map((g) => (g.numeroConvocatoria ? String(g.numeroConvocatoria).trim() : null))
      .filter(Boolean),
  );

  // 2. Keep only batch items whose codigoBDNS is in the master query
  const result = getGrantData
    .map((item) => {
      const codigo = item.codigoBDNS ? String(item.codigoBDNS).trim() : null;
      if (!codigo || !validCodes.has(codigo)) {
        return null;
      }

      // Only keep the two properties used by the final code
      return {
        codigoBDNS: item.codigoBDNS,
        fechaFinSolicitud: item.fechaFinSolicitud,
      };
    })
    .filter(Boolean);
  //#endregion

  // In n8n context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  if (fs) {
    fs.mkdirSync("../results/builders", { recursive: true });
    fs.writeFileSync(
      "../results/builders/clean_grant_data.json",
      JSON.stringify(result, null, 2),
    );
  }
  console.log(`✅ ${result.length} grants activas filtradas (${getGrantData.length} raw)`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
