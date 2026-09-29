const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const pageMarkdowns = JSON.parse(
  fs.readFileSync("../results/builders/page_markdowns.json"),
);
//#endregion

try {
  //#region Node Logic
  const destDir = "../markdowns/content/subvenciones";
  fs.mkdirSync(destDir, { recursive: true });

  const commits = [];
  const now = new Date().toISOString();

  for (const md of pageMarkdowns.markdowns) {
    const filePath = `${destDir}/${md.slug}.md`;
    fs.writeFileSync(filePath, md.content);
    commits.push({
      action: md.action,
      slug: md.slug,
      path: `content/subvenciones/${md.slug}.md`,
      committed_at: now,
      orphan: md.orphan || false,
    });
  }

  const result = { commits };
  //#endregion

  // In n8N context:
  // - Replace fs.writeFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace the local write with GitHub API: PUT /repos/{owner}/{repo}/contents/{path}

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/github_commits.json",
    JSON.stringify(result, null, 2),
  );
  const createCount = commits.filter((c) => c.action === "create").length;
  const updateCount = commits.filter(
    (c) => c.action === "update" && !c.orphan,
  ).length;
  const orphanCount = commits.filter((c) => c.orphan).length;
  console.log(
    `✅ ${createCount} files created, ${updateCount} updated${orphanCount > 0 ? `, ${orphanCount} orphan(s) preserved` : ""}`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}