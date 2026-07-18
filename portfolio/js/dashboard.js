let portfolioData = null;
let callbacks = null;

function mapHoldings(holdings) {
    return holdings.map(stock => ({
        symbol: stock.symbol,
        name: stock.companyName || stock.name || stock.symbol,
        quantity: stock.quantity,
        avgPrice: stock.avgPrice
    }));
}

function mapWatchlist(watchlist) {
    return watchlist.map(stock => ({
        symbol: stock.symbol,
        name: stock.companyName || stock.name || stock.symbol
    }));
}

function init(data, cbs) {
    portfolioData = data;
    callbacks = cbs;
    PortfolioUI.updateViewAllButtons(
        (data.holdings || []).length,
        (data.watchlist || []).length,
        PortfolioUI.PREVIEW_LIMIT
    );
}

function isDashboardActive() {
    const dashboard = document.getElementById("dashboardView");
    return dashboard && !dashboard.classList.contains("hidden");
}

function handleAction(action) {
    if (!isDashboardActive() || !portfolioData) return;

    switch (action) {
        case "edit-holdings":
            openPortfolioEdit(2, 2);
            break;
        case "edit-watchlist":
            openPortfolioEdit(3, 3);
            break;
        case "view-holdings":
            PortfolioUI.openListModal("holdings", portfolioData.holdings || []);
            break;
        case "view-watchlist":
            PortfolioUI.openListModal("watchlist", portfolioData.watchlist || []);
            break;
        case "stocks-moved":
            toggleMoversPanel();
            break;
        case "close-modal":
            PortfolioUI.closeListModal();
            break;
    }
}

function openPortfolioEdit(startStep, exitStep = startStep) {
    if (!callbacks || typeof window.showView !== "function") return;

    window.showView("onboarding");

    Onboarding.initEdit({
        holdings: mapHoldings(portfolioData.holdings || []),
        watchlist: mapWatchlist(portfolioData.watchlist || []),
        startStep,
        exitStep,
        onComplete: callbacks.onEditComplete,
        onCancel: callbacks.onEditCancel
    });
}

function toggleMoversPanel() {
    const panel = document.getElementById("moversPanel");
    if (!panel || !portfolioData) return;

    if (!panel.classList.contains("hidden")) {
        panel.classList.add("hidden");
        return;
    }

    const movers = PortfolioUI.getMovedHoldings(portfolioData.holdings || [], 3);

    if (movers.length === 0) {
        panel.innerHTML = `<p class="moversEmpty">No significant movement in your holdings today.</p>`;
    } else {
        panel.innerHTML = movers.map(stock => {
            const trendClass = PortfolioAPI.getTrendClass(stock.changePercent);
            const name = stock.companyName || stock.name || stock.symbol;
            return `
                <div class="moversRow">
                    <span class="moversName">${name}</span>
                    <span class="moversChange ${trendClass}">
                        ${PortfolioAPI.formatPercent(stock.changePercent)}
                    </span>
                </div>
            `;
        }).join("");
    }

    panel.classList.remove("hidden");
}

document.addEventListener("click", event => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    if (target.dataset.action === "close-modal") {
        handleAction("close-modal");
        return;
    }

    if (!isDashboardActive()) return;
    if (!document.getElementById("dashboardView").contains(target)) return;

    event.preventDefault();
    handleAction(target.dataset.action);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        PortfolioUI.closeListModal();
    }
});

const DashboardActions = { init };
