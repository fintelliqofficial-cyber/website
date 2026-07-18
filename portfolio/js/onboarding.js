const INTERESTS = [
    { id: "markets", label: "Markets", icon: "fa-chart-line", iconClass: "markets" },
    { id: "economy", label: "Economy", icon: "fa-building-columns", iconClass: "economy" },
    { id: "commodities", label: "Commodities", icon: "fa-droplet", iconClass: "commodities" },
    { id: "crypto", label: "Crypto", icon: "fa-bitcoin-sign", iconClass: "crypto" },
    { id: "mutualFunds", label: "Mutual Funds", icon: "fa-chart-pie", iconClass: "mutualFunds" },
    { id: "ipoStocks", label: "IPO / Stocks", icon: "fa-link", iconClass: "ipoStocks" }
];

const WELCOME_FEATURES = [
    "Daily market & news summary",
    "Personalized portfolio insights",
    "AI explanations that matter",
    "All on WhatsApp, all in one place"
];

const state = {
    step: 1,
    holdings: [],
    watchlist: [],
    interests: ["markets", "commodities", "mutualFunds"],
    searchQuery: "",
    searchResults: [],
    searchOpen: false,
    showHoldingErrors: false,
    isSubmitting: false,
    isEditMode: false,
    editStartStep: 1,
    editExitStep: 4,
    error: null
};

let searchDebounceTimer = null;
let onCompleteCallback = null;
let onCancelCallback = null;
let eventsBound = false;

function resetState() {
    state.holdings = [];
    state.watchlist = [];
    state.interests = ["markets", "commodities", "mutualFunds"];
    state.error = null;
    state.searchQuery = "";
    state.searchResults = [];
    state.searchOpen = false;
    state.showHoldingErrors = false;
    state.isSubmitting = false;
    state.isEditMode = false;
    state.editStartStep = 1;
    state.editExitStep = 4;
}

