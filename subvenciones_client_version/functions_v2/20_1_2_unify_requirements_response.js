const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const rawItems = JSON.parse(
  fs.readFileSync("../results/builders/format_agent_response.json"),
);
//#endregion

try {
  //#region Node Logic
  const result = [];

  const extractGrants = (node) => {
    if (!node || typeof node !== 'object') return;

    const code = node.code ?? node.Code;
    if (code) {
      result.push({
        code: String(code),
        description: String(node.description ?? ''),
        requirements: Array.isArray(node.requirements)
          ? node.requirements.join(';')
          : (typeof node.requirements === 'string' ? node.requirements : '')
      });
    } else {
      Object.values(node).forEach(extractGrants);
    }
  };

  extractGrants(rawItems);
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/unify_requirements_response.json",
    JSON.stringify(result, null, 2),
  );
  const resultCount = Array.isArray(result) ? result.length : 1;
  console.log(`✅ ${resultCount} Unified responses`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
