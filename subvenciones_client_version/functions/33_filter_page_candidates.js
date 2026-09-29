const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const groupPageCandidates = JSON.parse(
  fs.readFileSync("../results/builders/group_page_candidates.json"),
);
const constants = JSON.parse(
  fs.readFileSync("../results/getters/get_constants.json"),
)[0];
//#endregion

try {
  //#region Node Logic
  const minGrantsToCreatePage = constants.MIN_GRANTS_TO_CREATE_PAGE;

  const desiredCreatePages = groupPageCandidates.filter(
    (group) => group.count_grants >= minGrantsToCreatePage,
  );
  const desiredUpdatePages = groupPageCandidates.filter(
    (group) => group.count_grants < minGrantsToCreatePage,
  );

  const result = {
    desired_create_pages: desiredCreatePages,
    desired_update_pages: desiredUpdatePages,
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/filters", { recursive: true });
  fs.writeFileSync(
    "../results/filters/filter_page_candidates.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ ${desiredCreatePages.length} create candidates, ${desiredUpdatePages.length} update candidates`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}