function loadSavedInterests() {
    try {
        const key = `fintelliq_prefs_${PortfolioAPI.getPublicToken?.() || "demo"}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            const prefs = JSON.parse(raw);
            if (Array.isArray(prefs.interests) && prefs.interests.length > 0) {
                state.interests = prefs.interests;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function init(onComplete) {
    onCompleteCallback = onComplete;
    onCancelCallback = null;
    resetState();
    state.step = 1;

    bindEvents();

    render();
}

function initEdit({ holdings = [], watchlist = [], startStep = 2, exitStep = 3, onComplete, onCancel }) {
    onCompleteCallback = onComplete;
    onCancelCallback = onCancel || null;
    resetState();
    state.isEditMode = true;
    state.editStartStep = startStep;
    state.editExitStep = exitStep;
    state.step = startStep;
    state.holdings = holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity ?? "",
        avgPrice: h.avgPrice ?? ""
    }));
    state.watchlist = watchlist.map(w => ({
        symbol: w.symbol,
        name: w.name
    }));
    loadSavedInterests();

    bindEvents();

    render();
}

function renderProgress() {
    const progressEl = document.getElementById("onboardingProgress");
    if (!progressEl) return;

    let html = "";
    for (let i = 1; i <= 4; i++) {
        const active = i <= state.step;
        html += `<span class="progressDot${active ? " active" : ""}"></span>`;
        if (i < 4) {
            html += `<span class="progressLine${i < state.step ? " active" : ""}"></span>`;
        }
    }
    progressEl.innerHTML = html;
}

function renderBackButton() {
    const backEl = document.getElementById("onboardingBack");
    if (!backEl) return;

    const showBack = state.step > 1 && !state.isSubmitting;

    backEl.innerHTML = showBack
        ? `<button type="button" class="btnBack" data-action="back"><i class="fa-solid fa-arrow-left"></i> Back</button>`
        : "";
}

function isQuantityInvalid(stock) {
    const qty = Number(stock.quantity);
    return !stock.quantity && stock.quantity !== 0
        ? true
        : isNaN(qty) || qty <= 0 || !Number.isInteger(qty);
}

function isAvgPriceInvalid(stock) {
    const avg = Number(stock.avgPrice);
    return !stock.avgPrice && stock.avgPrice !== 0
        ? true
        : isNaN(avg) || avg <= 0;
}

function validateHoldings() {
    if (state.holdings.length === 0) {
        return { valid: true };
    }

    for (const stock of state.holdings) {
        if (isQuantityInvalid(stock)) {
            return {
                valid: false,
                message: `Please enter a valid quantity for ${stock.name}.`
            };
        }
        if (isAvgPriceInvalid(stock)) {
            return {
                valid: false,
                message: `Please enter a valid average price for ${stock.name}.`
            };
        }
    }

    return { valid: true };
}

function renderWelcome() {
    return `
        <div class="onboardingLogo">
            <span class="logo-dark">Fintelli</span><span class="logo-green">Q</span>
        </div>

        <div class="onboardingIllustration">
            <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="90" width="18" height="50" rx="4" fill="#E2E8F0"/>
                <rect x="58" y="70" width="18" height="70" rx="4" fill="#86EFAC"/>
                <rect x="86" y="50" width="18" height="90" rx="4" fill="#4ADE80"/>
                <rect x="114" y="65" width="18" height="75" rx="4" fill="#22C55E"/>
                <rect x="142" y="40" width="18" height="100" rx="4" fill="#16A34A"/>
                <polyline points="20,100 50,80 80,90 110,55 140,65 170,35 200,45"
                    stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="170" cy="120" r="28" fill="none" stroke="#E2E8F0" stroke-width="12"/>
                <circle cx="170" cy="120" r="28" fill="none" stroke="#16A34A" stroke-width="12"
                    stroke-dasharray="110 176" stroke-linecap="round" transform="rotate(-90 170 120)"/>
            </svg>
        </div>

        <h1 class="onboardingTitle">Welcome to FintelliQ</h1>
        <p class="onboardingSubtitle">
            Get AI-powered insights on markets, news and your portfolio, all in one place.
        </p>

        <ul class="featureList">
            ${WELCOME_FEATURES.map(f => `
                <li>
                    <span class="featureCheck"><i class="fa-solid fa-check"></i></span>
                    ${f}
                </li>
            `).join("")}
        </ul>

        <div class="onboardingFooter">
            <button class="btnPrimary" type="button" data-action="next">Let's Get Started</button>
            <p class="onboardingHint">It takes less than 2 minutes</p>
        </div>
    `;
}

function renderSearchInput(placeholder) {
    return `
        <div class="searchWrapper${state.searchOpen ? " is-open" : ""}">
            <i class="fa-solid fa-magnifying-glass searchIcon"></i>
            <input
                class="searchInput"
                type="text"
                placeholder="${placeholder}"
                value="${escapeHtml(state.searchQuery)}"
                data-input="search"
                autocomplete="off"
                spellcheck="false"
            />
            <div class="searchDropdown" id="searchDropdown" role="listbox"></div>
        </div>
    `;
}

function renderSearchDropdown() {
    const dropdown = document.getElementById("searchDropdown");
    const wrapper = document.querySelector(".searchWrapper");
    if (!dropdown) return;

    const query = state.searchQuery.trim();
    const shouldShow = state.searchOpen && query.length >= 2;

    if (wrapper) {
        wrapper.classList.toggle("is-open", shouldShow);
    }

    if (!shouldShow) {
        dropdown.innerHTML = "";
        document.querySelectorAll(".emptyStockHint").forEach(el => {
            el.style.display = "";
        });
        return;
    }

    document.querySelectorAll(".emptyStockHint").forEach(el => {
        el.style.display = "none";
    });

    if (state.searchResults.length === 0) {
        dropdown.innerHTML = `<div class="searchEmpty">No stocks found for "${escapeHtml(query)}"</div>`;
        return;
    }

    dropdown.innerHTML = state.searchResults.map(stock => `
        <button type="button" class="searchResultItem" data-action="select-stock" data-symbol="${stock.symbol}" role="option">
            <span class="searchResultLeft">
                <span class="searchResultSymbol">${escapeHtml(stock.symbol)}</span>
                <span class="searchResultName">${escapeHtml(stock.name)}</span>
            </span>
            <span class="searchResultAdd"><i class="fa-solid fa-plus"></i></span>
        </button>
    `).join("");
}

function renderHoldingsStep() {
    const holdingsHtml = state.holdings.length === 0
        ? (state.searchOpen ? "" : `<p class="emptyStockHint">No holdings added yet. Search above or skip this step if you only want a watchlist.</p>`)
        : state.holdings.map((stock, index) => `
            <div class="stockCard" data-index="${index}">
                <div class="stockCardHeader">
                    <span class="stockCardName">${escapeHtml(stock.name)}</span>
                    <button type="button" class="stockCardRemove" data-action="remove-holding" data-index="${index}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
                <div class="stockCardFields">
                    <div class="stockField">
                        <input type="number" placeholder="Quantity *" min="1" step="1"
                            class="${state.showHoldingErrors && isQuantityInvalid(stock) ? "inputError" : ""}"
                            value="${stock.quantity ?? ""}"
                            data-action="update-holding" data-index="${index}" data-field="quantity" />
                    </div>
                    <div class="stockField">
                        <input type="number" placeholder="Avg Price *" min="0.01" step="0.01"
                            class="${state.showHoldingErrors && isAvgPriceInvalid(stock) ? "inputError" : ""}"
                            value="${stock.avgPrice ?? ""}"
                            data-action="update-holding" data-index="${index}" data-field="avgPrice" />
                    </div>
                </div>
            </div>
        `).join("");

    return `
        <div class="stepHeader">
            <h2 class="stepTitle">Your Holdings</h2>
            <p class="stepSubtitle">Add the stocks you own</p>
            <span class="stepOptional">Optional — skip if you only want a watchlist. Quantity &amp; avg price required for each stock added.</span>
        </div>

        ${state.error ? `<div class="onboardingError">${escapeHtml(state.error)}</div>` : ""}

        ${renderSearchInput("Search stock")}

        <div class="stockList">${holdingsHtml}</div>

        <button type="button" class="addStockBtn" data-action="focus-search">+ Add Another Stock</button>

        <div class="onboardingActions">
            <div class="onboardingActionsRow">
                <button class="btnPrimary" type="button" data-action="next">${getStepPrimaryLabel(2)}</button>
                ${state.isEditMode ? "" : `<button class="btnSkip" type="button" data-action="skip-holdings">Skip — I only want a watchlist</button>`}
            </div>
        </div>
    `;
}

function renderWatchlistStep() {
    const watchlistHtml = state.watchlist.length === 0
        ? (state.searchOpen ? "" : `<p class="emptyStockHint">Add stocks you want to track. You can always add more later.</p>`)
        : state.watchlist.map((stock, index) => `
            <div class="watchlistRow">
                <span class="watchlistName">${escapeHtml(stock.name)}</span>
                <button type="button" class="watchlistRemove" data-action="remove-watchlist" data-index="${index}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join("");

    return `
        <div class="stepHeader">
            <h2 class="stepTitle">Your Watchlist</h2>
            <p class="stepSubtitle">Add the stocks you want to track</p>
        </div>

        ${state.error ? `<div class="onboardingError">${escapeHtml(state.error)}</div>` : ""}

        ${renderSearchInput("Search stock")}

        <div class="watchlistList">${watchlistHtml}</div>

        <button type="button" class="addStockBtn" data-action="focus-search">+ Add Another Stock</button>

        <div class="onboardingActions">
            <button class="btnPrimary" type="button" data-action="next">${getStepPrimaryLabel(3)}</button>
        </div>
    `;
}

function getStepPrimaryLabel(step) {
    if (state.isEditMode && step === state.editExitStep) {
        return "Save changes";
    }
    return "Continue";
}

function renderInterestsStep() {
    return `
        <div class="stepHeader">
            <h2 class="stepTitle">What interests you?</h2>
            <p class="stepSubtitle">Select what you want updates on</p>
        </div>

        ${state.error ? `<div class="onboardingError">${escapeHtml(state.error)}</div>` : ""}

        <div class="interestsGrid">
            ${INTERESTS.map(interest => {
                const selected = state.interests.includes(interest.id);
                return `
                    <button type="button"
                        class="interestCard${selected ? " selected" : ""}"
                        data-action="toggle-interest"
                        data-id="${interest.id}">
                        <span class="interestCheck"><i class="fa-solid fa-check"></i></span>
                        <span class="interestIcon ${interest.iconClass}">
                            <i class="fa-solid ${interest.icon}"></i>
                        </span>
                        <span class="interestLabel">${interest.label}</span>
                    </button>
                `;
            }).join("")}
        </div>

        <div class="onboardingActions">
            <button class="btnPrimary" type="button" data-action="submit"
                ${state.isSubmitting ? "disabled" : ""}>
                ${state.isSubmitting ? "Setting up..." : "Complete Setup"}
            </button>
        </div>
    `;
}

function render() {
    renderBackButton();
    renderProgress();

    const contentEl = document.getElementById("onboardingContent");
    if (!contentEl) return;

    let html = "";
    switch (state.step) {
        case 1: html = renderWelcome(); break;
        case 2: html = renderHoldingsStep(); break;
        case 3: html = renderWatchlistStep(); break;
        case 4: html = renderInterestsStep(); break;
    }

    contentEl.innerHTML = html;
    renderSearchDropdown();

    const searchInput = contentEl.querySelector("[data-input='search']");
    if (searchInput) {
        if (state.searchOpen) {
            searchInput.focus();
            searchInput.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
        }
    }
}

function isOnboardingActive() {
    const view = document.getElementById("onboardingView");
    return view && !view.classList.contains("hidden");
}

function bindEvents() {
    if (eventsBound) return;

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("input", handleDocumentInput);
    document.addEventListener("focusin", handleDocumentFocus);
    eventsBound = true;
}

function handleDocumentClick(e) {
    if (!isOnboardingActive()) return;

    const contentEl = document.getElementById("onboardingContent");
    const inSearchArea = e.target.closest(".searchWrapper") ||
        e.target.closest("[data-action='focus-search']");

    if (contentEl && contentEl.contains(e.target)) {
        handleContentClick(e);
    }

    if (e.target.closest("[data-action='back']")) {
        goBack();
        return;
    }

    if (inSearchArea) return;

    handleOutsideSearchClick(e);
}

function handleDocumentInput(e) {
    if (!isOnboardingActive()) return;

    const contentEl = document.getElementById("onboardingContent");
    if (!contentEl || !contentEl.contains(e.target)) return;

    handleContentInput(e);
}

function handleDocumentFocus(e) {
    if (!isOnboardingActive()) return;
    handleSearchFocus(e);
}

function handleSearchFocus(e) {
    if (!e.target.matches("[data-input='search']")) return;
    state.searchOpen = true;
    if (state.searchQuery.trim().length >= 2) {
        handleSearchInput(state.searchQuery);
    } else {
        renderSearchDropdown();
    }
}

function handleContentClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.dataset.action;

    if (action === "next") goNext();
    else if (action === "skip-holdings") skipHoldings();
    else if (action === "submit") submitOnboarding();
    else if (action === "focus-search") {
        const input = document.querySelector("[data-input='search']");
        if (input) {
            state.searchOpen = true;
            input.focus();
        }
    }
    else if (action === "select-stock") selectStock(el.dataset.symbol);
    else if (action === "remove-holding") removeHolding(Number(el.dataset.index));
    else if (action === "remove-watchlist") removeWatchlist(Number(el.dataset.index));
    else if (action === "toggle-interest") toggleInterest(el.dataset.id);
}

