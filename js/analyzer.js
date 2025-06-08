// js/analyzer.js
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
    "default":                  { aggressive: 1, stable: 1, dividend: 1 }
};

const resultTypes = {
    aggressive: { name: "공격형 포트폴리오", icon: "fa-solid fa-rocket", color: "icon-aggressive", desc: "미래를 바꾸는 혁신 기업들과 함께 시장을 뛰어넘는 성장을 추구합니다." },
    stable:     { name: "안정형 포트폴리오", icon: "fa-solid fa-shield-halved", color: "icon-stable", desc: "시장의 변동성 속에서도 굳건히 자산을 지켜내는 꾸준함을 가졌습니다." },
    dividend:   { name: "배당형 포트폴리오", icon: "fa-solid fa-gem", color: "icon-dividend", desc: "화려한 성장보다는 꾸준히 쌓이는 현금 흐름의 가치를 아는 당신의 포트폴리오입니다." },
    balanced:   { name: "밸런스형 포트폴리오", icon: "fa-solid fa-scale-balanced", color: "icon-balanced", desc: "성장과 안정, 두 마리 토끼를 모두 잡아 어떤 시장에서도 유연하게 대처합니다." }
};

export function classifyPortfolio(portfolioData) {
    const points = { aggressive: 0, stable: 0, dividend: 0 };
    const sectorCounts = {};

    portfolioData.forEach(stock => {
        const sectorKey = stock.sector && sectorWeights[stock.sector] ? stock.sector : 'default';
        const weights = sectorWeights[sectorKey];
        const quantity = stock.quantity || 1;

        points.aggressive += weights.aggressive * quantity;
        points.stable     += weights.stable * quantity;
        points.dividend   += weights.dividend * quantity;

        const displaySector = stock.sector || "N/A";
        sectorCounts[displaySector] = (sectorCounts[displaySector] || 0) + quantity;
    });

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