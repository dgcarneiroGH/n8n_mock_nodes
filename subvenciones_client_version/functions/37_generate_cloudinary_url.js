const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const grant = JSON.parse(
  fs.readFileSync("../results/filters/filter_ig_grants.json"),
);

const CLOUD_NAME = "daxjkflsi";
const PUBLIC_ID = "plantilla_story_portalconvocatorias.jpg";
//#endregion

try {
  //#region Node Logic
  const BUDGET_FONT = "Roboto_70_bold";
  const BUDGET_COLOR = "F43F5E";
  const BUDGET_Y = 1225;
  const BUDGET_X = 220;
  const BENEFACTOR_FONT = "Roboto_40_bold";
  const BENEFACTOR_Y = 924;
  const BENEFACTOR_X = -82;
  const REGION_FONT = "Roboto_40_bold";
  const REGION_Y = 1062;
  const REGION_X = -140;

  function buildTextLayer(font, text, y, x, color) {
    const colorParam = color ? `,co_rgb:${color}` : "";
    return `l_text:${font}:${encodeURIComponent(text)}${colorParam}/fl_layer_apply,g_north,y_${y},x_${x}`;
  }

  const formatEuros = (amount) =>
    `${new Intl.NumberFormat("es-ES", {
      useGrouping: "always",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)} €`;

  // Benefactor and region, stacked above the title.
  const benefactorLayer = buildTextLayer(BENEFACTOR_FONT, grant.benefactor, BENEFACTOR_Y, BENEFACTOR_X);
  const regionLayer = buildTextLayer(REGION_FONT, grant.region, REGION_Y, REGION_X);
  // Budget: placed below the title stack to avoid overlapping it.
  const budgetLayer = buildTextLayer(BUDGET_FONT, formatEuros(grant.budget), BUDGET_Y, BUDGET_X, BUDGET_COLOR);

  const result = {
    ig_image_url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${benefactorLayer}/${regionLayer}/${budgetLayer}/${PUBLIC_ID}`,
    original_grant: grant,
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["36_filter_ig_grants"].json
  // - Replace fs.writeFileSync with return [{ json: result }]

  fs.mkdirSync("../results", { recursive: true });
  fs.writeFileSync(
    "../results/generate_cloudinary_url.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ URL de Cloudinary generada para la subvención ${result.original_grant.code}`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
