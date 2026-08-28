const fs = require("fs");

const RESULT_FILE_ROUTE = "../files/templates";
const RESULT_FILE_NAME = "build_html.html";

let formatAgentResponseRaw;
try {
  formatAgentResponseRaw = JSON.parse(
    fs.readFileSync("../files/responses/format_agent_response.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// ============================================================================
// BLOQUE 1: SIMULADOR DEL ENTORNO N8N (NO COPIAR EN N8N)
// ============================================================================
const inputData = formatAgentResponseRaw;

// Simulamos la entrada de n8n
// (n8n's $input.first().json returns the first item; if the source is a single
//  object rather than an array, wrap it so the node logic sees the same shape)
const _inputArray = Array.isArray(inputData) ? inputData : [inputData];
const $input = {
  all: () => _inputArray.map((item) => ({ json: item })),
  first: () => ({ json: _inputArray[0] || {} }),
};

// ============================================================================
// TAILWIND CONFIG + NEUMORPHIC CSS (inlined per project convention)
// ============================================================================
const TAILWIND_CONFIG = `
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-shadow-light": "#FFFFFF",
                        "on-secondary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "surface-dim": "#dcd9d9",
                        "text-primary": "#2D3748",
                        "on-secondary-fixed": "#2b1700",
                        "on-primary-fixed": "#171c1f",
                        "on-primary-container": "#6b6f73",
                        "secondary-fixed": "#ffddb9",
                        "outline": "#74777a",
                        "primary-container": "#f0f4f8",
                        "inverse-on-surface": "#f3f0f0",
                        "inverse-primary": "#c3c7cb",
                        "tertiary-container": "#fff1e6",
                        "secondary-container": "#fda625",
                        "on-secondary-container": "#694000",
                        "inverse-surface": "#313030",
                        "secondary": "#865300",
                        "surface-container-highest": "#e5e2e1",
                        "tertiary-fixed-dim": "#d1c4ba",
                        "tertiary-fixed": "#eee0d5",
                        "surface-container-low": "#f6f3f2",
                        "status-danger": "#d9534f",
                        "on-primary": "#ffffff",
                        "surface-container": "#f0eded",
                        "on-tertiary-fixed": "#211a14",
                        "on-surface-variant": "#44474a",
                        "error": "#ba1a1a",
                        "on-background": "#1c1b1c",
                        "on-tertiary-container": "#776d64",
                        "surface-container-lowest": "#ffffff",
                        "surface": "#fcf8f8",
                        "on-primary-fixed-variant": "#43474b",
                        "status-success": "#2ecc71",
                        "outline-variant": "#c4c7c9",
                        "on-secondary-fixed-variant": "#663e00",
                        "on-error-container": "#93000a",
                        "on-error": "#ffffff",
                        "surface-container-high": "#ebe7e7",
                        "primary": "#5a5f62",
                        "background": "#fcf8f8",
                        "secondary-fixed-dim": "#ffb961",
                        "surface-bright": "#fcf8f8",
                        "surface-variant": "#e5e2e1",
                        "text-secondary": "#718096",
                        "error-container": "#ffdad6",
                        "primary-fixed-dim": "#c3c7cb",
                        "tertiary": "#665d54",
                        "surface-shadow-dark": "#D1D9E6",
                        "on-surface": "#1c1b1c",
                        "primary-fixed": "#dfe3e7",
                        "surface-tint": "#5a5f62",
                        "on-tertiary-fixed-variant": "#4e453e"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "lg": "24px",
                        "gutter": "16px",
                        "container-padding": "30px",
                        "xl": "32px",
                        "xs": "4px",
                        "md": "16px",
                        "sm": "8px",
                        "unit": "4px"
                    },
                    "fontFamily": {
                        "headline-md": ["Manrope"],
                        "body-sm": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-lg": ["Manrope"],
                        "body-md": ["Inter"],
                        "headline-sm": ["Manrope"],
                        "label-caps": ["Inter"],
                        "table-header": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["18px", { "lineHeight": "24px", "letterSpacing": "0.04em", "fontWeight": "600" }],
                        "body-sm": ["13px", { "lineHeight": "18px", "fontWeight": "400" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-sm": ["14px", { "lineHeight": "20px", "letterSpacing": "0.04em", "fontWeight": "600" }],
                        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "table-header": ["12px", { "lineHeight": "16px", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        .neumorphic-outer {
            box-shadow: 12px 12px 24px var(--tw-colors-surface-shadow-dark), -12px -12px 24px var(--tw-colors-surface-shadow-light);
        }
        .neumorphic-inner {
            box-shadow: inset 8px 8px 16px var(--tw-colors-surface-shadow-dark), inset -8px -8px 16px var(--tw-colors-surface-shadow-light);
        }
        .neumorphic-pressed:active {
            box-shadow: inset 8px 8px 16px var(--tw-colors-surface-shadow-dark), inset -8px -8px 16px var(--tw-colors-surface-shadow-light);
        }
        .glow-positive {
            box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
        }
        .glow-negative {
            box-shadow: 0 4px 12px rgba(217, 83, 79, 0.2);
        }
    </style>
`;

// ============================================================================
// HELPERS (Node Logic only — no file I/O here)
// ============================================================================
const getTrendColor = (trend) => {
  // Bias terms (BAJISTA/ALCISTA/ESTABLE) are colored globally by
  // colorizeMarketBiasTerms — return empty here to avoid nested spans.
  if (!trend) return "";
  const n = String(trend).toUpperCase();
  if (n.includes("BULL") || n.includes("BEAR") || n.includes("ALCISTA") || n.includes("BAJISTA") || n.includes("ESTABLE")) return "";
  return "text-on-surface-variant";
};

const getRoiColor = (roi) => {
  if (!roi) return "text-on-surface";
  return String(roi).includes("-") ? "text-status-danger" : "text-status-success";
};

const colorizeMarketBiasTerms = (text) =>
  // Negative lookbehind for ">" avoids re-wrapping terms already inside a <span>
  text.replace(/(?<![>])\b(BAJISTA|ALCISTA|ESTABLE)\b/gi, (match) => {
    const n = match.toUpperCase();
    if (n === "BAJISTA") return `<span class="text-status-danger font-bold">${match}</span>`;
    if (n === "ALCISTA") return `<span class="text-status-success font-bold">${match}</span>`;
    return `<span class="text-on-surface font-bold">${match}</span>`;
  });

const getCoinInitials = (name) => {
  if (!name) return "?";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  const str = String(value).trim();
  if (!str) return "-";
  // If already formatted with a currency symbol, return as-is.
  if (/€/.test(str)) return str;
  // Parse plain numbers and format with thousands separators.
  const numMatch = str.match(/-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/);
  if (!numMatch) return str;
  const num = parseFloat(numMatch[0].replace(/\./g, "").replace(",", "."));
  if (isNaN(num)) return str;
  return (
    num.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

const renderCryptoRows = (assets) => {
  if (!Array.isArray(assets) || assets.length === 0) return "";
  return assets
    .map(
      (asset) => `
        <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
          <td class="py-md px-md font-body-md text-body-md text-primary flex items-center gap-sm">
            <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center neumorphic-inner">
              <span class="font-label-caps text-label-caps">${getCoinInitials(asset.nombre)}</span>
            </div>
            ${asset.nombre || "-"}
            <div class="text-[11px] text-on-surface-variant mt-xs block w-full">${asset.media_texto || "-"}</div>
          </td>
          <td class="py-md px-md font-body-md text-body-md text-on-surface font-mono">${formatMoney(asset.precio_actual)}</td>
          <td class="py-md px-md">
            <span class="px-sm py-xs rounded-full font-label-caps text-label-caps ${getRoiColor(asset.roi)} bg-surface ${asset.roi && String(asset.roi).includes("-") ? "glow-negative" : "glow-positive"} inline-flex items-center gap-xs">
              <span class="material-symbols-outlined text-[14px]">${asset.roi && String(asset.roi).includes("-") ? "arrow_downward" : "arrow_upward"}</span>
              ${asset.roi || "-"}
            </span>
          </td>
          <td class="py-md px-md font-body-sm text-body-sm">
            <div class="flex flex-col items-start">
              <span class="font-bold ${getTrendColor(asset.tendencia)}">${asset.tendencia || "-"}</span>
              <span class="text-secondary text-[11px]">${asset.media_texto || ""}</span>
            </div>
          </td>
          <td class="py-md px-md font-body-sm text-body-sm text-on-surface-variant">${asset.distancia_objetivo || "No target defined"}</td>
        </tr>`,
    )
    .join("");
};


// ============================================================================
// BLOQUE 2: LÓGICA DEL NODO (ready to copy into n8n)
// ============================================================================
function codigoN8n() {
  // #region Node Logic
  const data = $input.first().json || {};

  // ---- Resolve the real payload (may be wrapped inside "original[0].output") ----
  let payload = data;
  if (data.error && Array.isArray(data.original) && data.original[0] && data.original[0].output) {
    try {
      payload = JSON.parse(data.original[0].output);
    } catch (e) {
      return [{ htmlContent: `<h1>Report generation error</h1>` }];
    }
  }
  if (payload.error || payload.parsing_failed) {
    return [{ htmlContent: `<h1>Report generation error</h1>` }];
  }

  const cryptoRows = renderCryptoRows(payload.activos);
  const fiatCards = renderFiatCards(payload.fiat);

  // Extract the liquidity figure (e.g. "5.75 €") from the raw text
  const liquidityMatch = String(payload.liquidez_texto || payload.liquidity_text || "").match(/-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s*€/);
  const liquidityValue = liquidityMatch ? liquidityMatch[0].trim() : "5.75 €";

  const html = `<!DOCTYPE html>
<html class="light" lang="en" style=""><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Financial Intelligence Analysis</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Manrope:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
${TAILWIND_CONFIG}
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen flex flex-col md:flex-row">
<!-- SideNavBar (Desktop) -->
<!-- Main Content Area -->
<div class="flex-grow flex flex-col min-h-screen">
<!-- TopAppBar -->
<header class="flex justify-between items-center h-20 px-container-padding w-full top-0 sticky bg-background shadow-[4px_4px_16px_0px_rgba(209,217,230,0.4),-4px_-4px_16px_0px_rgba(255,255,255,0.8)] z-10 shrink-0">
<div class="flex items-center gap-md">
<h1 class="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">FINANCIAL INTELLIGENCE ANALYSIS</h1>
</div>
<div class="flex items-center gap-lg">
<div class="relative hidden sm:block">
</div>
<button class="p-sm rounded-full text-primary hover:bg-surface-container transition-all active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] duration-200">
</button>
<button class="p-sm rounded-full text-primary hover:bg-surface-container transition-all active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] duration-200">
</button>
</div>
</header>
<!-- Canvas -->
<main class="flex-grow p-container-padding grid grid-cols-1 md:grid-cols-12 gap-lg max-w-[1400px] mx-auto w-full">
<!-- Bento Grid Layout -->
<div class="md:col-span-12 lg:col-span-8 flex flex-col gap-lg">
<!-- Liquidity & Key Metric -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
<div class="neumorphic-outer rounded-lg p-lg bg-surface flex flex-col justify-between">
<div class="flex justify-between items-start mb-md">
<h3 class="font-headline-sm text-headline-sm text-on-surface-variant">Liquidity Status</h3>
<span class="material-symbols-outlined text-secondary">water_drop</span>
</div>
<div>
<p class="font-headline-lg text-headline-lg text-primary mb-xs font-mono">${liquidityValue}</p>
</div>
</div>
<div class="neumorphic-outer rounded-lg p-lg bg-surface flex flex-col justify-between">
<div class="flex justify-between items-start mb-md relative z-10">
<h3 class="font-headline-sm text-headline-sm text-on-surface-variant">Global Sentiment</h3>
<span class="material-symbols-outlined text-secondary">public</span>
</div>
<div class="relative z-10">
<p class="font-headline-lg text-headline-lg text-primary mb-xs">Neutral-Bullish</p>
<div class="w-full bg-surface-dim h-[4px] rounded-full mt-sm overflow-hidden">
<div class="bg-secondary h-full w-[65%]"></div>
</div>
</div>
</div>
</div>
<!-- Crypto Portfolio Table -->
<div class="neumorphic-outer rounded-lg bg-surface p-md">
<div class="px-sm py-sm mb-md flex justify-between items-center">
<h3 class="font-headline-md text-headline-md text-secondary">Crypto Portfolio</h3>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="border-b border-outline-variant"><th class="py-sm px-md font-table-header text-table-header text-on-surface-variant">Asset</th><th class="py-sm px-md font-table-header text-table-header text-on-surface-variant">Value</th><th class="py-sm px-md font-table-header text-table-header text-on-surface-variant">ROI</th><th class="py-sm px-md font-table-header text-table-header text-on-surface-variant">Trend vs Mean</th><th class="py-sm px-md font-table-header text-table-header text-on-surface-variant">Target Distance</th></tr>
</thead>
<tbody>${cryptoRows}
</tbody>
</table>
</div>
</div>
</div>
<!-- Side Cards (Fiat Market) -->
<div class="md:col-span-12 lg:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[5.75rem] lg:self-start">
<h3 class="font-headline-md text-headline-md text-secondary px-sm">Fiat Market</h3>
${fiatCards}
<div class="mt-auto pt-lg">
</div>
</div>
</main>
<!-- Footer -->
</div>
</body></html>`;

  const htmlWithColoredBiasTerms = colorizeMarketBiasTerms(html);
  return [{ htmlContent: htmlWithColoredBiasTerms }];
  // #endregion
}

// ============================================================================
// BLOQUE 3: EJECUCIÓN Y GENERACIÓN DEL HTML (NO COPIAR EN N8N)
// ============================================================================
const itemsFinales = codigoN8n();

if (itemsFinales.length > 0) {
  const htmlParaTest = itemsFinales[0].htmlContent;

  if (!fs.existsSync("templates")) fs.mkdirSync("templates");
  fs.writeFileSync(
    `${RESULT_FILE_ROUTE}/${RESULT_FILE_NAME}`,
    htmlParaTest,
    "utf8",
  );

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Archivo "${RESULT_FILE_NAME}" generado. Ábrelo en tu navegador.`,
  );
} else {
  console.log("\x1b[33m%s\x1b[0m", "⚠️ Ningún trabajo procesado.");
}

// ============================================================================
// BLOQUE 4: FIAT CARDS RENDERER (stacked full-width cards, matching the reference)
// ============================================================================
function renderFiatCards(fiatItems) {
  if (!Array.isArray(fiatItems) || fiatItems.length === 0) return "";
  const iconFor = (currency) => {
    const c = String(currency).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (c.includes("libra") || c.includes("gbp") || c.includes("pound")) return "currency_pound";
    if (c.includes("dolar") || c.includes("usd") || c.includes("dollar")) return "attach_money";
    if (c.includes("yuan") || c.includes("cny")) return "currency_yuan";
    return "attach_money";
  };
  const pairFor = (currency) => {
    const c = String(currency).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (c.includes("libra") || c.includes("gbp") || c.includes("pound")) return "GBP/USD";
    if (c.includes("dolar") || c.includes("usd") || c.includes("dollar")) return "USD Index";
    if (c.includes("yuan") || c.includes("cny")) return "USD/CNY";
    return currency || "-";
  };
  return fiatItems
    .map(
      (fiat) => `
        <div class="neumorphic-outer rounded-lg p-lg bg-surface flex items-center justify-between">
            <div class="flex items-center gap-md">
                <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center neumorphic-inner">
                    <span class="material-symbols-outlined text-on-surface-variant">${iconFor(fiat.moneda || fiat.currency)}</span>
                </div>
                <div>
                    <h4 class="font-headline-sm text-headline-sm text-primary">${fiat.moneda || fiat.currency || "N/A"}</h4>
                    <p class="font-body-sm text-body-sm text-on-surface-variant">${pairFor(fiat.moneda || fiat.currency)}</p>
                    <p class="text-[11px] text-on-surface-variant mt-xs">${fiat.veredicto || fiat.verdict || "-"}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-body-md text-body-md text-on-surface font-mono">${formatMoney(fiat.tasa_actual || fiat.precio_actual || "-")}</p>
                <p class="font-label-caps text-label-caps text-on-surface-variant">${fiat.tendencia || fiat.trend || "-"}</p>
                <p class="text-[11px] text-on-surface-variant mt-xs">${fiat.veredicto || fiat.verdict || "-"}</p>
            </div>
        </div>`,
    )
    .join("");
}
