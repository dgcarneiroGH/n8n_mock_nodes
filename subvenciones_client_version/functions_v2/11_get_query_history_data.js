let fs = null;
try {
  fs = require("fs");
} catch {
  fs = null;
}

// Minimum grants required to mark a combo as active.
// Change this constant to tune Phase 2 entry criteria.
const MIN_RESULTS_FOR_ACTIVE = 3;

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

const loopGrantsData =
  fromNode("GET Grants Data1") ||
  fromFile("../results/loops/loop_grants_data.json", []);

const getGrantsResponse = (fromNode("GET Grants") || [])[0] ||
  fromFile("../results/getters/get_grants.json", [])[0] || {
    content: [],
    totalElements: 0,
  };

const notionCombination =
  (fromNode("GET Notion Combinations") || [])[0] ||
  fromFile("../results/getters/get_notion_combinations.json", [])[0] ||
  {};
//#endregion

try {
  //#region Node Logic
  const today = new Date().toISOString().slice(0, 10);
  const grantsPayload =
    getGrantsResponse && typeof getGrantsResponse === "object"
      ? getGrantsResponse
      : { content: [], totalElements: 0 };
  const getGrants = Array.isArray(grantsPayload.content)
    ? grantsPayload.content
    : [];
  const safeLoopGrants = Array.isArray(loopGrantsData) ? loopGrantsData : [];

  const normalizeCode = (value) =>
    value === undefined || value === null || value === ""
      ? null
      : String(value).trim();

  const loopGrantsByCode = new Map();
  for (const grant of safeLoopGrants) {
    const code = normalizeCode(grant.codigoBDNS);
    if (code !== null) {
      loopGrantsByCode.set(code, grant);
    }
  }

  let countResultsConsistent = 0;
  const grantCodesActive = [];
  for (const grant of getGrants) {
    const code = normalizeCode(grant.numeroConvocatoria);
    if (code === null) {
      continue;
    }

    const loopGrant = loopGrantsByCode.get(code);
    if (!loopGrant) {
      continue;
    }

    countResultsConsistent += 1;

    const hasAnnouncements =
      Array.isArray(loopGrant.anuncios) && loopGrant.anuncios.length > 0;
    const endDate = loopGrant.fechaFinSolicitud;
    const notExpired = endDate === null || endDate === "" || today <= endDate;

    if (hasAnnouncements && notExpired) {
      grantCodesActive.push(code);
    }
  }

  const countResultsRaw = Number.isFinite(grantsPayload.totalElements)
    ? grantsPayload.totalElements
    : getGrants.length;
  const countResults = grantCodesActive.length;
  const grantCodesActiveText = grantCodesActive.join("-");

  const status =
    countResults === 0
      ? "no_results"
      : countResults < MIN_RESULTS_FOR_ACTIVE
        ? "low_volume"
        : "active";

  const result = {
    last_checked_at: new Date().toISOString(),
    count_results_raw: countResultsRaw,
    count_results: countResults,
    grant_codes_active: grantCodesActiveText,
    count_results_consistent: countResultsConsistent,
    status,
    query_history_id: notionCombination.id || null,
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  if (fs) {
    fs.mkdirSync("../results/builders", { recursive: true });
    fs.writeFileSync(
      "../results/builders/query_history_data.json",
      JSON.stringify(result, null, 2),
    );
  }
  console.log(
    `✅ ${countResults} grants activas filtradas (${countResultsRaw} raw)`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
