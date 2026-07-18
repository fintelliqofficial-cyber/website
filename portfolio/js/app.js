function showView(view) {
    const loading = document.getElementById("loadingView");
    const onboarding = document.getElementById("onboardingView");
    const dashboard = document.getElementById("dashboardView");

    loading.classList.toggle("hidden", view !== "loading");
    onboarding.classList.toggle("hidden", view !== "onboarding");
    dashboard.classList.toggle("hidden", view !== "dashboard");

    if (view !== "dashboard") {
        PortfolioUI.closeListModal();
    }
}

window.showView = showView;

function renderDashboard(data) {
    PortfolioUI.renderHeader(data);
    PortfolioUI.renderPortfolioSummary(data.portfolio, data.holdings);
    PortfolioCharts.renderAllocationChart(data.allocation);
    PortfolioCharts.renderAllocationLegend(data.allocation);
    PortfolioCharts.renderSectorChart(data.sectorPerformance);
    PortfolioUI.renderHoldings(data.holdings);
    PortfolioUI.renderWatchlist(data.watchlist);
}

async function initDashboard(existingData) {
    const data = existingData || await PortfolioAPI.fetchPortfolio();

    if (PortfolioAPI.isOnboardingIncomplete(data)) {
        throw new Error("Onboarding required.");
    }

    renderDashboard(data);
    return data;
}

function getEditCallbacks() {
    return {
        onEditComplete: async () => {
            showView("loading");
            try {
                const data = await initDashboard();
                DashboardActions.init(data, getEditCallbacks());
                showView("dashboard");
            } catch (error) {
                console.error(error);
                showView("dashboard");
                PortfolioUI.showError("Unable to load your portfolio. Please try again later.");
            }
        },
        onEditCancel: () => {
            showView("dashboard");
        }
    };
}

async function initApp() {
    showView("loading");

    try {
        const data = await PortfolioAPI.fetchPortfolio();

        if (PortfolioAPI.isOnboardingIncomplete(data)) {
            showView("onboarding");
            Onboarding.init(async () => {
                showView("loading");
                try {
                    const portfolio = await initDashboard();
                    DashboardActions.init(portfolio, getEditCallbacks());
                    showView("dashboard");
                } catch (error) {
                    console.error(error);
                    showView("dashboard");
                    PortfolioUI.showError("Unable to load your portfolio. Please try again later.");
                }
            });
            return;
        }

        renderDashboard(data);
        DashboardActions.init(data, getEditCallbacks());
        showView("dashboard");
    } catch (error) {
        console.error(error);
        showView("dashboard");
        PortfolioUI.showError(
            error.message === "Invalid or expired portfolio link."
                ? "This portfolio link is invalid or has expired."
                : "Unable to load your portfolio. Please try again later."
        );
    }
}

document.addEventListener("DOMContentLoaded", initApp);
