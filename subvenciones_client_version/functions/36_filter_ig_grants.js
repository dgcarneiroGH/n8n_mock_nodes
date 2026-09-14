const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const pageActions = JSON.parse(
  fs.readFileSync("../results/builders/page_actions.json"),
);
//#endregion

try {
  //#region Node Logic
  const MIN_BUDGET = 50000;

  const candidateGrants = pageActions
    .flatMap((pageAction) => pageAction.pages_to_create)
    .flatMap((page) => page.grants)
    .filter(
      (grant) =>
        grant.benefactor === "Particulares" &&
        grant.isNominative === false &&
        grant.budget > MIN_BUDGET,
    );

  const result = candidateGrants.reduce(
    (top, grant) => (top === null || grant.budget > top.budget ? grant : top),
    null,
  );
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/filters", { recursive: true });
  fs.writeFileSync(
    "../results/filters/filter_ig_grants.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ ${result ? `Subvención ${result.code} seleccionada (budget ${result.budget})` : "Sin subvención candidata"}`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
