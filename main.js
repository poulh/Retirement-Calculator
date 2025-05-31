function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateTable() {
    const yourAge = parseInt(document.getElementById('yourAge').value);
    const spouseAge = parseInt(document.getElementById('spouseAge').value);
    const yourLifeExpectancy = parseInt(document.getElementById('yourLifeExpectancy').value);
    const spouseLifeExpectancy = parseInt(document.getElementById('spouseLifeExpectancy').value);
    const initialValue = parseFloat(document.getElementById('initialValue').value);
    const firstYearWithdrawal = parseFloat(document.getElementById('firstYearWithdrawal').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const initialAdditionalIncome = parseFloat(document.getElementById('additionalIncome').value);
    const stockReturn = parseFloat(document.getElementById('stockReturn').value) / 100;

    // Calculate years left for each person
    const yourYearsLeft = yourLifeExpectancy - yourAge + 1;
    const spouseYearsLeft = spouseLifeExpectancy - spouseAge + 1;
    const planningYears = Math.max(yourYearsLeft, spouseYearsLeft);

    const tableBody = document.getElementById('tableBody');
    const summary = document.getElementById('summary');

    tableBody.innerHTML = '';

    let portfolioValue = initialValue;
    let currentYear = 2025;
    let currentYourAge = yourAge;
    let currentSpouseAge = spouseAge;
    let totalWithdrawn = 0;
    let yearsUntilDepletion = 0;

    for (let year = 0; year < planningYears; year++) {
        const additionalIncomeGrowthRate = Math.max(0, inflationRate);
        const additionalIncome = initialAdditionalIncome * Math.pow(1 + additionalIncomeGrowthRate, year);

        // Calculate market gains first
        const marketGains = portfolioValue * stockReturn;
        const portfolioAfterGains = portfolioValue + marketGains;

        // Now calculate withdrawal based on portfolio after gains
        const stockWithdrawal = Math.min(
            firstYearWithdrawal * Math.pow(1 + inflationRate, year),
            portfolioAfterGains
        );

        const totalIncome = stockWithdrawal + additionalIncome;

        totalWithdrawn += stockWithdrawal;

        const row = document.createElement('tr');

        // Net change and portfolio after withdrawal
        const netChange = marketGains - stockWithdrawal;
        const portfolioAfterWithdrawal = Math.max(0, portfolioAfterGains - stockWithdrawal);

        row.innerHTML = `
            <td>${currentYear + year}</td>
            <td>${currentYourAge + year <= yourLifeExpectancy ? currentYourAge + year : '-'}</td>
            <td>${currentSpouseAge + year <= spouseLifeExpectancy ? currentSpouseAge + year : '-'}</td>
            <td>${formatCurrency(portfolioValue)}</td>
            <td class="${marketGains >= 0 ? '' : 'negative'}">${formatCurrency(marketGains)}</td>
            <td>${formatCurrency(stockWithdrawal)}</td>
            <td>${formatCurrency(additionalIncome)}</td>
            <td style="font-weight: bold; color: #2d3748;">${formatCurrency(totalIncome)}</td>
            <td class="${portfolioAfterWithdrawal < stockWithdrawal ? 'negative' : ''}">${formatCurrency(portfolioAfterWithdrawal)}</td>
        `;

        tableBody.appendChild(row);

        if (portfolioAfterWithdrawal < stockWithdrawal && yearsUntilDepletion === 0) {
            yearsUntilDepletion = year + 1;
        }

        portfolioValue = portfolioAfterWithdrawal;
    }

    const realStockReturn = stockReturn - inflationRate;
    const impliedWithdrawalRate = firstYearWithdrawal / initialValue;

    summary.innerHTML = `
        <div class="summary-card">
            <h4>Years Until Stock Depletion</h4>
            <div class="value">${yearsUntilDepletion || planningYears + '+'}</div>
        </div>
        <div class="summary-card">
            <h4>Planning Horizon</h4>
            <div class="value">${planningYears} years</div>
        </div>
        <div class="summary-card">
            <h4>Total Stock Withdrawn</h4>
            <div class="value">${formatCurrency(totalWithdrawn)}</div>
        </div>
        <div class="summary-card" style="background: ${realStockReturn * 100 > impliedWithdrawalRate * 100 ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #e53e3e, #c53030)'};">
            <h4>Why Portfolio ${yearsUntilDepletion ? 'Depletes' : 'Survives'}</h4>
            <div style="font-size: 0.9em; line-height: 1.4;">
                Real stock return: ${(realStockReturn * 100).toFixed(1)}%<br>
                Initial withdrawal: ${(impliedWithdrawalRate * 100).toFixed(1)}%<br>
                ${realStockReturn * 100 > impliedWithdrawalRate * 100 ? 'Portfolio can grow!' : 'Withdrawal > real growth'}
            </div>
        </div>
    `;
}

// Initialize table on load
updateTable();