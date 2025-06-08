// js/api.js
let stockDatabase = null;

async function loadDatabase() {
    if (stockDatabase) return stockDatabase;
    try {
        const response = await fetch('./js/stock-sectors.json');
        if (!response.ok) throw new Error('Stock database not found.');
        stockDatabase = await response.json();
        return stockDatabase;
    } catch (error) {
        console.error("Failed to load stock database:", error);
        return null;
    }
}

export async function fetchStockData(ticker) {
    const db = await loadDatabase();
    if (!db || !db[ticker]) {
        console.warn(`[Local DB Miss] Ticker '${ticker}' not found.`);
        return null;
    }
    return {
        symbol: ticker.toUpperCase(),
        sector: db[ticker].sector
    };
}