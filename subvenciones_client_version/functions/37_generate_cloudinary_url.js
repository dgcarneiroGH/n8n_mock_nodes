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
  const BUDGET_FONT = "Roboto_50_bold";
  const BUDGET_COLOR = "F43F5E";
  const AUDIENCE_FONT = "Roboto_30_bold";
  const ORIGIN_FONT = "Roboto_30_bold";
  const AUDIENCE_Y = 555;
  const AUDIENCE_X = -23;
  const ORIGIN_Y = 635;
  const ORIGIN_X = -65;

  function buildTextLayer(font, text, y, x, color) {
    const colorParam = color ? `,co_rgb:${color}` : "";
    return `l_text:${font}:${encodeURIComponent(text)}${colorParam}/fl_layer_apply,g_north,y_${y},x_${x}`;
  }

  function buildCloudinaryUrl(grant) {
    const budget = grant.budget;

    // Budget: placed below the title stack to avoid overlapping it.
    const budgetY = 728;
    const budgetX = 100;
    const budgetLayer = buildTextLayer(
      BUDGET_FONT,
      `${budget} €`,
      budgetY,
      budgetX,
      BUDGET_COLOR,
    );

    // Benefactor and region, stacked above the title.
    const layerAudience = buildTextLayer(AUDIENCE_FONT, grant.benefactor, AUDIENCE_Y, AUDIENCE_X);
    const layerOrigin = buildTextLayer(ORIGIN_FONT, grant.region, ORIGIN_Y, ORIGIN_X);

    return {
      ig_image_url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${layerAudience}/${layerOrigin}/${budgetLayer}/${PUBLIC_ID}`,
      original_grant: grant,
    };
  }

  const result = buildCloudinaryUrl(grant);
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