function handleContentInput(e) {
    const el = e.target.closest("[data-action='update-holding']");
    if (el) {
        updateHolding(Number(el.dataset.index), el.dataset.field, el.value);
        return;
    }

    if (e.target.matches("[data-input='search']")) {
        state.searchOpen = true;
        handleSearchInput(e.target.value);
    }
}

function handleOutsideSearchClick(e) {
    if (state.searchOpen || state.searchResults.length > 0) {
        state.searchOpen = false;
        state.searchResults = [];
        renderSearchDropdown();
    }
}

function goNext() {
    state.error = null;
    state.searchQuery = "";
    state.searchResults = [];
    state.searchOpen = false;

    if (state.step === 2) {
        const validation = validateHoldings();
        if (!validation.valid) {
            state.showHoldingErrors = true;
            state.error = validation.message;
            render();
            return;
        }
        state.showHoldingErrors = false;

        if (state.isEditMode && state.editExitStep === 2) {
            submitOnboarding();
            return;
        }
    }

    if (state.step === 3) {
        if (state.watchlist.length === 0 && state.holdings.length === 0) {
            state.error = "Please add at least one stock to your watchlist, or go back to add holdings.";
            render();
            return;
        }

        if (state.isEditMode && state.editExitStep === 3) {
            submitOnboarding();
            return;
        }
    }

    if (state.step < 4) {
        state.step++;
        render();
    }
}

