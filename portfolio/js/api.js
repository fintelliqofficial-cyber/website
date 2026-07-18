function shouldUseMockData() {
    const params = new URLSearchParams(window.location.search);
    return params.get("mock") === "1";
}

const USE_MOCK_DATA = shouldUseMockData();
const API_BASE = "https://api.fintelliq.biz/api/v1";

function getPublicToken() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("user");
    if (fromQuery) {
        if (window.history.replaceState) {
            window.history.replaceState(null, "", `/portfolio/${encodeURIComponent(fromQuery)}`);
        }
        return fromQuery;
    }

    const portfolioMatch = window.location.pathname.match(/\/portfolio\/([^/]+)\/?$/);
    if (portfolioMatch && portfolioMatch[1] && portfolioMatch[1] !== "index.html") {
        return decodeURIComponent(portfolioMatch[1]);
    }

    const segment = window.location.pathname.split("/").filter(Boolean).pop();
    if (segment && segment !== "index.html" && !segment.endsWith(".html")) {
        return decodeURIComponent(segment);
    }

    return "demo";
}

function getMockOnboardingKey() {
    return `fintelliq_onboarded_${getPublicToken()}`;
}

function isOnboardingIncomplete(data) {
    return data?.onboardingIncomplete === true;
}

async function fetchPortfolio() {
    if (USE_MOCK_DATA) {
        const params = new URLSearchParams(window.location.search);

        if (params.get("onboarding") === "1") {
            return fetchMockJson("mock/onboarding-incomplete.json");
        }

        if (localStorage.getItem(getMockOnboardingKey()) !== "true") {
            return fetchMockJson("mock/onboarding-incomplete.json");
        }

        return fetchMockJson("mock/portfolio.json");
    }

    const url = API_BASE + "/portfolio/" + getPublicToken();
    const response = await fetch(url);

    if (response.status === 404) {
        throw new Error("Invalid or expired portfolio link.");
    }

    if (!response.ok) {
        throw new Error("Unable to load portfolio.");
    }

    return response.json();
}

async function fetchMockJson(path) {
    const response = await fetch(getPortfolioAssetUrl(path));
    if (!response.ok) {
        throw new Error("Unable to load portfolio.");
    }
    return response.json();
}

let stocksCache = null;

function getPortfolioAssetUrl(path) {
    const scripts = document.getElementsByTagName("script");
    for (const script of scripts) {
        if (script.src && script.src.includes("/js/api.js")) {
            return new URL(`../${path}`, script.src).href;
        }
    }

    return new URL(path, window.location.href).href;
}

function getStocksJsonUrl() {
    return getPortfolioAssetUrl("mock/stocks.json");
}

async function loadStocks() {
    if (stocksCache) {
        return stocksCache;
    }

    const response = await fetch(getStocksJsonUrl());
    if (!response.ok) {
        throw new Error("Unable to load stocks.");
    }

    stocksCache = await response.json();
    return stocksCache;
}

function getStockDisplayName(stock) {
    return stock.name || stock.companyName || stock.symbol;
}

async function searchStocks(query) {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) {
        return [];
    }

    const stocks = await loadStocks();
    const matches = stocks.filter(stock => {
        if (stock.active === false || stock.nifty500 !== true) {
            return false;
        }

        const symbol = (stock.symbol || "").toLowerCase();
        const name = getStockDisplayName(stock).toLowerCase();
        const companyName = (stock.companyName || "").toLowerCase();

        return symbol.includes(normalized) ||
            name.includes(normalized) ||
            companyName.includes(normalized);
    });

    return matches
        .sort((a, b) => scoreStockMatch(a, normalized) - scoreStockMatch(b, normalized))
        .slice(0, 8)
        .map(stock => ({
            symbol: stock.symbol,
            name: getStockDisplayName(stock)
        }));
}

function scoreStockMatch(stock, query) {
    const symbol = (stock.symbol || "").toLowerCase();
    const name = getStockDisplayName(stock).toLowerCase();

    if (symbol === query) return 0;
    if (symbol.startsWith(query)) return 1;
    if (name.startsWith(query)) return 2;
    return 3;
}

async function submitOnboarding(payload) {
    if (USE_MOCK_DATA) {
        localStorage.setItem(getMockOnboardingKey(), "true");
        localStorage.setItem(
            `fintelliq_prefs_${getPublicToken()}`,
            JSON.stringify(payload)
        );
        return { success: true };
    }

    const response = await fetch(
        `${API_BASE}/user/${getPublicToken()}/onboarding`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }
    );

    if (!response.ok) {
        throw new Error("Unable to complete onboarding.");
    }

    return response.json();
}

function formatCurrency(value) {
    const abs = Math.abs(value);
    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(abs);
    return value < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

function formatCurrencyCompact(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatCurrencyShort(value) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (abs >= 10000000) {
        return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    }
    if (abs >= 100000) {
        return `${sign}₹${(abs / 100000).toFixed(2)}L`;
    }
    if (abs >= 1000) {
        return `${sign}₹${(abs / 1000).toFixed(1)}K`;
    }

    return formatCurrency(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${Number(value).toFixed(2)}%`;
}

function formatSignedCurrency(value) {
    const sign = value >= 0 ? "+" : "-";
    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(value));
    return `${sign}₹${formatted}`;
}

function isPositive(value) {
    return value >= 0;
}

function getTrendClass(value) {
    return value >= 0 ? "positive" : "negative";
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

const PortfolioAPI = {
    fetchPortfolio,
    isOnboardingIncomplete,
    loadStocks,
    searchStocks,
    submitOnboarding,
    getPublicToken,
    formatCurrency,
    formatCurrencyCompact,
    formatCurrencyShort,
    formatNumber,
    formatPercent,
    formatSignedCurrency,
    formatDate,
    getTrendClass,
    isPositive
};
