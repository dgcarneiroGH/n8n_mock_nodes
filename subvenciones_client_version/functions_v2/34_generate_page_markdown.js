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
      const [region, beneficiary] = group.tags;
      return [
        "---",
        `title: Subvenciones para ${group.tag_seo} en ${region} para ${beneficiary}`,
        `region: ${region}`,
        `beneficiario: ${beneficiary}`,
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

  const toDDMMYYYY = (value) => {
    if (!value) return "";
    const dateStr =
      typeof value === "object" && value.start ? value.start : value;
    if (typeof dateStr !== "string") return "";
    const [y, m, d] = dateStr.split("T")[0].split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const formatGrant = (grant) => {
    const startDate = toDDMMYYYY(grant.startDate);
    const endDate = toDDMMYYYY(grant.endDate);
    const metaFields = [
      grant.budget != null ? `Budget: ${grant.budget}` : null,
      grant.receptionDate
        ? `Reception: ${toDDMMYYYY(grant.receptionDate)}`
        : null,
      startDate ? `Start: ${startDate}` : null,
      endDate ? `End: ${endDate}` : null,
    ].filter(Boolean);
    const requirements = Array.isArray(grant.requirements)
      ? grant.requirements.filter((r) => r && r.trim() !== "")
      : [];
    const detailFields = [
      grant.agency ? `Agency: ${grant.agency}` : null,
      grant.description ? `Description: ${grant.description}` : null,
      requirements.length > 0
        ? `Requirements: ${requirements.join("; ")}`
        : null,
      metaFields.length > 0 ? metaFields.join(" | ") : null,
    ].filter(Boolean);
    const details =
      detailFields.length > 0 ? `\n  - ${detailFields.join("\n  - ")}` : "";
    return `- [${grant.title}](${grant.url}) (${grant.agency})${details}`;
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
    const [region, beneficiary] = group.tags;
    const grantLines = group.grants.map(formatGrant).join("\n");
    return [
      "",
      `# Subvenciones para ${group.tag_seo} en ${region} para ${beneficiary}`,
      "",
      `Subvenciones activas (${group.count_grants}):`,
      "",
      grantLines,
      "",
    ].join("\n");
  };

  const buildMarkdown = (slug, group) =>
    `${buildFrontMatter(slug, group)}\n${buildBody(slug, group)}`;

  const markdowns = [];

  for (const batch of pageActions) {
    for (const group of batch.pages_to_create) {
      markdowns.push({
        action: "create",
        slug: group.slug,
        content: buildMarkdown(group.slug, group),
      });
    }

    for (const { slug } of batch.pages_to_update) {
      const group = groupsList.find((g) => g.slug === slug);
      markdowns.push({
        action: "update",
        slug,
        orphan: !group,
        content: buildMarkdown(slug, group),
      });
    }
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