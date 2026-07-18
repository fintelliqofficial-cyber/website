let allocationChartInstance = null;
let sectorChartInstance = null;

const OTHERS_ALLOCATION_COLOR = "#94A3B8";
const TOP_ALLOCATION_SLICES = 5;

function consolidateAllocation(allocation, maxSlices = TOP_ALLOCATION_SLICES) {
    if (!Array.isArray(allocation) || allocation.length <= maxSlices) {
        return allocation || [];
    }

    const sorted = [...allocation].sort((a, b) => b.weight - a.weight);
    const top = sorted.slice(0, maxSlices);
    const restWeight = sorted
        .slice(maxSlices)
        .reduce((sum, item) => sum + item.weight, 0);

    if (restWeight <= 0) {
        return top;
    }

    return [
        ...top,
        {
            sectorId: "OTHERS",
            sectorName: "Others",
            weight: Number(restWeight.toFixed(1)),
            color: OTHERS_ALLOCATION_COLOR
        }
    ];
}

function renderAllocationChart(allocation) {
    const canvas = document.getElementById("allocationChart");
    if (!canvas) return;

    const chartData = consolidateAllocation(allocation);

    if (allocationChartInstance) {
        allocationChartInstance.destroy();
    }

    allocationChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: chartData.map(item => item.sectorName),
            datasets: [{
                data: chartData.map(item => item.weight),
                backgroundColor: chartData.map(item => item.color),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "62%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return ` ${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

function renderAllocationLegend(allocation) {
    const legend = document.getElementById("allocationLegend");
    if (!legend) return;

    const chartData = consolidateAllocation(allocation);

    legend.innerHTML = chartData.map(item => `
        <div class="legendItem">
            <div class="legendLeft">
                <span class="legendDot" style="background:${item.color}"></span>
                <span class="legendLabel">${item.sectorName}</span>
            </div>
            <span class="legendValue">${item.weight}%</span>
        </div>
    `).join("");
}

function renderSectorChart(sectorPerformance) {
    const canvas = document.getElementById("sectorChart");
    if (!canvas) return;

    if (sectorChartInstance) {
        sectorChartInstance.destroy();
    }

    const sorted = [...sectorPerformance].sort(
        (a, b) => b.changePercent - a.changePercent
    );

    const labels = sorted.map(item => item.sectorName);
    const values = sorted.map(item => item.changePercent);
    const colors = values.map(v =>
        v >= 0 ? "#16A34A" : "#DC2626"
    );

    sectorChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderRadius: 4,
                barThickness: 18
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const val = context.parsed.x;
                            const sign = val >= 0 ? "+" : "";
                            return ` ${sign}${val.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color(ctx) {
                            return ctx.tick.value === 0 ? "#94A3B8" : "#F1F5F9";
                        },
                        lineWidth(ctx) {
                            return ctx.tick.value === 0 ? 1.5 : 1;
                        }
                    },
                    ticks: {
                        callback(value) {
                            return `${value > 0 ? "+" : ""}${value}%`;
                        },
                        font: { size: 10 },
                        color: "#94A3B8"
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 12, weight: "600" },
                        color: "#0F172A"
                    }
                }
            }
        }
    });
}

const PortfolioCharts = {
    renderAllocationChart,
    renderAllocationLegend,
    renderSectorChart
};
