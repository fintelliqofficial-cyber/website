const PREVIEW_LIMIT = 5;

function escapeAttr(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
}

function buildTableHeadCell(primary, secondary, align = "left") {
    return `
        <th>
            <div class="tableHeadCell tableHeadCell--${align}">
                <span class="thPrimary">${primary}</span>
                ${secondary ? `<span class="thSecondary">${secondary}</span>` : ""}
            </div>
        </th>
    `;
}

const HOLDINGS_TABLE_HEAD = `
    <tr>
        ${buildTableHeadCell("Stock", "Sector")}
        ${buildTableHeadCell("Avg Price", "Quantity", "right")}
        ${buildTableHeadCell("Holding Value", "Last Traded Price", "right")}
        ${buildTableHeadCell("Change %", "Amount", "right")}
        ${buildTableHeadCell("Weight", "Allocation", "right")}
    </tr>
`;

const WATCHLIST_TABLE_HEAD = `
    <tr>
        ${buildTableHeadCell("Stock", "Sector")}
        ${buildTableHeadCell("Price", "Last Traded Price", "right")}
        ${buildTableHeadCell("Change %", "Amount", "right")}
    </tr>
`;

function buildTwoLineCell(primary, secondary, options = {}) {
    const {
        align = "left",
        title = "",
        primaryClass = "cellPrimary",
        secondaryClass = "cellSecondary"
    } = options;
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";

    return `
        <div class="tableCell tableCell--${align}"${titleAttr}>
            <span class="${primaryClass}">${primary}</span>
            ${secondary ? `<span class="${secondaryClass}">${secondary}</span>` : ""}
        </div>
    `;
}

function getHoldingDisplayName(stock) {
    const names = {
        HDFCBANK: "HDFC Bank",
        HCLTECH: "HCL Tech",
        ICICIBANK: "ICICI Bank",
        RELIANCE: "Reliance",
        INFY: "Infosys"
    };
    return names[stock.symbol] || stock.companyName || stock.symbol;
}

function getWatchlistDisplayName(stock) {
    const names = {
        MARUTI: "Maruti Suzuki",
        ADANIGREEN: "Adani Green",
        LT: "L&T"
    };
    return names[stock.symbol] || stock.companyName || stock.name || stock.symbol;
}

function getSectorName(stock) {
    return stock.sectorName || stock.sectorId || "";
}

function getHoldingValue(stock) {
    return (stock.currentPrice || 0) * (stock.quantity || 0);
}

function renderHeader(data) {
    const dateEl = document.getElementById("dashboardDate");
    if (dateEl) {
        dateEl.textContent = PortfolioAPI.formatDate(data.generatedAt);
    }
}

function getMovedHoldings(holdings, limit = 3) {
    const topLimit = typeof limit === "number" && limit > 0 ? limit : 3;
    const pool = holdings || [];
    const flagged = pool.filter(stock => stock.movedToday === true);
    const candidates = flagged.length > 0
        ? flagged
        : pool.filter(stock => stock.changePercent !== 0);

    return [...candidates]
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, topLimit);
}

function renderPortfolioSummary(portfolio, holdings = []) {
    const valueEl = document.getElementById("portfolioValue");
    const changeEl = document.getElementById("portfolioChange");
    const impactEl = document.getElementById("impactCount");

    if (valueEl) {
        valueEl.textContent = PortfolioAPI.formatCurrency(portfolio.currentValue);
    }

    if (changeEl) {
        const trendClass = PortfolioAPI.getTrendClass(portfolio.todayChange);
        const sign = portfolio.todayChange >= 0 ? "+" : "";
        changeEl.className = `portfolioChange ${trendClass}`;
        changeEl.innerHTML = `
            <span class="changeAmount">${sign}${PortfolioAPI.formatCurrency(portfolio.todayChange).replace("-", "")}</span>
            <span class="changePercent">(${PortfolioAPI.formatPercent(portfolio.todayChangePercent)})</span>
        `;
    }

    if (impactEl) {
        const movers = getMovedHoldings(holdings, 3);
        const count = movers.length || portfolio.holdingsImpacted || 0;
        impactEl.textContent = `Top ${count} stock${count === 1 ? "" : "s"} moved today`;
    }
}

function buildStockCell(stock, displayName) {
    const sectorName = getSectorName(stock);
    return buildTwoLineCell(displayName, sectorName, {
        title: sectorName ? `${displayName} · ${sectorName}` : displayName,
        primaryClass: "cellPrimary stockSymbol",
        secondaryClass: "cellSecondary stockSector"
    });
}

function getHoldingDayChangeAmount(stock) {
    return (stock.changeAmount || 0) * (stock.quantity || 0);
}