function goBack() {
    if (state.step <= 1 || state.isSubmitting) return;

    if (state.isEditMode && state.step === state.editStartStep) {
        if (onCancelCallback) onCancelCallback();
        return;
    }

    state.error = null;
    state.searchQuery = "";
    state.searchResults = [];
    state.searchOpen = false;
    state.showHoldingErrors = false;
    state.step--;
    render();
}

function skipHoldings() {
    state.holdings = [];
    state.searchQuery = "";
    state.searchResults = [];
    state.searchOpen = false;
    state.showHoldingErrors = false;
    state.error = null;
    state.step = 3;
    render();
}

async function handleSearchInput(query) {
    state.searchQuery = query;
    state.searchOpen = true;
    clearTimeout(searchDebounceTimer);

    if (query.trim().length < 2) {
        state.searchResults = [];
        renderSearchDropdown();
        return;
    }

    searchDebounceTimer = setTimeout(async () => {
        try {
            const results = await PortfolioAPI.searchStocks(query);
            const existing = state.step === 2
                ? state.holdings.map(h => h.symbol)
                : state.watchlist.map(w => w.symbol);

            state.searchResults = results.filter(s => !existing.includes(s.symbol));
            renderSearchDropdown();

            const input = document.querySelector("[data-input='search']");
            if (input && document.activeElement === input) {
                input.focus();
            }
        } catch (error) {
            console.error(error);
            state.searchResults = [];
            renderSearchDropdown();
        }
    }, 200);
}

