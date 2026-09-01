const fs = require("fs");

const RESULT_FILE_PATH = "../files/responses";
const RESULT_FILE_NAME = "create_fiat_object.json";

const payloads = [
    "get_coin_data",
    "read_google_news"
].reduce((acc, name) => {
    try {
        acc[name] = JSON.parse(fs.readFileSync(`../files/payloads/${name}.json`, "utf8"));
    } catch (error) {
        console.error(`Error leyendo ${name}.json:`, error.message);
        process.exit(1);
    }
    return acc;
}, {});

const coins = payloads.get_coin_data;
const allNews = payloads.read_google_news;

//#region Node Logic
const coinNames = {
    "GBP": "Libra",
    "USD": "Dólar",
    "CNY": "Yuan"
};

const dailySpamPhrases = [
    "precio del",
    "abre la cotización",
    "a cuánto cotizan",
    "a cuánto cerró la cotización"
];

const dateLimit = new Date();
dateLimit.setDate(dateLimit.getDate() - 1);
dateLimit.setHours(0, 0, 0, 0);

const fiatCurrencies = coins.map((coin) => {
    const coinNews = allNews
        .filter((news) => {
            if (!news.title || !news.isoDate) return false;

            const titleLower = news.title.toLowerCase();
            const isDailySpam = dailySpamPhrases.some((phrase) => titleLower.includes(phrase));

            return !isDailySpam && new Date(news.isoDate) < dateLimit;
        })
        .slice(0, 5)
        .map((news) => ({
            title: news.title,
            date: news.pubDate || news.isoDate
        }));

    return {
        coin_name: coinNames[coin.base] || coin.base,
        rate_eur: coin.rates.EUR,
        coin_news: coinNews
    };
});
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
    fs.writeFileSync(
        `${RESULT_FILE_PATH}/${RESULT_FILE_NAME}`,
        JSON.stringify(fiatCurrencies, null, 2),
        "utf8",
    );
    console.log(
        `✅ ¡Éxito! El archivo ${RESULT_FILE_NAME}.json se ha creado o actualizado correctamente en tu carpeta.`,
    );
} catch (err) {
    console.error("❌ Error al guardar el archivo:", err.message);
}
