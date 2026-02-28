<script>
  import {
    Chart,
    BarElement,
    BarController,
    CategoryScale,
    LinearScale,
    Tooltip,
  } from "chart.js";

  Chart.register(
    BarElement,
    BarController,
    CategoryScale,
    LinearScale,
    Tooltip,
  );

  let { allProducts = [] } = $props();
  let period = $state("weekly");
  let canvasEl = $state(null);
  let chart = null;
  let hoveredCell = $state(null);
  let tooltipPos = $state({ x: 0, y: 0 });

  const allPeriods = ["daily", "weekly", "monthly", "quarterly", "yearly"];

  // Vertical heatmap constants
  const cellSize = 28;
  const cellGap = 3;
  const cellPitch = cellSize + cellGap;
  const leftMargin = 36;
  const topMargin = 16;
  const svgWidth = leftMargin + 7 * cellPitch;
  const svgHeight = topMargin + 52 * cellPitch;

  function getGroupKey(d, p) {
    if (p === "daily") return `${d.getMonth() + 1}/${d.getDate()}`;
    if (p === "weekly") {
      const day = new Date(d);
      const diff = day.getDay() === 0 ? 6 : day.getDay() - 1;
      day.setDate(day.getDate() - diff);
      return `${day.getMonth() + 1}/${day.getDate()}`;
    }
    if (p === "monthly") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (p === "quarterly") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q} ${d.getFullYear()}`;
    }
    return `${d.getFullYear()}`;
  }

  function countGroups(products, p) {
    const seen = new Set();
    for (const prod of products) {
      if (!prod.savedAt) continue;
      seen.add(getGroupKey(new Date(prod.savedAt), p));
    }
    return seen.size;
  }

  let visiblePeriods = $derived(
    allPeriods.filter(
      (p) =>
        p === "daily" || p === "weekly" || countGroups(allProducts, p) >= 2,
    ),
  );

  $effect(() => {
    if (!visiblePeriods.includes(period)) {
      period = visiblePeriods[0] || "weekly";
    }
  });

  // Group products by calendar day
  let dailyCounts = $derived.by(() => {
    const map = {};
    for (const p of allProducts) {
      if (!p.savedAt) continue;
      const d = new Date(p.savedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  });

  // Heatmap data: last 52 weeks
  let heatmapData = $derived.by(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

    const cells = [];
    const startDay = new Date(endDay);
    startDay.setDate(startDay.getDate() - 363);

    for (let i = 0; i < 364; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const weekCol = Math.floor(i / 7); // 0 = oldest, 51 = newest
      const dayRow = d.getDay(); // 0=Sun, 6=Sat
      cells.push({
        date: key,
        count: dailyCounts[key] || 0,
        weekCol,
        dayRow,
        future: d > today,
      });
    }
    return cells;
  });

  let maxCount = $derived(Math.max(1, ...heatmapData.map((c) => c.count)));

  // Month labels for vertical heatmap (positioned on left, newest at top)
  let monthLabels = $derived.by(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const labels = [];
    let lastMonth = -1;

    // Iterate top to bottom (newest to oldest)
    for (let visualRow = 0; visualRow < 52; visualRow++) {
      const weekCol = 51 - visualRow;
      const cell = heatmapData.find(
        (c) => c.weekCol === weekCol && c.dayRow === 0,
      );
      if (!cell) continue;
      const parts = cell.date.split("-");
      const month = parseInt(parts[1]) - 1;
      if (month !== lastMonth) {
        lastMonth = month;
        const name = monthNames[month];
        const yearSuffix = month === 0 ? `'${parts[0].slice(2)}` : null;
        labels.push({ visualRow, label: name, yearSuffix });
      }
    }
    return labels;
  });

  // Bar chart data based on period
  let barData = $derived.by(() => {
    const groups = {};
    const orderMap = {};
    for (const p of allProducts) {
      if (!p.savedAt) continue;
      const d = new Date(p.savedAt);
      const key = getGroupKey(d, period);
      groups[key] = (groups[key] || 0) + 1;
      if (!(key in orderMap)) orderMap[key] = d.getTime();
      else orderMap[key] = Math.min(orderMap[key], d.getTime());
    }

    const entries = Object.entries(groups);
    entries.sort((a, b) => (orderMap[a[0]] || 0) - (orderMap[b[0]] || 0));
    return {
      labels: entries.map((e) => e[0]),
      values: entries.map((e) => e[1]),
    };
  });

  // Chart.js instance management
  $effect(() => {
    if (!canvasEl) return;
    const data = barData;

    if (chart) {
      chart.destroy();
    }

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue("--accent").trim() || "#3b82f6";
    const textSecondary =
      style.getPropertyValue("--text-secondary").trim() || "#a0a0a0";
    const borderColor =
      style.getPropertyValue("--border-color").trim() ||
      "rgba(255,255,255,0.08)";

    chart = new Chart(canvasEl, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: accent,
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            cornerRadius: 6,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                `${ctx.parsed.y} product${ctx.parsed.y !== 1 ? "s" : ""}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: borderColor },
            ticks: { color: textSecondary, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: borderColor },
            ticks: {
              color: textSecondary,
              font: { size: 11 },
              stepSize: 1,
              callback: (v) => (Number.isInteger(v) ? v : ""),
            },
          },
        },
      },
    });

    return () => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
    };
  });

  function getCellColor(count) {
    if (count === 0) return "var(--bg-elevated)";
    const intensity = Math.min(count / maxCount, 1);
    const alpha = 0.25 + intensity * 0.75;
    return `rgba(59, 130, 246, ${alpha})`;
  }

  function formatDateLabel(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function handleCellHover(cell, event) {
    hoveredCell = cell;
    const cellRect = event.currentTarget.getBoundingClientRect();
    tooltipPos = {
      x: cellRect.right + 8,
      y: cellRect.top + cellRect.height / 2,
    };
  }

  // Vertical grid helpers
  function cellX(dayRow) {
    return leftMargin + dayRow * cellPitch;
  }

  function cellY(weekCol) {
    const visualRow = 51 - weekCol;
    return topMargin + visualRow * cellPitch;
  }
</script>

<div class="analytics">
  <div class="analytics-grid">
    <div class="heatmap-section">
      <h2 class="section-title">Daily Activity</h2>
      <div class="heatmap-wrapper">
        <div class="heatmap-container">
          <svg
            class="heatmap"
            viewBox="0 0 {svgWidth} {svgHeight}"
            width="100%"
          >
            <!-- Day-of-week labels across the top -->
            {#each ["S", "M", "T", "W", "T", "F", "S"] as day, i}
              <text
                x={leftMargin + i * cellPitch + cellSize / 2}
                y={10}
                class="heatmap-label day-label">{day}</text
              >
            {/each}

            <!-- Month labels on the left -->
            {#each monthLabels as ml}
              <text
                x={leftMargin - 6}
                y={topMargin + ml.visualRow * cellPitch + cellSize / 2 + 3}
                class="heatmap-label month-label"
              >
                {ml.label}
                {#if ml.yearSuffix}
                  <tspan x={leftMargin - 6} dy="15">{ml.yearSuffix}</tspan>
                {/if}
              </text>
            {/each}

            <!-- Cells -->
            {#each heatmapData as cell}
              {#if !cell.future}
                <rect
                  x={cellX(cell.dayRow)}
                  y={cellY(cell.weekCol)}
                  width={cellSize}
                  height={cellSize}
                  rx="2"
                  fill={getCellColor(cell.count)}
                  class="heatmap-cell"
                  role="img"
                  aria-label="{cell.date}: {cell.count} product{cell.count !== 1
                    ? 's'
                    : ''}"
                  onmouseenter={(e) => handleCellHover(cell, e)}
                  onmouseleave={() => (hoveredCell = null)}
                ></rect>
              {/if}
            {/each}
          </svg>
        </div>
        <div class="heatmap-fade"></div>
      </div>
    </div>

    <div class="chart-section">
      <div class="section-header">
        <h2 class="section-title">Products Over Time</h2>
        <div class="period-selector">
          {#each visiblePeriods as p}
            <button
              class="period-btn"
              class:active={period === p}
              onclick={() => (period = p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          {/each}
        </div>
      </div>
      <div class="chart-container">
        <canvas bind:this={canvasEl}></canvas>
      </div>
    </div>
  </div>
</div>

{#if hoveredCell}
  <div
    class="heatmap-tooltip"
    style="left: {tooltipPos.x}px; top: {tooltipPos.y}px;"
  >
    <strong
      >{hoveredCell.count} product{hoveredCell.count !== 1 ? "s" : ""}</strong
    >
    <span>{formatDateLabel(hoveredCell.date)}</span>
  </div>
{/if}

<style>
  .analytics-grid {
    display: flex;
    gap: 20px;
    max-height: 500px;
  }

  .heatmap-section {
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .heatmap-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .heatmap-container {
    height: 100%;
    overflow-y: auto;
    padding: 16px 16px 16px 8px;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .heatmap-container:hover {
    scrollbar-color: var(--text-muted) transparent;
  }

  .heatmap-container::-webkit-scrollbar {
    width: 6px;
  }

  .heatmap-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .heatmap-container::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
  }

  .heatmap-container:hover::-webkit-scrollbar-thumb {
    background: var(--text-muted);
  }

  .heatmap-fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, var(--bg-card));
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    pointer-events: none;
  }

  .heatmap {
    display: block;
    width: 260px;
  }

  .heatmap-label {
    fill: var(--text-muted);
    font-size: 12px;
    font-family: inherit;
  }

  .day-label {
    text-anchor: middle;
  }

  .month-label {
    text-anchor: end;
  }

  .heatmap-cell {
    transition: opacity var(--transition-fast);
    cursor: default;
  }

  .heatmap-cell:hover {
    opacity: 0.8;
    stroke: var(--text-secondary);
    stroke-width: 1;
  }

  .heatmap-tooltip {
    position: fixed;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-size: 0.8rem;
    pointer-events: none;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: var(--shadow-card);
    transform: translateY(-50%);
    white-space: nowrap;
  }

  .heatmap-tooltip strong {
    color: var(--text-primary);
  }

  .heatmap-tooltip span {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    min-height: 36px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .section-header .section-title {
    margin-bottom: 0;
  }

  .chart-section {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chart-container {
    flex: 1;
    min-height: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 20px;
  }

  .period-selector {
    display: flex;
    gap: 4px;
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    padding: 3px;
  }

  .period-btn {
    padding: 6px 14px;
    border: none;
    background: none;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .period-btn:hover {
    color: var(--text-primary);
  }

  .period-btn.active {
    background: var(--accent);
    color: #fff;
  }

  @media (max-width: 900px) {
    .analytics-grid {
      flex-direction: column;
      align-items: center;
    }

    .heatmap-section {
      width: auto;
    }

    .heatmap-container {
      overflow-y: hidden;
    }

    .heatmap-fade {
      display: none;
    }
    .chart-section {
      width: 100%;
    }

    .chart-container {
      min-height: 280px;
    }
  }
</style>