function selectStock(symbol) {
    const stock = state.searchResults.find(s => s.symbol === symbol);
    if (!stock) return;

    if (state.step === 2) {
        state.holdings.push({
            symbol: stock.symbol,
            name: stock.name,
            quantity: "",
            avgPrice: ""
        });
    } else if (state.step === 3) {
        state.watchlist.push({
            symbol: stock.symbol,
            name: stock.name
        });
    }

    state.searchQuery = "";
    state.searchResults = [];
    state.searchOpen = false;
    state.error = null;
    render();
}

function removeHolding(index) {
    state.holdings.splice(index, 1);
    render();
}

function removeWatchlist(index) {
    state.watchlist.splice(index, 1);
    render();
}

function updateHolding(index, field, value) {
    if (!state.holdings[index]) return;
    state.holdings[index][field] = value;
    state.showHoldingErrors = false;
    state.error = null;
}

function toggleInterest(id) {
    const idx = state.interests.indexOf(id);
    if (idx >= 0) {
        state.interests.splice(idx, 1);
    } else {
        state.interests.push(id);
    }
    render();
}

async function submitOnboarding() {
    if (!state.isEditMode && state.interests.length === 0) {
        state.error = "Please select at least one interest to continue.";
        render();
        return;
    }

    const holdingsValidation = validateHoldings();
    if (!holdingsValidation.valid) {
        state.showHoldingErrors = true;
        state.error = holdingsValidation.message;
        state.step = 2;
        render();
        return;
    }

    state.isSubmitting = true;
    state.error = null;
    render();

    const payload = {
        holdings: state.holdings.map(h => ({
            symbol: h.symbol,
            name: h.name,
            quantity: Number(h.quantity),
            avgPrice: Number(h.avgPrice)
        })),
        watchlist: state.watchlist.map(w => ({
            symbol: w.symbol,
            name: w.name
        })),
        interests: state.interests
    };

    try {
        await PortfolioAPI.submitOnboarding(payload);
        state.isSubmitting = false;
        if (onCompleteCallback) {
            onCompleteCallback();
        }
    } catch (error) {
        console.error(error);
        state.isSubmitting = false;
        state.error = "Something went wrong. Please try again.";
        render();
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

const Onboarding = { init, initEdit };
