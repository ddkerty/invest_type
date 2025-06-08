// js/api.js (최종 수정 버전)
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
    const tickerUpper = ticker.toUpperCase();

    if (!db || !db[tickerUpper]) {
        console.warn(`[Local DB Miss] Ticker '${tickerUpper}' not found.`);
        return null;
    }
    
    // [수정] db에 있는 데이터를 그대로 반환하되, symbol 정보는 확실하게 추가해줍니다.
    return {
        symbol: tickerUpper,
        ...db[tickerUpper] // db[tickerUpper]에 있는 모든 속성(sector, name 등)을 포함
    };
}