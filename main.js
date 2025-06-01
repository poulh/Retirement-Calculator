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
    const yourRetirementAge = parseInt(document.getElementById('yourRetirementAge').value);
    const spouseRetirementAge = parseInt(document.getElementById('spouseRetirementAge').value);
    const yourSSN = parseFloat(document.getElementById('yourSSN').value) * 12; // yearly
    const spouseSSN = parseFloat(document.getElementById('spouseSSN').value) * 12; // yearly
    const yourLifeExpectancy = parseInt(document.getElementById('yourLifeExpectancy').value);
    const spouseLifeExpectancy = parseInt(document.getElementById('spouseLifeExpectancy').value);
    const initialValue = parseFloat(document.getElementById('initialValue').value);
    const firstYearWithdrawal = parseFloat(document.getElementById('firstYearWithdrawal').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const initialAdditionalIncome = parseFloat(document.getElementById('additionalIncome').value);
    const stockReturn = parseFloat(document.getElementById('stockReturn').value) / 100;
    const incomeCalcMode = document.getElementById('incomeCalcMode').value;
    const inflationAdjustMode = document.getElementById('inflationAdjustMode').value;

    // Adjust rates if showing in today's dollars
    let effectiveInflation = inflationRate;
    let effectiveStockReturn = stockReturn;
    if (inflationAdjustMode === 'today') {
        effectiveStockReturn = stockReturn - inflationRate;
        effectiveInflation = 0;
    }

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
        const additionalIncomeGrowthRate = Math.max(0, effectiveInflation);
        const additionalIncome = initialAdditionalIncome * Math.pow(1 + additionalIncomeGrowthRate, year);

        // Calculate ages for this year
        const thisYourAge = currentYourAge + year;
        const thisSpouseAge = currentSpouseAge + year;

        // Social Security calculation (as before)
        let ssnIncome = 0;
        const yourEligible = thisYourAge >= yourRetirementAge && thisYourAge <= yourLifeExpectancy;
        const spouseEligible = thisSpouseAge >= spouseRetirementAge && thisSpouseAge <= spouseLifeExpectancy;
        const yourSSNInfl = yourSSN * Math.pow(1 + effectiveInflation, year);
        const spouseSSNInfl = spouseSSN * Math.pow(1 + effectiveInflation, year);

        if (yourEligible && spouseEligible) {
            ssnIncome = yourSSNInfl + spouseSSNInfl;
        } else if (yourEligible && !spouseEligible && thisSpouseAge > spouseLifeExpectancy) {
            ssnIncome = Math.max(yourSSNInfl, spouseSSNInfl);
        } else if (!yourEligible && spouseEligible && thisYourAge > yourLifeExpectancy) {
            ssnIncome = Math.max(yourSSNInfl, spouseSSNInfl);
        } else if (yourEligible) {
            ssnIncome = yourSSNInfl;
        } else if (spouseEligible) {
            ssnIncome = spouseSSNInfl;
        }

        // Calculate market gains first
        const marketGains = portfolioValue * effectiveStockReturn;
        const portfolioAfterGains = portfolioValue + marketGains;

        // Calculate withdrawal and total income based on mode
        let stockWithdrawal, totalIncome;
        if (incomeCalcMode === 'add') {
            stockWithdrawal = Math.min(
                firstYearWithdrawal * Math.pow(1 + effectiveInflation, year),
                portfolioAfterGains
            );
            totalIncome = stockWithdrawal + additionalIncome + ssnIncome;
        } else {
            // Reduce stock withdrawal by other income, but never below 0
            const targetIncome = firstYearWithdrawal * Math.pow(1 + effectiveInflation, year);
            stockWithdrawal = Math.max(0, Math.min(targetIncome - additionalIncome - ssnIncome, portfolioAfterGains));
            totalIncome = stockWithdrawal + additionalIncome + ssnIncome;
        }

        totalWithdrawn += stockWithdrawal;

        const row = document.createElement('tr');

        // Net change and portfolio after withdrawal
        const netChange = marketGains - stockWithdrawal;
        const portfolioAfterWithdrawal = Math.max(0, portfolioAfterGains - stockWithdrawal);

        row.innerHTML = `
            <td>${currentYear + year}</td>
            <td>${thisYourAge <= yourLifeExpectancy ? thisYourAge : '-'}</td>
            <td>${thisSpouseAge <= spouseLifeExpectancy ? thisSpouseAge : '-'}</td>
            <td>${formatCurrency(portfolioValue)}</td>
            <td class="${marketGains >= 0 ? '' : 'negative'}">${formatCurrency(marketGains)}</td>
            <td>${formatCurrency(additionalIncome)}</td>
            <td>${formatCurrency(ssnIncome)}</td>
            <td>${formatCurrency(stockWithdrawal)}</td>
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

    let depletionTitle, depletionYear, yourAgeAtDepletion, spouseAgeAtDepletion;

    if (yearsUntilDepletion) {
        // Portfolio depletes
        depletionTitle = "Years Until Stock Depletion";
        depletionYear = currentYear + yearsUntilDepletion - 1;
        yourAgeAtDepletion = yourAge + yearsUntilDepletion - 1;
        spouseAgeAtDepletion = spouseAge + yearsUntilDepletion - 1;
    } else {
        // Portfolio survives
        depletionTitle = "Portfolio Survives";
        // Last year either spouse is alive
        depletionYear = currentYear + planningYears - 1;
        yourAgeAtDepletion = '-';
        spouseAgeAtDepletion = '-';
    }

    summary.innerHTML = `
        <div class="summary-card" style="background: ${yearsUntilDepletion === 0 ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #e53e3e, #c53030)'};">

            <h4>${depletionTitle}</h4>
            <div class="value">${yearsUntilDepletion || planningYears + '+'}</div>
            <div style="font-size:0.95em;">
                Year: ${depletionYear}<br>
                Your Age: ${yourAgeAtDepletion <= yourLifeExpectancy ? yourAgeAtDepletion : '-'}<br>
                Spouse's Age: ${spouseAgeAtDepletion <= spouseLifeExpectancy ? spouseAgeAtDepletion : '-'}
            </div>
        </div>
        <div class="summary-card">
            <h4>Planning Horizon</h4>
            <div class="value">${planningYears} years</div>
        </div>
        <div class="summary-card">
            <h4>Inheritance Left to Heirs</h4>
            <div class="value">${formatCurrency(portfolioValue)}</div>
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