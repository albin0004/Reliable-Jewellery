// Elements - Category 1
const usdInput = document.getElementById('usd-input');
const ounceRateInput = document.getElementById('ounce-rate-input');
const purityInput = document.getElementById('purity-input');
const aedRateInput = document.getElementById('aed-rate');
const resultDisplay = document.getElementById('result-display');
const refreshBtn = document.getElementById('refresh-rate-btn');
const liveStatusText = document.getElementById('live-status-text');
const liveIndicator = document.querySelector('.live-indicator');

// Elements - Category 2
const c2GoldPriceInput = document.getElementById('c2-gold-price-input');
const c2ItemWeight = document.getElementById('c2-item-weight');
const c2MakingCost = document.getElementById('c2-making-cost');
const c2GoldStone = document.getElementById('c2-gold-stone');
const c2Purity = document.getElementById('c2-purity');
const c2ManualBadge = document.getElementById('c2-manual-badge');

// Elements - Category 3
const c3GoldPriceInput = document.getElementById('c3-gold-price-input');
const c3ItemWeight = document.getElementById('c3-item-weight');
const c3MakingCost = document.getElementById('c3-making-cost');
const c3GoldStone = document.getElementById('c3-gold-stone');
const c3ManualPurity = document.getElementById('c3-manual-purity');
const c3ManualBadge = document.getElementById('c3-manual-badge');
const purityResultsContainer = document.getElementById('purity-results-container');

// Results - Category 2
const resPurePrice = document.getElementById('res-pure-price');
const resPureWeight = document.getElementById('res-pure-weight');
const resSaleAmount = document.getElementById('res-sale-amount');
const resCost = document.getElementById('res-cost');
const resProfit = document.getElementById('res-profit');
const resProfitPercent = document.getElementById('res-profit-percent');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Constants
const API_URL = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_AED_RATE = 3.6725;
const FIXED_PURITIES = [0.75, 0.725, 0.7, 0.68, 0.675, 0.65, 0.6, 0.55];

// State
let currentAedRate = 3.6725;
// Flags to track if user has manually overridden the linked price
let isLinkedPriceOverridden = false;
let isLinkedPriceOverriddenC3 = false;
let lastCategory1Result = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchLiveRate();
    // Set initial calculations or zeros
    calculateResult();
    calculateCategory2();
    calculateCategory3();
});

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Deactivate all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate current
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Event Listeners - Category 1
[usdInput, ounceRateInput, purityInput].forEach(input => {
    input.addEventListener('input', () => {
        calculateResult();
        updateLinkedPrice();
    });
});

// AED Rate Manual Input
aedRateInput.addEventListener('input', () => {
    const val = parseFloat(aedRateInput.value);
    if (!isNaN(val)) {
        currentAedRate = val;
        calculateResult();
        updateLinkedPrice();
    }
});

refreshBtn.addEventListener('click', () => {
    refreshBtn.querySelector('i').classList.add('fa-spin');
    fetchLiveRate().finally(() => {
        setTimeout(() => {
            refreshBtn.querySelector('i').classList.remove('fa-spin');
        }, 500);
    });
});

// Event Listeners - Category 2
[c2ItemWeight, c2MakingCost, c2GoldStone, c2Purity].forEach(input => {
    input.addEventListener('input', calculateCategory2);
});

// Linked input C2
c2GoldPriceInput.addEventListener('input', () => {
    isLinkedPriceOverridden = true;
    if (c2ManualBadge) {
        c2ManualBadge.textContent = "Manual";
        c2ManualBadge.style.color = "var(--text-secondary)";
    }
    calculateCategory2();
});

// Event Listeners - Category 3
[c3ItemWeight, c3MakingCost, c3GoldStone, c3ManualPurity].forEach(input => {
    input.addEventListener('input', calculateCategory3);
});

// Linked input C3
c3GoldPriceInput.addEventListener('input', () => {
    isLinkedPriceOverriddenC3 = true;
    if (c3ManualBadge) {
        c3ManualBadge.textContent = "Manual";
        c3ManualBadge.style.color = "var(--text-secondary)";
    }
    calculateCategory3();
});


// Functions
async function fetchLiveRate() {
    try {
        liveStatusText.textContent = 'Updating...';
        liveIndicator.style.color = '#fff';

        const response = await fetch(API_URL);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data && data.rates && data.rates.AED) {
            // Only overwrite if user hasn't focused it / modified just now?
            // Standard behavior: Refresh button overwrites. Load overwrites.
            currentAedRate = data.rates.AED;
            aedRateInput.value = currentAedRate.toFixed(4);

            liveStatusText.textContent = 'Live';
            liveIndicator.style.color = 'var(--success-color)';
            document.querySelector('.pulse-dot').style.backgroundColor = 'var(--success-color)';

            calculateResult();
            updateLinkedPrice();
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Error fetching rate:', error);
        liveStatusText.textContent = 'Offline (Est.)';
        liveIndicator.style.color = '#ff9500';
        document.querySelector('.pulse-dot').style.backgroundColor = '#ff9500';

        if (!aedRateInput.value) aedRateInput.value = FALLBACK_AED_RATE;
        currentAedRate = parseFloat(aedRateInput.value);
        calculateResult();
    }
}

