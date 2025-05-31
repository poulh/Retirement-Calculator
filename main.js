function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateTable() {
    const initialValue = parseFloat(document.getElementById('initialValue').value);
    const firstYearWithdrawal = parseFloat(document.getElementById('firstYearWithdrawal').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const initialAdditionalIncome = parseFloat(document.getElementById('additionalIncome').value);
    const stockReturn = parseFloat(document.getElementById('stockReturn').value) / 100;
    const wifeLifeExpectancy = parseInt(document.getElementById('wifeLifeExpectancy').value);
    
    const planningYears = wifeLifeExpectancy - 40 +1; // Wife is currently 40
    console.log(`Planning for ${planningYears} years until wife's life expectancy of ${wifeLifeExpectancy}`);
    
    const tableBody = document.getElementById('tableBody');
    const summary = document.getElementById('summary');
    
    tableBody.innerHTML = '';
    
    let portfolioValue = initialValue;
    let currentYear = 2025;
    let yourAge = 48;
    let wifeAge = 40;
    let totalWithdrawn = 0;
    let yearsUntilDepletion = 0;
    
    for (let year = 0; year < planningYears; year++) {
        // Rental income grows at inflation - 1%
        const rentalGrowthRate = Math.max(0, inflationRate - 0.01);
        const rentalIncome = initialAdditionalIncome * Math.pow(1 + rentalGrowthRate, year);
        
        // Stock withdrawal grows with inflation
        const stockWithdrawal = Math.min(
            firstYearWithdrawal * Math.pow(1 + inflationRate, year), 
            portfolioValue
        );
        
        const totalIncome = stockWithdrawal + rentalIncome;
        
        totalWithdrawn += stockWithdrawal;
        
        const row = document.createElement('tr');
        
        // Calculate market gains and net change
        const marketGains = portfolioValue * stockReturn;
        const netChange = marketGains - stockWithdrawal;
        const portfolioAfterWithdrawal = Math.max(0, portfolioValue + netChange);
        console.log(`Year ${currentYear + year}: Portfolio after withdrawal: ${portfolioAfterWithdrawal}, Market gains: ${marketGains}, Stock withdrawal: ${stockWithdrawal}, Rental income: ${rentalIncome}`);
        row.innerHTML = `
            <td>${currentYear + year}</td>
            <td>${yourAge + year}</td>
            <td>${wifeAge + year}</td>
            <td>${formatCurrency(portfolioValue)}</td>
            <td class="${marketGains >= 0 ? '' : 'negative'}">${formatCurrency(marketGains)}</td>
            <td>${formatCurrency(stockWithdrawal)}</td>
            <td>${formatCurrency(rentalIncome)}</td>
            <td style="font-weight: bold; color: #2d3748;">${formatCurrency(totalIncome)}</td>
            <td class="${portfolioAfterWithdrawal < 100000 ? 'negative' : ''}">${formatCurrency(portfolioAfterWithdrawal)}</td>
        `;
        
        tableBody.appendChild(row);
        
        if (portfolioAfterWithdrawal < 100000 && yearsUntilDepletion === 0) {
            yearsUntilDepletion = year + 1;
        }
        
        portfolioValue = portfolioAfterWithdrawal;
        
    }
    
    // Calculate the real issue
    const realStockReturn = stockReturn - inflationRate; // Real return after inflation
    const impliedWithdrawalRate = firstYearWithdrawal / initialValue;
    
    // Update summary
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