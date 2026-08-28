const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "financial_engine.json";

// Lectura de payloads locales
const payloads = [
    "get_carteras",
    "get_limites_de_venta",
    "get_historico",
    "get_config",
    "aggregate_crypto",
    "aggregate_fiat",
    "get_fear_and_greed_index"
].reduce((acc, name) => {
    try {
        acc[name] = JSON.parse(fs.readFileSync(`../files/payloads/${name}.json`, "utf8"));
    } catch (error) {
        console.error(`Error leyendo ${name}.json:`, error.message);
        process.exit(1);
    }
    return acc;
}, {});

const assets = payloads.get_carteras;
const limits = payloads.get_limites_de_venta;
const movements = payloads.get_historico;
const configNode = payloads.get_config[0];
const availableFunds = configNode ? (configNode.property_cantidad_eur || 0) : 0;

const jsonCrypto = payloads.aggregate_crypto[0];
const cryptoList = jsonCrypto.cryptosData || jsonCrypto.data || jsonCrypto.aggregated || Object.values(jsonCrypto)[0] || [];

const jsonFiat = payloads.aggregate_fiat[0];
const fiatList = jsonFiat.coins_data || jsonFiat.data || jsonFiat.aggregated || Object.values(jsonFiat)[0] || [];

const fearAndGreed = payloads.get_fear_and_greed_index[0].data[0];
// const historicoNotion = $input.all();

//#region Node Logic

let counter = 0;

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
if (Array.isArray(cryptoList)) {
    cryptoList.forEach(coin => {
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
if (Array.isArray(limits)) {
    limits.forEach(l => {
        if (!Array.isArray(l.property_cartera)) return;
        l.property_cartera.forEach(walletId => {
            if (l.property_ejecutado === false) {
                (limitsByWallet[walletId] ??= []).push({
                    id: l.id,
                    target_price_eur: l.property_precio_objetivo,
                    withdraw_eur: l.property_euros_a_sacar
                });
            }
        });
    });
}

// Group movements by asset id
const movementsByAsset = {};
if (Array.isArray(movements)) {
    movements.forEach(m => {
        if (!Array.isArray(m.property_activo)) return;
        m.property_activo.forEach(assetId => {
            (movementsByAsset[assetId] ??= []).push({
                is_sale: m.property_es_venta,
                price_eur: m.property_precio_eur,
                amount: m.property_cantidad,
                date: m.property_fecha?.start ?? null
            });
        });
    });
}

// Build crypto[]: one entry per wallet from get_carteras
const notionUpdates = [];
const crypto = (Array.isArray(assets) ? assets : []).map(wallet => {
    const walletId = wallet.id;
    const name = wallet.property_nombre || wallet.name || "";
    const info = cryptoInfo[normalizeName(name)] || {};

    const walletMovements = movementsByAsset[walletId] || [];
    const totalCost = walletMovements.reduce((sum, m) => {
        const tradeValue = (m.amount || 0) * (m.price_eur || 0);
        return m.is_sale ? sum - tradeValue : sum + tradeValue;
    }, 0);
    const totalAmount = wallet.property_saldo_total || 0;
    const actualPrice = info.rate_eur || 0;
    const currentValue = totalAmount * actualPrice;
    const roi = totalCost > 0 ? Number((((currentValue - totalCost) / totalCost) * 100).toFixed(2)) : null;

    const executedLimits = (limitsByWallet[walletId] || [])
        .filter(limit => actualPrice >= limit.target_price_eur)
        .map(limit => {
            const saleDate = new Date().toISOString().split("T")[0];
            counter += 1;
            const historicName = saleDate.slice(2, 4) + counter.toString().padStart(2, "0");

            notionUpdates.push({
                id: limit.id,
                type: "LIMIT",
                properties: { executed: true }
            });
            notionUpdates.push({
                type: "HISTORICAL",
                properties: {
                    name: historicName,
                    quantity: totalAmount,
                    isSale: true,
                    walletId: walletId,
                    date: saleDate,
                    priceEur: actualPrice
                }
            });
            return {
                target_price_eur: limit.target_price_eur,
                withdraw_eur: limit.withdraw_eur,
                executed: true
            };
        });

    return {
        name,
        total_amount: totalAmount,
        actual_price: actualPrice,
        roi,
        limits: executedLimits.concat(
            (limitsByWallet[walletId] || [])
                .filter(limit => actualPrice < limit.target_price_eur)
                .map(limit => ({
                    target_price_eur: limit.target_price_eur,
                    withdraw_eur: limit.withdraw_eur
                }))
        ),
        movements: walletMovements,
        news: (info.news || []).map(n => ({
            title: n.titular || n.title,
            link: n.enlace || n.link,
            isoDate: n.fecha || n.pubDate || n.isoDate
        }))
    };
});

// fiat[]: pass through aggregate_fiat payload
const fiat = (Array.isArray(fiatList) ? fiatList : []).map(coin => ({
    name: coin.coin_name || coin.name,
    rate_eur: coin.rate_eur,
    coin_news: (Array.isArray(coin.coin_news) ? coin.coin_news : []).map(n => ({
        titular: n.titular,
        enlace: n.enlace,
        fecha: n.fecha
    }))
}));

const result = {
    available_funds: availableFunds,
    crypto,
    fiat,
    fear_and_greed: { value: fearAndGreed.value, classification: fearAndGreed.value_classification },
    notion_updates: notionUpdates
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