function buildChangeCell(stock, options = {}) {
    const trendClass = PortfolioAPI.getTrendClass(stock.changePercent);
    const changeAmount = options.useHoldingTotal
        ? getHoldingDayChangeAmount(stock)
        : (stock.changeAmount || 0);

    return `
        <div class="changeCell ${trendClass}">
            <span class="changePercentVal">${PortfolioAPI.formatPercent(stock.changePercent)}</span>
            <span class="changeAmountVal">(${PortfolioAPI.formatSignedCurrency(changeAmount)})</span>
        </div>
    `;
}

function buildHoldingsRows(holdings) {
    return holdings.map(stock => {
        const displayName = getHoldingDisplayName(stock);
        const holdingValue = getHoldingValue(stock);

        return `
            <tr>
                <td>${buildStockCell(stock, displayName)}</td>
                <td>
                    ${buildTwoLineCell(
                        PortfolioAPI.formatCurrencyCompact(stock.avgPrice),
                        `${PortfolioAPI.formatNumber(stock.quantity)} qty`,
                        { align: "right" }
                    )}
                </td>
                <td>
                    ${buildTwoLineCell(
                        PortfolioAPI.formatCurrencyShort(holdingValue),
                        PortfolioAPI.formatCurrencyCompact(stock.currentPrice),
                        { align: "right" }
                    )}
                </td>
                <td>${buildChangeCell(stock, { useHoldingTotal: true })}</td>
                <td>
                    <div class="tableCell tableCell--right">
                        <span class="cellPrimary weightValue">${stock.weight}%</span>
                        <div class="progressBar">
                            <div class="progressFill" style="width:${Math.min(stock.weight * 5, 100)}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function buildWatchlistRows(watchlist) {
    return watchlist.map(stock => {
        const displayName = getWatchlistDisplayName(stock);

        return `
            <tr>
                <td>${buildStockCell(stock, displayName)}</td>
                <td>
                    <div class="tableCell tableCell--right">
                        <span class="cellPrimary">${PortfolioAPI.formatCurrencyCompact(stock.currentPrice)}</span>
                    </div>
                </td>
                <td>${buildChangeCell(stock)}</td>
            </tr>
        `;
    }).join("");
}

function renderHoldings(holdings, limit = PREVIEW_LIMIT) {
    const tbody = document.getElementById("holdingTable");
    const countEl = document.getElementById("holdingCount");
    if (!tbody) return;

    if (countEl) countEl.textContent = holdings.length;

    const preview = holdings.slice(0, limit);
    tbody.innerHTML = buildHoldingsRows(preview);
    updateViewAllButtons(holdings.length, null, limit);
}

function renderWatchlist(watchlist, limit = PREVIEW_LIMIT) {
    const tbody = document.getElementById("watchlistTable");
    const countEl = document.getElementById("watchCount");
    if (!tbody) return;

    if (countEl) countEl.textContent = watchlist.length;

    const preview = watchlist.slice(0, limit);
    tbody.innerHTML = buildWatchlistRows(preview);
    updateViewAllButtons(null, watchlist.length, limit);
}

function updateViewAllButtons(holdingsCount, watchlistCount, limit = PREVIEW_LIMIT) {
    const holdingsBtn = document.querySelector('[data-action="view-holdings"]');
    const watchlistBtn = document.querySelector('[data-action="view-watchlist"]');

    if (holdingsBtn && holdingsCount !== null) {
        holdingsBtn.classList.toggle("hidden", holdingsCount <= limit);
    }
    if (watchlistBtn && watchlistCount !== null) {
        watchlistBtn.classList.toggle("hidden", watchlistCount <= limit);
    }
}

function openListModal(type, items) {
    const modal = document.getElementById("listModal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");
    if (!modal || !title || !body) return;

    if (type === "holdings") {
        title.textContent = `All Holdings (${items.length})`;
        body.innerHTML = `
            <div class="tableScroll">
                <table class="portfolioTable holdingsTable">
                    <thead>${HOLDINGS_TABLE_HEAD}</thead>
                    <tbody>${buildHoldingsRows(items)}</tbody>
                </table>
            </div>
        `;
    } else {
        title.textContent = `All Watchlist (${items.length})`;
        body.innerHTML = `
            <div class="tableScroll">
                <table class="portfolioTable watchlistTable">
                    <thead>${WATCHLIST_TABLE_HEAD}</thead>
                    <tbody>${buildWatchlistRows(items)}</tbody>
                </table>
            </div>
        `;
    }

    modal.classList.remove("hidden");
    document.body.classList.add("modalOpen");
}

function closeListModal() {
    const modal = document.getElementById("listModal");
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("modalOpen");
}

function showError(message) {
    const page = document.querySelector("#dashboardView .page");
    if (!page) return;

    page.innerHTML = `
        <div class="emptyState">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${message}</p>
        </div>
    `;
}

const PortfolioUI = {
    PREVIEW_LIMIT,
    getMovedHoldings,
    renderHeader,
    renderPortfolioSummary,
    renderHoldings,
    renderWatchlist,
    updateViewAllButtons,
    openListModal,
    closeListModal,
    showError
};
