const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const llmResponse = JSON.parse(
  fs.readFileSync("../results/agents/grants_tagger.json")[0],
);
const originalGrants = JSON.parse(
  fs.readFileSync("../results/builders/tag_grants.json"),
);
//#endregion

try {
  //#region Node Logic
  const agentGrants = llmResponse.output?.grants || [];

  const agentByCode = new Map(
    agentGrants.map(item => [item.code, item])
  );

  const result = originalGrants.map((grant) => {
    const iaTag = agentByCode.get(grant.code);

    if (iaTag) {
      return {
        ...grant,
        tag_seo: iaTag.tag_seo,
        manual_check: iaTag.manual_check
      };
    }

    return grant;
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/format_agent_response.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} grants formatted with agent response`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
