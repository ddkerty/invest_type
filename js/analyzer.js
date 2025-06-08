// js/analyzer.js (개선된 버전)

const sectorWeights = {
    // FMP API가 반환하는 이름과 GICS 표준 이름을 모두 포함하여 안정성 확보
    "Technology":               { aggressive: 2, stable: 1, dividend: 0 },
    "Consumer Cyclical":        { aggressive: 3, stable: 0, dividend: 0 }, // FMP API에서 사용
    "Consumer Discretionary":   { aggressive: 3, stable: 0, dividend: 0 }, // GICS 표준
    "Communication Services":   { aggressive: 2, stable: 1, dividend: 0 },
    "Healthcare":               { aggressive: 1, stable: 2, dividend: 0 }, // FMP API에서 사용
    "Health Care":              { aggressive: 1, stable: 2, dividend: 0 }, // GICS 표준
    "Financial Services":       { aggressive: 1, stable: 1, dividend: 1 },
    "Financials":               { aggressive: 1, stable: 1, dividend: 1 },
    "Industrials":              { aggressive: 1, stable: 1, dividend: 1 },
    "Consumer Defensive":       { aggressive: 0, stable: 2, dividend: 1 }, // FMP API에서 사용
    "Consumer Staples":         { aggressive: 0, stable: 2, dividend: 1 }, // GICS 표준
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
        // 일관된 섹터 키를 찾습니다.
        const sectorKey = stock.sector && sectorWeights[stock.sector] ? stock.sector : 'default';
        const weights = sectorWeights[sectorKey];
        const quantity = stock.quantity || 1; // 수량이 없으면 1로 간주

        // 각 점수에 '수량'을 곱해 가중치를 부여합니다.
        points.aggressive += weights.aggressive * quantity;
        points.stable     += weights.stable * quantity;
        points.dividend   += weights.dividend * quantity;

        // 차트용 섹터별 수량도 '수량' 기준으로 합산합니다.
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
        const threshold = Math.max(2, maxPoints * 0.2); // 1, 2위 간 점수 차이가 2점이거나, 전체 점수의 20% 미만일 때 밸런스형으로 판단
        
        if (pointDifference < threshold && maxPoints > 0) {
            finalType = 'balanced';
        }
    }
    return { ...resultTypes[finalType], sectorCounts };
}