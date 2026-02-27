<script>
  let { min = 0, max = 1000, valueMin = 0, valueMax = 1000, onChange } = $props();

  let fillLeft = $derived(
    max > min ? ((valueMin - min) / (max - min)) * 100 : 0
  );
  let fillWidth = $derived(
    max > min ? ((valueMax - valueMin) / (max - min)) * 100 : 100
  );

  function handleMinInput(e) {
    let val = parseInt(e.target.value);
    if (val > valueMax) val = valueMax;
    onChange(val, valueMax);
  }

  function handleMaxInput(e) {
    let val = parseInt(e.target.value);
    if (val < valueMin) val = valueMin;
    onChange(valueMin, val);
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
      {min}
      {max}
      value={valueMin}
      oninput={handleMinInput}
    />
    <input
      type="range"
      {min}
      {max}
      value={valueMax}
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
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  .price-filter-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .price-filter-values {
    font-size: 0.8rem;
    color: var(--text-primary);
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
    text-align: center;
  }

  .range-slider {
    position: relative;
    width: 90px;
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
    background: var(--accent);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--bg-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .range-slider input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--bg-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .range-track {
    position: absolute;
    width: 100%;
    height: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-elevated);
    border-radius: 2px;
    z-index: 0;
  }

  .range-fill {
    position: absolute;
    height: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--accent);
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
