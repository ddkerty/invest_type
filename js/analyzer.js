// js/analyzer.js (대표 ETF 특별 처리 최종 버전)

// [추가] 특별 취급할 대표 ETF 목록 (이 목록을 직접 편집하여 다른 ETF도 추가 가능)
export const specialEtfWeights = {
    // S&P 500 지수 추종 ETF (안정성에 높은 가중치)
    "SPY": { sector: "S&P 500 Index", aggressive: 1, stable: 3, dividend: 1 },
    "IVV": { sector: "S&P 500 Index", aggressive: 1, stable: 3, dividend: 1 },
    "VOO": { sector: "S&P 500 Index", aggressive: 1, stable: 3, dividend: 1 },
    "SPLG":{ sector: "S&P 500 Index", aggressive: 1, stable: 3, dividend: 1 },

    // 나스닥 100 지수 추종 ETF (기술주 중심이므로 공격성에 높은 가중치)
    "QQQ": { sector: "Nasdaq 100 Index", aggressive: 3, stable: 1, dividend: 0 },
    "QQQM": { sector: "Nasdaq 100 Index", aggressive: 3, stable: 1, dividend: 0 },
    
    // 다우존스 지수 추종 ETF (가치주 중심이므로 안정/배당에 가중치)
    "DIA": { sector: "Dow Jones Index", aggressive: 1, stable: 2, dividend: 2 },
    "SCHD": { sector: "Dow Jones Index", aggressive: 1, stable: 2, dividend: 2 },
    // 섹터 ETF 예시
    "XLK": { sector: "Technology ETF", aggressive: 2, stable: 1, dividend: 0 },
    "XLF": { sector: "Financial ETF", aggressive: 1, stable: 1, dividend: 1 },
    "XLV": { sector: "Healthcare ETF", aggressive: 1, stable: 2, dividend: 0 },
};

// 일반 섹터 및 일반 ETF에 대한 가중치
const sectorWeights = {
    "Technology":               { aggressive: 2, stable: 1, dividend: 0 },
    "Consumer Cyclical":        { aggressive: 3, stable: 0, dividend: 0 },
    "Consumer Discretionary":   { aggressive: 3, stable: 0, dividend: 0 },
    "Communication Services":   { aggressive: 2, stable: 1, dividend: 0 },
    "Healthcare":               { aggressive: 1, stable: 2, dividend: 0 },
    "Health Care":              { aggressive: 1, stable: 2, dividend: 0 },
    "Financial Services":       { aggressive: 1, stable: 1, dividend: 1 },
    "Financials":               { aggressive: 1, stable: 1, dividend: 1 },
    "Industrials":              { aggressive: 1, stable: 1, dividend: 1 },
    "Consumer Defensive":       { aggressive: 0, stable: 2, dividend: 1 },
    "Consumer Staples":         { aggressive: 0, stable: 2, dividend: 1 },
    "Utilities":                { aggressive: 0, stable: 2, dividend: 1 },
    "Real Estate":              { aggressive: 0, stable: 1, dividend: 2 },
    "Energy":                   { aggressive: 1, stable: 0, dividend: 2 },
    "Basic Materials":          { aggressive: 1, stable: 1, dividend: 1 },
    "Materials":                { aggressive: 1, stable: 1, dividend: 1 },
    "ETF":                      { aggressive: 1, stable: 2, dividend: 1 }, // 그 외 일반 ETF
    "default":                  { aggressive: 1, stable: 1, dividend: 1 }
};

const resultTypes = {
    aggressive: { 
        name: "우주 탐험가 🚀", 
        icon: "fa-solid fa-rocket", 
        color: "icon-aggressive", 
        desc: "당신은 한계라는 단어를 모르는 존재! 하늘 높이 치솟는 기회를 향해 망설임 없이 돌진합니다."
    },
    stable: { 
        name: "불굴의 등반가 🏔️", 
        icon: "fa-solid fa-mountain", 
        color: "icon-stable", 
        desc: "높은 정상보다 안전한 등산로를 택하는 당신. 한 걸음씩 꾸준히, 결코 흔들리지 않습니다."
    },
    dividend: { 
        name: "황금알 거위 사육사 🌾", 
        icon: "fa-solid fa-wheat-awn", 
        color: "icon-dividend", 
        desc: "황금알을 낳는 거위를 키우는 현명한 투자자! 꾸준히 들어오는 현금 흐름으로 복리의 마법을 기다리고 있습니다."
    },
    balanced: { 
        name: "외줄 타는 현자", 
        icon: "fa-solid fa-scale-balanced", 
        color: "icon-balanced", 
        desc: "공격이 최선의 방어일 때도, 움츠리는 것이 지혜일 때도 있음을 아는 현자. 성장과 안정 사이에서 절묘한 줄타기를 하고 있군요."
    }
};

export function classifyPortfolio(portfolioData) {
    const points = { aggressive: 0, stable: 0, dividend: 0 };
    const sectorCounts = {};

    portfolioData.forEach(stock => {
        let weights;
        let displaySector = "N/A";
        const quantity = stock.quantity || 1;

        // 1. 특별 ETF 목록에 있는지 먼저 확인
        if (specialEtfWeights[stock.symbol]) {
            const specialEtf = specialEtfWeights[stock.symbol];
            weights = { aggressive: specialEtf.aggressive, stable: specialEtf.stable, dividend: specialEtf.dividend };
            displaySector = specialEtf.sector;
        } else {
            // 2. 없다면 기존 로직으로 섹터 가중치 적용
            const sectorKey = stock.sector && sectorWeights[stock.sector] ? stock.sector : 'default';
            weights = sectorWeights[sectorKey];
            displaySector = stock.sector || "N/A";
        }
        
        points.aggressive += weights.aggressive * quantity;
        points.stable     += weights.stable * quantity;
        points.dividend   += weights.dividend * quantity;

        sectorCounts[displaySector] = (sectorCounts[displaySector] || 0) + quantity;
    });
    
    // 이하 점수 계산 및 반환 로직은 동일
    const sortedTypes = Object.entries(points).sort((a, b) => b[1] - a[1]);
    
    if (sortedTypes.length === 0 || sortedTypes[0][1] === 0) {
        return { ...resultTypes.balanced, sectorCounts };
    }

    let finalType = sortedTypes[0][0];
    const maxPoints = sortedTypes[0][1];

    if (sortedTypes.length > 1) {
        const secondMaxPoints = sortedTypes[1][1];
        const pointDifference = maxPoints - secondMaxPoints;
        const threshold = Math.max(2, maxPoints * 0.2);
        
        if (pointDifference < threshold && maxPoints > 0) {
            finalType = 'balanced';
        }
    }
    return { ...resultTypes[finalType], sectorCounts };
}