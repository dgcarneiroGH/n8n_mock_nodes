const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "financial_engine.json";

// Lectura de payloads locales (sustituyen los nodos N8n $())
const payload = [
    "format_info",
].reduce((acc, name) => {
    try {
        acc[name] = JSON.parse(fs.readFileSync(`../files/responses/${name}.json`, "utf8"));
    } catch (error) {
        console.error(`Error leyendo ${name}.json:`, error.message);
        process.exit(1);
    }
    return acc;
}, {});
// const historicoNotion = $input.all();

//#region Node Logic

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
    fs.writeFileSync(
        `${RESULT_FILE_PATH}/${RESULT_FILE_NAME}`,
        JSON.stringify(result, null, 2),
        "utf8",
    );
    console.log(
        `✅ ¡Éxito! El archivo ${RESULT_FILE_NAME}.json se ha creado o actualizado correctamente.`,
    );
} catch (err) {
    console.error("❌ Error al guardar el archivo:", err.message);
}