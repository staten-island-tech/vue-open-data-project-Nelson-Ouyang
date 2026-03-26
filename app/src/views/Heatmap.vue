<template>
  <div class="page">
    <div class="header">
      <p class="eyebrow">NYC Housing Authority — Energy Billing</p>
      <h1>Charge breakdown by building (Takes long time to load)</h1>
      <p class="subtitle">
        Each cell shows a charge component. Darker = higher cost. Fetched live from NYC Open Data.
      </p>
    </div>

    <div v-if="loading" class="state-msg">Loading data…</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }}</div>

    <template v-else>
      <div class="summary-grid">
        <div v-for="m in summaryCards" :key="m.label" class="metric-card">
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-value">{{ m.value }}</div>
        </div>
      </div>

      <div class="card">
        <div class="controls">
          <div class="filters">
            <button
              :class="['pill', activeBorough === null ? 'pill--active' : '']"
              @click="activeBorough = null"
            >
              All boroughs
            </button>
            <button
              v-for="b in boroughs"
              :key="b"
              :class="['pill', activeBorough === b ? 'pill--active' : '']"
              :style="activeBorough === b ? `--pill-color:${colorFor(b)}` : ''"
              @click="activeBorough = activeBorough === b ? null : b"
            >
              <span class="dot" :style="`background:${colorFor(b)}`" />
              {{ capitalize(b) }}
            </button>
          </div>

          <div class="col-toggles">
            <label v-for="col in columns" :key="col.key" class="toggle">
              <input type="checkbox" v-model="col.visible" />
              <span>{{ col.label }}</span>
            </label>
          </div>
        </div>

        <div class="heatmap-scroll">
          <div
            class="heatmap"
            :style="`grid-template-columns: 180px repeat(${visibleCols.length}, minmax(110px, 1fr))`"
          >
            <!-- corner -->
            <div class="hm-corner">Building</div>

            <!-- column headers -->
            <div v-for="col in visibleCols" :key="col.key" class="hm-col-header">
              {{ col.label }}
            </div>

            <!-- rows -->
            <template v-for="row in filteredData" :key="row._id">
              <div class="hm-row-label">
                <span class="dev-name">{{ row.development_name }}</span>
                <span class="dev-loc">{{ row.location || '—' }}</span>
                <span class="borough-dot" :style="`background:${colorFor(row.borough)}`" />
              </div>

              <div
                v-for="col in visibleCols"
                :key="col.key"
                class="hm-cell"
                :style="cellStyle(row, col)"
                @mouseenter="(e) => showTooltip(e, row, col)"
                @mouseleave="tooltip = null"
              >
                <span class="cell-val">{{ formatCell(row, col) }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend">
          <span class="legend-label">$0</span>
          <div class="legend-bar">
            <div v-for="i in 20" :key="i" class="legend-step" :style="`opacity:${i / 20}`" />
          </div>
          <span class="legend-label">High</span>
          <span class="legend-note">— per column</span>
        </div>
      </div>

      <!-- Tooltip -->
      <Teleport to="body">
        <div
          v-if="tooltip"
          class="tooltip"
          :style="`left:${tooltip.x + 16}px;top:${tooltip.y - 8}px`"
        >
          <div class="tt-dev">{{ tooltip.row.development_name }}</div>
          <div class="tt-loc">{{ tooltip.row.location || '—' }}</div>
          <span class="tt-badge" :style="`background:${colorFor(tooltip.row.borough)}`">
            {{ capitalize(tooltip.row.borough) }}
          </span>
          <table class="tt-table">
            <tr>
              <td>{{ tooltip.col.label }}</td>
              <td>
                ${{
                  Number(tooltip.row[tooltip.col.key]).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
              </td>
            </tr>
            <tr v-if="tooltip.col.key === 'kwh_charges'">
              <td>Consumption</td>
              <td>{{ Number(tooltip.row.consumption_kwh).toLocaleString() }} kWh</td>
            </tr>
            <tr v-if="tooltip.col.key === 'kw_charges'">
              <td>Demand</td>
              <td>{{ Number(tooltip.row.consumption_kw).toFixed(2) }} kW</td>
            </tr>
            <tr>
              <td>% of total</td>
              <td>{{ pctOfTotal(tooltip.row, tooltip.col) }}%</td>
            </tr>
          </table>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const records = ref([])
const loading = ref(true)
const error = ref(null)

async function fetchData() {
  try {
    const res = await fetch(
      'https://data.cityofnewyork.us/resource/jr24-e7cr.json?$limit=10000&$where=current_charges>0',
    )
    if (!res.ok) throw new Error('Network error ' + res.status)
    records.value = await res.json()
  } catch (err) {
    error.value = 'Failed to load: ' + err.message
  } finally {
    loading.value = false
  }
}

fetchData()

const columns = reactive([
  { key: 'current_charges', label: 'Total charges', visible: true },
  { key: 'kwh_charges', label: 'kWh charges', visible: true },
  { key: 'kw_charges', label: 'kW charges', visible: true },
  { key: 'other_charges', label: 'Other charges', visible: true },
])

const visibleCols = computed(() => columns.filter((c) => c.visible))

const PALETTE = ['#378ADD', '#1D9E75', '#D85A30', '#BA7517', '#8B5CF6', '#EC4899']

const boroughs = computed(() =>
  [...new Set(records.value.map((d) => d.borough).filter(Boolean))].sort(),
)
const colorFor = (b) => PALETTE[boroughs.value.indexOf(b) % PALETTE.length]
const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '')

const activeBorough = ref(null)

const filteredData = computed(() =>
  activeBorough.value
    ? records.value.filter((d) => d.borough === activeBorough.value)
    : records.value,
)

// Per-column max across all data (not just filtered) so scale stays stable
const colMax = computed(() => {
  const out = {}
  columns.forEach((col) => {
    out[col.key] = Math.max(...records.value.map((d) => Number(d[col.key]) || 0))
  })
  return out
})

function cellStyle(row, col) {
  const val = Number(row[col.key]) || 0
  const max = colMax.value[col.key] || 1
  const t = val / max
  if (val === 0)
    return { background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }
  // Blue ramp: light → saturated
  const r = Math.round(230 - t * 150)
  const g = Math.round(241 - t * 100)
  const b = Math.round(255 - t * 90)
  const textColor = t > 0.55 ? '#fff' : 'var(--color-text-primary)'
  return { background: `rgb(${r},${g},${b})`, color: textColor }
}

function formatCell(row, col) {
  const val = Number(row[col.key]) || 0
  if (val === 0) return '—'
  if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'k'
  return '$' + val.toFixed(0)
}

function pctOfTotal(row, col) {
  const total = Number(row.current_charges) || 1
  const val = Number(row[col.key]) || 0
  return ((val / total) * 100).toFixed(1)
}

const tooltip = ref(null)

function showTooltip(e, row, col) {
  tooltip.value = { x: e.clientX, y: e.clientY, row, col }
}

const summaryCards = computed(() => {
  const data = records.value
  const total = data.reduce((s, d) => s + (Number(d.current_charges) || 0), 0)
  const kwh = data.reduce((s, d) => s + (Number(d.consumption_kwh) || 0), 0)
  const other = data.reduce((s, d) => s + (Number(d.other_charges) || 0), 0)
  return [
    { label: 'Meters', value: data.length },
    {
      label: 'Total charges',
      value: '$' + total.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    },
    { label: 'Total kWh', value: kwh.toLocaleString() },
    {
      label: 'Other charges',
      value: '$' + other.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    },
  ]
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-background-tertiary, #f5f4f0);
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  font-family: var(--font-sans, sans-serif);
}

.header {
  max-width: 1100px;
  margin: 0 auto 1.25rem;
}
.eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, #999);
  margin: 0 0 4px;
}
h1 {
  font-size: 22px;
  font-weight: 500;
  margin: 0 0 4px;
  color: var(--color-text-primary, #111);
}
.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary, #666);
  margin: 0;
}
.state-msg {
  max-width: 1100px;
  margin: 2rem auto;
  font-size: 14px;
  color: var(--color-text-secondary, #666);
}
.state-msg--error {
  color: #c0392b;
}

/* Summary cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto 1.25rem;
}
.metric-card {
  background: var(--color-background-secondary, #efefef);
  border-radius: 8px;
  padding: 12px 16px;
}
.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin-bottom: 4px;
}
.metric-value {
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-primary, #111);
}

/* Main card */
.card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, rgba(0, 0, 0, 0.12));
  border-radius: 12px;
  padding: 1.25rem 1rem 1rem;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Controls */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pill {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1.5px solid rgba(128, 128, 128, 0.25);
  background: transparent;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.pill--active {
  background: var(--pill-color, #111);
  border-color: var(--pill-color, #111);
  color: #fff;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.col-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  user-select: none;
}
.toggle input {
  cursor: pointer;
  accent-color: #378add;
}

/* Heatmap grid */
.heatmap-scroll {
  overflow-x: auto;
  width: 100%;
}
.heatmap {
  display: grid;
  gap: 2px;
  width: max-content;
  min-width: 100%;
}
.hm-corner {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary, #aaa);
  display: flex;
  align-items: flex-end;
  padding-bottom: 6px;
}
.hm-col-header {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary, #666);
  text-align: center;
  padding-bottom: 6px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  line-height: 1.3;
}
.hm-row-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding-right: 10px;
  min-height: 40px;
  position: relative;
}
.dev-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.dev-loc {
  font-size: 11px;
  color: var(--color-text-tertiary, #aaa);
}
.borough-dot {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.hm-cell {
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: filter 0.1s;
}
.hm-cell:hover {
  filter: brightness(0.88);
}
.cell-val {
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
}

/* Legend */
.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 1rem;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
}
.legend-bar {
  display: flex;
  width: 100px;
  height: 10px;
  border-radius: 3px;
  overflow: hidden;
}
.legend-step {
  flex: 1;
  background: #378add;
}
.legend-note {
  color: var(--color-text-tertiary, #aaa);
}
.legend-label {
  font-size: 11px;
}

/* Tooltip */
.tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-secondary, rgba(0, 0, 0, 0.2));
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 180px;
}
.tt-dev {
  font-weight: 500;
  font-size: 13px;
  color: var(--color-text-primary, #111);
  margin-bottom: 2px;
}
.tt-loc {
  color: var(--color-text-secondary, #666);
  margin-bottom: 6px;
  font-size: 12px;
}
.tt-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  color: #fff;
  margin-bottom: 8px;
}
.tt-table {
  width: 100%;
  border-collapse: collapse;
}
.tt-table td {
  padding: 2px 0;
}
.tt-table td:first-child {
  color: var(--color-text-secondary, #666);
  padding-right: 12px;
}
.tt-table td:last-child {
  font-weight: 500;
  text-align: right;
}
</style>
