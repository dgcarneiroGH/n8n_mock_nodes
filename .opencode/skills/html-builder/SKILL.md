---
name: html-builder
description: Use when creating a new n8n node that generates rich HTML content (emails, reports) in the subvenciones_client_version project. Applies to functions_v2/ scripts that need a local-testable HTML builder.
---

# N8N HTML Builder Pattern

**Purpose**: Create n8n nodes that generate complex HTML outputs (like emails or reports) from input data, while being locally testable. Each node is self-contained and provides clear instructions for n8n integration.

**Context**: Use this pattern when you need to generate rich HTML content within an n8n workflow and want to develop and test the HTML generation logic in a local sandbox environment first.

---

## Key Principles

1.  **Sandbox First**: All logic must run locally using `node <file>.js` before it's considered for n8n.
2.  **Clear Boundaries**: The code is strictly separated into three parts: reusable logic, the n8n integration block, and the local testing sandbox.
3.  **Portable Logic**: The core HTML generation functions are pure, environment-agnostic, and can be moved to n8n without any changes.
4.  **Local Fallbacks**: The local sandbox should be able to function even if input files are missing, by using hardcoded default data.
5.  **Self-Contained**: The script has no external dependencies beyond Node.js's built-in `fs` module.

---

## Workflow Steps

### 1. **Define Inputs and Outputs**

-   Identify the JSON input file(s) that will provide data for the HTML template (e.g., `build_mail_info.json`). These files are typically sourced from the `results/` folder.
-   Determine the name of the output HTML file that will be generated in the local sandbox (e.g., `grant-mail.html`). This file will be saved in a `templates/` directory relative to your script.

### 2. **Create the File Structure**

Create a new `.js` file in the `subvenciones_client_version/functions_v2/` directory, following the `<NUMBER>_<descriptive_name>.js` convention (e.g., `24_generate_html_mail.js`). This file should have the following exact structure, which separates the logic for portability and testing.

```javascript
const fs = require("fs");

// ============================================================================
// BLOCK 1: REUSABLE LOGIC (VALID FOR N8N AND NODE.JS)
// ============================================================================
//#region Node Logic

// Main function that takes data and returns the final structured output for n8n.
function buildCompleteHtml(items) {
  return items
    .filter((item) => (item.grants || []).length > 0) // Example filter
    .map((item) => {
      const grantsHTML = item.grants.map(renderGrantComponent).join("");
      const htmlContent = getHtmlTemplate(item.client, grantsHTML);

      return {
        // This is the final object structure n8n will work with
        emailTo: item.client.email,
        clientName: item.client.name,
        htmlContent,
      };
    });
}

// "Component" function: Renders a single piece of the HTML, like a card or a row.
function renderGrantComponent(grant) {
  return `
    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
      <h2>${grant.title || "Untitled Grant"}</h2>
      <p>${grant.description || "No description."}</p>
    </div>
  `;
}

// Main template function: Assembles the final HTML document.
function getHtmlTemplate(client, grantsHTML) {
  return `<!doctype html>
<html>
  <head>
    <title>Notification for ${client.name}</title>
  </head>
  <body>
    <h1>Hello, ${client.name}!</h1>
    <p>Here are the latest grants for you:</p>
    ${grantsHTML}
  </body>
</html>`;
}

//#endregion
// ============================================================================
// END OF REUSABLE LOGIC
// ============================================================================


// ============================================================================
// BLOCK 2: N8N INTEGRATION (COPY ONLY THIS PART INTO N8N)
// ============================================================================
if (typeof $input !== "undefined") {
  // This code runs only in the n8n environment.
  // It passes the raw n8n input structure directly to the logic block.
  // The logic block is responsible for accessing the `.json` property.
  const items = $input.all();
  return buildCompleteHtml(items);
}
// ============================================================================
// END OF N8N BLOCK
// ============================================================================


// ============================================================================
// BLOCK 3: LOCAL SANDBOX (DO NOT COPY INTO N8N)
// ============================================================================
if (require.main === module) {
  let inputData;
  try {
    // Attempt to load real data for testing
    inputData = JSON.parse(
      fs.readFileSync("./results/build_mail_info.json", "utf8"),
    );
    console.log("✅ Loaded data from results/build_mail_info.json");
  } catch (error) {
    // Fallback to default data if the file doesn't exist
    console.log("⚠️ Could not load from file. Using default test data.");
    inputData = [{
      client: { name: "Test User", email: "test@example.com" },
      grants: [{ title: "Test Grant", description: "This is a test." }],
    }, ];
  }

  const results = buildCompleteHtml(inputData);

  if (results.length > 0) {
    const htmlOutput = results[0].htmlContent;
    const outputDir = "subvenciones_client_version/templates";
    const outputPath = `${outputDir}/custom-mail.html`;

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, htmlOutput, "utf8");
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Successfully generated ${outputPath}`);
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠️ No items met the criteria to generate HTML.");
  }
}
// ============================================================================
// END OF LOCAL SANDBOX
// ============================================================================

```

### 3. **Implement the HTML Logic**

-   Write all your data transformation and HTML generation code inside the `//#region Node Logic` block.
-   Break down your HTML into smaller, reusable "component" functions (e.g., `renderCard`, `renderRow`) to keep the code clean.
-   Use template literals to build your HTML strings.
-   **Do not** include any file I/O (`fs`) or environment-specific calls inside this region.

### 4. **Test Locally**

-   Run your script from the terminal: `node <your_script_name>.js`.
-   The script will read the test data (either from a file or the fallback) and generate an HTML file in the `subvenciones_client_version/templates/` directory.
-   Open the generated HTML file in a browser to visually inspect it and ensure it looks correct.

### 5. **Migrate to n8N**

-   When you are satisfied with the output, copy **only the code from Block 2** into a Code node in your n8n workflow.
-   Ensure the n8n node is configured to "Run Once for All Items" if you are processing an entire batch of items at once.
-   Connect the appropriate input node to your Code node. The script assumes the input data will arrive in the `$input` variable.

---
