const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const pageActions = JSON.parse(
  fs.readFileSync("../results/builders/page_actions.json"),
);
const groupsList = JSON.parse(
  fs.readFileSync("../results/builders/group_page_candidates.json"),
);
//#endregion

try {
  //#region Node Logic
  const today = new Date().toISOString().split("T")[0];

  const buildFrontMatter = (slug, group) => {
    if (group) {
      const [region, beneficiario] = group.tags;
      return [
        "---",
        `title: Subvenciones para ${group.tag_seo} en ${region} para ${beneficiario}`,
        `region: ${region}`,
        `beneficiario: ${beneficiario}`,
        `tag_seo: ${group.tag_seo}`,
        `count: ${group.count_grants}`,
        `date: ${today}`,
        `slug: ${slug}`,
        "---",
      ].join("\n");
    }
    return [
      "---",
      `title: Subvenciones (${slug})`,
      `slug: ${slug}`,
      `date: ${today}`,
      `count: 0`,
      "_orphan: true",
      "---",
    ].join("\n");
  };

  const buildBody = (slug, group) => {
    if (!group) {
      return [
        "",
        `# Subvenciones (${slug})`,
        "",
        "_Esta página está pendiente de regenerar. Sin datos activos._",
        "",
      ].join("\n");
    }
    const [region, beneficiario] = group.tags;
    const codeLines = group.grant_codes.map((code) => `- ${code}`).join("\n");
    return [
      "",
      `# Subvenciones para ${group.tag_seo} en ${region} para ${beneficiario}`,
      "",
      `Subvenciones activas (${group.count_grants}):`,
      "",
      codeLines,
      "",
    ].join("\n");
  };

  const buildMarkdown = (slug, group) =>
    `${buildFrontMatter(slug, group)}\n${buildBody(slug, group)}`;

  const markdowns = [];

  for (const group of pageActions.pages_to_create) {
    markdowns.push({
      action: "create",
      slug: group.slug,
      content: buildMarkdown(group.slug, group),
    });
  }

  for (const slug of pageActions.pages_to_update) {
    const group = groupsList.find((g) => g.slug === slug);
    markdowns.push({
      action: "update",
      slug,
      orphan: !group,
      content: buildMarkdown(slug, group),
    });
  }

  const result = { markdowns };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/page_markdowns.json",
    JSON.stringify(result, null, 2),
  );
  const createCount = markdowns.filter((m) => m.action === "create").length;
  const updateCount = markdowns.filter(
    (m) => m.action === "update" && !m.orphan,
  ).length;
  const orphanCount = markdowns.filter((m) => m.orphan).length;
  console.log(
    `✅ ${createCount} markdowns to create, ${updateCount} to update${orphanCount > 0 ? `, ${orphanCount} orphan(s)` : ""}`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}