function calculateResult() {
    const usd = parseFloat(usdInput.value);
    const ounce = parseFloat(ounceRateInput.value);
    const purity = parseFloat(purityInput.value);
    const dirham = currentAedRate;

    if (isNaN(usd) || isNaN(ounce) || isNaN(purity) || ounce === 0) {
        resultDisplay.textContent = "0.0000";
        lastCategory1Result = 0;
        return;
    }

    // Formula: Result = (USD / Ounce Rate) * Dirham * Purity
    const result = (usd / ounce) * dirham * purity;
    lastCategory1Result = result;

    resultDisplay.textContent = result.toFixed(4);
}

function updateLinkedPrice() {
    // Propagate to Cat 2 and Cat 3
    const price = lastCategory1Result.toFixed(4);

    if (!isLinkedPriceOverridden) {
        c2GoldPriceInput.value = price;
        calculateCategory2();
    }

    if (!isLinkedPriceOverriddenC3) {
        c3GoldPriceInput.value = price;
        calculateCategory3();
    }
}

function calculateCategory2() {
    // Inputs
    const goldPrice18k = parseFloat(c2GoldPriceInput.value);
    const itemWeight = parseFloat(c2ItemWeight.value);
    const makingCost = parseFloat(c2MakingCost.value);
    const goldStone = parseFloat(c2GoldStone.value);
    const purity = parseFloat(c2Purity.value);

    // Initial check
    if (isNaN(goldPrice18k) || isNaN(itemWeight) || isNaN(makingCost) || isNaN(goldStone) || isNaN(purity) || purity === 0) {
        resPurePrice.textContent = "0.00";
        if (resPureWeight) resPureWeight.textContent = "0.000";
        resSaleAmount.textContent = "0.00";
        resCost.textContent = "0.00";
        resProfit.textContent = "0.00";
        resProfitPercent.textContent = "0.00%";
        resProfit.style.color = '#fff';
        resProfitPercent.style.color = '#fff';
        return;
    }

    // 1. Pure Weight = Gold with Stone * Purity
    const pureWeight = goldStone * purity;

    // 2. Pure Price = Gold Price for 18K (Standard 0.75) converted to 24K
    const purePrice = goldPrice18k / 0.75;

    // 3. Sale Amount = Pure Weight * Pure Price
    const saleAmount = pureWeight * purePrice;

    // 4. Cost = Item Weight * Gold Price for 18K + Making Cost
    const cost = (itemWeight * goldPrice18k) + makingCost;

    // 5. Profit = Sale Amount - Cost
    const profit = saleAmount - cost;

    // 6. Profit Percentage
    let profitPercent = 0;
    if (saleAmount !== 0) {
        profitPercent = (profit / saleAmount) * 100;
    }

    // Update UI
    resPurePrice.textContent = formatCurrency(purePrice);
    if (resPureWeight) resPureWeight.textContent = pureWeight.toFixed(3);
    resSaleAmount.textContent = formatCurrency(saleAmount);
    resCost.textContent = formatCurrency(cost);
    resProfit.textContent = formatCurrency(profit);
    resProfitPercent.textContent = profitPercent.toFixed(2) + '%';

    // Color code profit
    if (profit > 0) {
        resProfit.style.color = 'var(--success-color)';
        resProfitPercent.style.color = 'var(--success-color)';
    } else if (profit < 0) {
        resProfit.style.color = '#ff3b30';
        resProfitPercent.style.color = '#ff3b30';
    } else {
        resProfit.style.color = '#fff';
        resProfitPercent.style.color = '#fff';
    }
}

