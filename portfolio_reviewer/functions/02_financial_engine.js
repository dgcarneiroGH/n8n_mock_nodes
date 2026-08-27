const fs = require("fs");

const RESULT_FILE_PATH = "./files/responses";
const RESULT_FILE_NAME = "format_info_updated.json";

let createPortfolioDataRaw;
try {
    createPortfolioDataRaw = JSON.parse(
        fs.readFileSync("./files/responses/create_portfolio_data.json", "utf8"),
    );
} catch (error) {
    console.error("Error leyendo los archivos JSON.", error.message);
    process.exit(1);
}

// Lectura de payloads locales (sustituyen los nodos N8N $())
const payloads = [
    "get_carteras",
    "get_limites_de_venta",
    "get_historico",
    "get_config",
    "aggregate_crypto",
    "aggregate_fiat",
].reduce((acc, name) => {
    try {
        acc[name] = JSON.parse(fs.readFileSync(`./files/payloads/${name}.json`, "utf8"));
    } catch (error) {
        console.error(`Error leyendo ${name}.json:`, error.message);
        process.exit(1);
    }
    return acc;
}, {});

const activos = payloads.get_carteras;
const limites = payloads.get_limites_de_venta;
const movimientos = payloads.get_historico;
const configNode = payloads.get_config[0];
const fondosDisponibles = configNode ? (configNode.property_cantidad_eur || 0) : 0;

const jsonCrypto = payloads.aggregate_crypto[0];
const listaCrypto = jsonCrypto.cryptosData || jsonCrypto.data || jsonCrypto.aggregated || Object.values(jsonCrypto)[0] || [];

const jsonFiat = payloads.aggregate_fiat[0];
const listaFiat = jsonFiat.coins_data || jsonFiat.data || jsonFiat.aggregated || Object.values(jsonFiat)[0] || [];
// const historicoNotion = $input.all();

//#region Node Logic

// Normalize coin names across payloads so "Venice Token" matches "venice-token"
function normalizeName(name) {
    return (name || "")
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Crypto price + news lookup, keyed by normalized coin name
const cryptoInfo = {};
if (Array.isArray(listaCrypto)) {
    listaCrypto.forEach(coin => {
        const key = normalizeName(coin.coin_name);
        if (!key) return;
        cryptoInfo[key] = {
            rate_eur: coin.rate_eur,
            news: Array.isArray(coin.coin_news) ? coin.coin_news : []
        };
    });
}

// Group limits by wallet id, keeping only non-executed ones
const limitsByWallet = {};
if (Array.isArray(limites)) {
    limites.forEach(l => {
        if (!Array.isArray(l.property_cartera)) return;
        l.property_cartera.forEach(walletId => {
            if (l.property_ejecutado === false) {
                (limitsByWallet[walletId] ??= []).push({
                    target_price_eur: l.property_precio_objetivo,
                    withdraw_eur: l.property_euros_a_sacar
                });
            }
        });
    });
}

// Group movements by asset id
const movementsByAsset = {};
if (Array.isArray(movimientos)) {
    movimientos.forEach(m => {
        if (!Array.isArray(m.property_activo)) return;
        m.property_activo.forEach(assetId => {
            (movementsByAsset[assetId] ??= []).push({
                is_sale: m.property_es_venta,
                price_eur: m.property_precio_eur,
                amount: m.property_cantidad,
                date: m.propertyfecha?.start ?? null
            });
        });
    });
}

// Build crypto[]: one entry per wallet from get_carteras
const crypto = (Array.isArray(activos) ? activos : []).map(cartera => {
    const walletId = cartera.id;
    const name = cartera.property_nombre || cartera.name || "";
    const info = cryptoInfo[normalizeName(name)] || {};

    return {
        name,
        total_amount: cartera.property_saldo_total || 0,
        actual_price: info.rate_eur || 0,
        limits: limitsByWallet[walletId] || [],
        movements: movementsByAsset[walletId] || [],
        news: (info.news || []).map(n => ({
            title: n.titular || n.title,
            link: n.enlace || n.link,
            isoDate: n.fecha || n.pubDate || n.isoDate
        }))
    };
});

// fiat[]: pass through aggregate_fiat payload
const fiat = (Array.isArray(listaFiat) ? listaFiat : []).map(coin => ({
    name: coin.coin_name || coin.name,
    rate_eur: coin.rate_eur,
    coin_news: (Array.isArray(coin.coin_news) ? coin.coin_news : []).map(n => ({
        titular: n.titular,
        enlace: n.enlace,
        fecha: n.fecha
    }))
}));

const result = {
    available_funds: fondosDisponibles,
    crypto,
    fiat
};
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
    fs.writeFileSync(
        `${RESULT_FILE_PATH}/${RESULT_FILE_NAME}`,
        JSON.stringify(result, null, 2),
        "utf8",
    );
    console.log(
        "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
    );
} catch (err) {
    console.error("❌ Error al guardar el archivo:", err.message);
}