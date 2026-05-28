const fs = require("fs");

let filterGrantsDataRaw, formatAgentResponseToJSONRaw;
try {
  filterGrantsDataRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_grants_data.json", "utf8"),
  );
  formatAgentResponseToJSONRaw = JSON.parse(
    fs.readFileSync("./results/format_agent_response_to_json.json", "utf8"),
  );
} catch (error) {
  console.error("Error loading JSON files.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const filterGrantsData = filterGrantsDataRaw;
const formatAgentResponseToJSON = formatAgentResponseToJSONRaw;

//#region Node Logic
const agentResponseMap = Object.fromEntries(
  formatAgentResponseToJSON
    .filter((entry) => entry && entry.code)
    .map((entry) => [String(entry.code), entry]),
);

const result = filterGrantsData.map((clientEntry) => ({
  client: clientEntry.client,
  grants: (clientEntry.grants || []).map((grant) => {
    const code = String(grant.code);
    const agentData = agentResponseMap[code] || {};
    const { dates, ...grantWithoutDates } = grant;

    return {
      ...grantWithoutDates,
      publicationDate: agentData.publication_date || null,
      startDate: agentData.calculated_start_date || null,
      endDate: agentData.calculated_end_date || null,
    };
  }),
}));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/update_grants_dates.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ Association complete. Check /results/update_grants_dates.json",
  );
} catch (err) {
  console.error("❌ Error saving file:", err.message);
}