function calculateCategory3() {
    // Inputs
    const goldPrice18k = parseFloat(c3GoldPriceInput.value);
    const itemWeight = parseFloat(c3ItemWeight.value);
    const makingCost = parseFloat(c3MakingCost.value);
    const goldStone = parseFloat(c3GoldStone.value);
    const manualPurity = parseFloat(c3ManualPurity.value);

    purityResultsContainer.innerHTML = '';

    // Validation
    if (isNaN(goldPrice18k) || isNaN(itemWeight) || isNaN(makingCost) || isNaN(goldStone)) {
        purityResultsContainer.innerHTML = '<div class="purity-placeholder">Enter all item details to see analysis</div>';
        return;
    }

    // Cost (Constant for all purities)
    const totalCost = (itemWeight * goldPrice18k) + makingCost;

    // Price Base (24K Price)
    const purePrice = goldPrice18k / 0.75;

    // Purity List
    let purities = [...FIXED_PURITIES];
    if (!isNaN(manualPurity) && manualPurity > 0) {
        // Add manual purity if not present (or even if present, maybe highlight?)
        // We'll just add it to top
        if (!purities.includes(manualPurity)) {
            purities = [manualPurity, ...purities];
        }
    }

    purities.forEach(p => {
        // Pure Weight
        const pureWeight = goldStone * p;

        // Sale Amount
        const saleAmount = pureWeight * purePrice;

        // Profit
        const profit = saleAmount - totalCost;

        // Profit %
        let profitPercent = 0;
        if (saleAmount !== 0) {
            profitPercent = (profit / saleAmount) * 100;
        }

        // Render Card
        const card = document.createElement('div');
        card.className = 'purity-card';

        const isProfit = profit >= 0;
        const profitColor = isProfit ? 'var(--success-color)' : '#ff3b30';

        // Check if manual
        const isManual = (p === manualPurity);

        // Updated for Horizontal Row Layout
        card.innerHTML = `
            <div class="purity-data-point main">
                <span class="purity-point-label">Purity</span>
                <span class="purity-point-value purity-id">
                    ${p} ${isManual && !FIXED_PURITIES.includes(p) ? '<i class="fa-solid fa-pen" style="font-size:0.7rem; opacity:0.6; margin-left:5px;"></i>' : ''}
                </span>
            </div>
            
            <div class="purity-data-point">
                <span class="purity-point-label">Pure Wt</span>
                <span class="purity-point-value">${pureWeight.toFixed(3)}</span>
            </div>

            <div class="purity-data-point end">
                <span class="purity-point-label">Profit %</span>
                <span class="purity-point-value highlight" style="color: ${profitColor}">${profitPercent.toFixed(2)}%</span>
            </div>
        `;
        purityResultsContainer.appendChild(card);
    });
}

function formatCurrency(num) {
    if (isNaN(num)) return "0.00";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// History Recording Code Omitted for brevity as it was not requested for Cat 3
// (Existing Cat 1 and Cat 2 history code remains if we didn't delete it.
// The replace operation above REPLACED the whole file contents so we need to put the History code back!)
// WAIT. My replacement content did NOT include the history code.
// I must include the existing history code. 

// ... (Restoring history code) ...

const recordBtn1 = document.getElementById('record-btn-1');
const historySection1 = document.getElementById('history-section-1');
const historyTable1Body = document.querySelector('#history-table-1 tbody');

const recordBtn2 = document.getElementById('record-btn-2');
const historySection2 = document.getElementById('history-section-2');
const historyTable2Body = document.querySelector('#history-table-2 tbody');

recordBtn1.addEventListener('click', () => {
    // Get values
    const usd = usdInput.value;
    const ounce = ounceRateInput.value;
    const purity = purityInput.value;
    const aed = aedRateInput.value;
    const result = resultDisplay.textContent;

    if (!usd || !ounce) return;

    const row = document.createElement('tr');
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
        <td>${time}</td>
        <td>$${usd}</td>
        <td>${ounce}</td>
        <td>${purity}</td>
        <td>${aed}</td>
        <td style="color: var(--accent-gold); font-weight: bold;">${result}</td>
        <td><button class="delete-btn"><i class="fa-solid fa-trash"></i></button></td>
    `;

    row.querySelector('.delete-btn').addEventListener('click', () => {
        row.remove();
        if (historyTable1Body.children.length === 0) {
            historySection1.style.display = 'none';
        }
    });

    historyTable1Body.prepend(row);
    historySection1.style.display = 'block';
});

if (recordBtn2) {
    recordBtn2.addEventListener('click', () => {
        const weight = c2ItemWeight.value;
        const purity = c2Purity.value;
        const sale = resSaleAmount.textContent;
        const cost = resCost.textContent;
        const profit = resProfit.textContent;
        const percent = resProfitPercent.textContent;

        if (!weight) return;

        const row = document.createElement('tr');
        const profitColor = resProfit.style.color;

        row.innerHTML = `
            <td>${weight}g</td>
            <td>${purity}</td>
            <td>${sale}</td>
            <td>${cost}</td>
            <td style="color: ${profitColor}">${profit}</td>
            <td style="color: ${profitColor}">${percent}</td>
            <td><button class="delete-btn"><i class="fa-solid fa-trash"></i></button></td>
        `;

        row.querySelector('.delete-btn').addEventListener('click', () => {
            row.remove();
            if (historyTable2Body.children.length === 0) {
                historySection2.style.display = 'none';
            }
        });

        historyTable2Body.prepend(row);
        historySection2.style.display = 'block';
    });
}
