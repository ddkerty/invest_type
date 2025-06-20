import { fetchStockData } from './api.js';
import { classifyPortfolio, specialEtfWeights } from './analyzer.js';

// --- DOM 요소 가져오기 ---
const tickerListContainer = document.getElementById('ticker-list-container');
const addRowBtn = document.getElementById('add-row-btn');
const resetBtn = document.getElementById('reset-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const resultCard = document.getElementById('result-card');
const resultIconElem = document.getElementById('result-icon');
const resultTypeNameElem = document.getElementById('result-type-name');
const resultDescriptionElem = document.getElementById('result-description');
const memberListElem = document.getElementById('member-list');
const sectorChartCanvas = document.getElementById('sector-chart');
const infoIcon = document.getElementById('special-etf-info');
const infoWrapper = document.getElementById('info-wrapper');
let sectorChart = null;

// --- 함수 정의 ---

// 새로운 입력 행 HTML 템플릿
const createTickerRowHTML = () => `
    <input type="text" class="ticker-input" placeholder="티커">
    <input type="number" class="price-input" placeholder="가격" min="0" step="0.01" value="100.00">
    <input type="number" class="quantity-input" placeholder="수량" min="1" value="1">
    <button class="remove-row-btn" aria-label="종목 삭제">&times;</button>
`;

// 새로운 입력 행을 추가하는 함수
function addNewRow() {
    const row = document.createElement('div');
    row.className = 'ticker-row';
    row.innerHTML = createTickerRowHTML();
    tickerListContainer.appendChild(row);
}

// 모든 입력 행을 지우고 초기 상태로 만드는 함수
function resetInputFields() {
    tickerListContainer.innerHTML = '';
    // 기본으로 2개의 행을 다시 만들어 줍니다.
    addNewRow();
    addNewRow();
    // 첫번째 행은 예시 값으로 채워줍니다.
    const firstRow = tickerListContainer.firstElementChild;
    if (firstRow) {
        firstRow.querySelector('.ticker-input').value = "AAPL";
        firstRow.querySelector('.price-input').value = "170.00";
        firstRow.querySelector('.quantity-input').value = "10";
        const secondRow = firstRow.nextElementSibling;
        if (secondRow) {
            secondRow.querySelector('.ticker-input').value = "VOO";
            secondRow.querySelector('.price-input').value = "450.00";
            secondRow.querySelector('.quantity-input').value = "5";
        }
    }
    resultCard.classList.add('hidden');
}

// 로딩 상태를 관리하는 헬퍼 함수
function setLoadingState(isLoading) {
    loadingSpinner.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        resultCard.classList.add('hidden');
    }
    analyzeBtn.disabled = isLoading;
}

// DOM에서 입력 값을 읽어오는 함수
function getInputsFromDOM() {
    const tickerRows = document.querySelectorAll('.ticker-row');
    const inputs = [];
    tickerRows.forEach(row => {
        const ticker = row.querySelector('.ticker-input').value.trim().toUpperCase();
        const price = parseFloat(row.querySelector('.price-input').value);
        const quantity = parseInt(row.querySelector('.quantity-input').value, 10);
        
        if (ticker && quantity > 0 && price >= 0) {
            inputs.push({ ticker, quantity, price });
        }
    });
    return inputs;
}

// 메인 분석 실행 함수
async function handleAnalysis() {
    setLoadingState(true);
    const inputs = getInputsFromDOM();

    if (inputs.length === 0) {
        alert('분석할 주식을 1개 이상 입력해주세요.');
        setLoadingState(false);
        return;
    }

    try {
        const promises = inputs.map(async (input) => {
            const stockDataFromDB = await fetchStockData(input.ticker);
            return stockDataFromDB ? { ...stockDataFromDB, quantity: input.quantity, price: input.price } : null;
        });

        const results = await Promise.all(promises);
        const portfolioData = results.filter(res => res !== null);

        if (portfolioData.length < inputs.length) {
            const foundSymbols = new Set(portfolioData.map(stock => stock.symbol));
            const missingTickers = inputs
                .map(input => input.ticker)
                .filter(ticker => !foundSymbols.has(ticker));
            
            if (missingTickers.length > 0) {
                alert(`'${missingTickers.join(', ')}' 해당 티커가 데이터에 존재하지 않아 분석에서 제외됩니다.`);
            }
        }
        
        if (portfolioData.length === 0) {
            alert('분석할 유효한 주식 정보를 찾지 못했습니다. 티커를 다시 확인해주세요.');
            setLoadingState(false);
            return;
        }

        const classificationResult = classifyPortfolio(portfolioData);
        renderResults(classificationResult, portfolioData);

    } catch (error) {
        console.error("Analysis failed:", error);
        alert("분석 중 오류가 발생했습니다.");
    } finally {
        setLoadingState(false);
    }
}

// 결과 렌더링 함수
function renderResults(result, portfolioData) {
    resultIconElem.innerHTML = `<i class="${result.icon} ${result.color}"></i>`;
    resultTypeNameElem.textContent = result.name;
    resultDescriptionElem.textContent = result.desc;
    memberListElem.innerHTML = portfolioData.map(stock => {
        const stockValue = (stock.price * stock.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        return `<span class="member-tag">${stock.symbol} (${stock.quantity}주, ${stockValue})</span>`;
    }).join('');
    renderSectorChart(result.sectorCounts);
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth' });
}

// 차트 렌더링 함수
function renderSectorChart(sectorValues) {
    if (sectorChart) sectorChart.destroy();
    
    const chartColors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e', '#1abc9c', '#e67e22'];
    const labels = Object.keys(sectorValues);
    const data = Object.values(sectorValues);

    sectorChart = new Chart(sectorChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: '금액 기준 섹터 비중',
                data: data,
                backgroundColor: labels.map((_, i) => chartColors[i % chartColors.length]),
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            return `${context.label}: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
                        }
                    }
                }
            }
        }
    });
}


// --- 이벤트 리스너 설정 ---
analyzeBtn.addEventListener('click', handleAnalysis);
addRowBtn.addEventListener('click', addNewRow);
resetBtn.addEventListener('click', resetInputFields);

// 행 삭제 버튼 (이벤트 위임 방식)
tickerListContainer.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('remove-row-btn')) {
        if (tickerListContainer.childElementCount > 1) {
            e.target.closest('.ticker-row').remove();
        } else {
            alert('최소 1개의 종목은 입력해야 합니다.');
        }
    }
});

// 정보 아이콘 툴팁 기능
if (infoIcon && infoWrapper) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    
    const specialEtfList = Object.keys(specialEtfWeights).join(', ');
    tooltip.textContent = '분석 가능 ETF: ' + specialEtfList;
    
    infoWrapper.appendChild(tooltip);

    infoIcon.addEventListener('mouseover', () => {
        tooltip.style.display = 'block';
    });

    infoIcon.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
}
