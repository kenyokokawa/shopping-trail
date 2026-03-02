<script>
  let { min = 0, max = 1000, valueMin = 0, valueMax = 1000, onChange } = $props();

  // Aggressive log scale: base 1000 so the slider dedicates most of its
  // range to lower prices. Midpoint ≈ 3% of max price.
  // Formula: price = max * (1000^(pos/STEPS) - 1) / 999
  const STEPS = 1000;
  const BASE = 1000;
  const LOG_BASE = Math.log(BASE);

  function priceToPos(price) {
    if (max <= 0 || price <= 0) return 0;
    if (price >= max) return STEPS;
    return Math.round(STEPS * Math.log(1 + (BASE - 1) * price / max) / LOG_BASE);
  }

  function posToPrice(pos) {
    if (max <= 0) return 0;
    if (pos <= 0) return 0;
    if (pos >= STEPS) return max;
    return Math.round(max * (Math.pow(BASE, pos / STEPS) - 1) / (BASE - 1));
  }

  let posMin = $derived(priceToPos(valueMin));
  let posMax = $derived(priceToPos(valueMax));

  let fillLeft = $derived(
    STEPS > 0 ? (posMin / STEPS) * 100 : 0
  );
  let fillWidth = $derived(
    STEPS > 0 ? ((posMax - posMin) / STEPS) * 100 : 100
  );

  function handleMinInput(e) {
    let pos = parseInt(e.target.value);
    if (pos > posMax) pos = posMax;
    onChange(posToPrice(pos), valueMax);
  }

  function handleMaxInput(e) {
    let pos = parseInt(e.target.value);
    if (pos < posMin) pos = posMin;
    onChange(valueMin, posToPrice(pos));
  }
</script>

<div class="price-filter">
  <span class="price-filter-label">Price:</span>
  <span class="price-filter-values">
    <span>${valueMin}</span> - <span>${valueMax}</span>
  </span>
  <div class="range-slider">
    <input
      type="range"
      min={0}
      max={STEPS}
      value={posMin}
      oninput={handleMinInput}
    />
    <input
      type="range"
      min={0}
      max={STEPS}
      value={posMax}
      oninput={handleMaxInput}
    />
    <div class="range-track"></div>
    <div
      class="range-fill"
      style:left="{fillLeft}%"
      style:width="{fillWidth}%"
    ></div>
  </div>
</div>

<style>
  .price-filter {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
  }

  .price-filter-label {
    font-size: 0.8rem;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .price-filter-values {
    font-size: 0.8rem;
    color: var(--foreground);
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
    text-align: center;
  }

  .range-slider {
    position: relative;
    width: 270px;
    height: 20px;
  }

  .range-slider input[type='range'] {
    position: absolute;
    width: 100%;
    height: 4px;
    top: 50%;
    transform: translateY(-50%);
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    pointer-events: none;
    z-index: 2;
  }

  .range-slider input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--background);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .range-slider input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--background);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .range-track {
    position: absolute;
    width: 100%;
    height: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--muted);
    border-radius: 2px;
    z-index: 0;
  }

  .range-fill {
    position: absolute;
    height: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--primary);
    border-radius: 2px;
    z-index: 1;
  }

  @media (max-width: 900px) {
    .price-filter {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
