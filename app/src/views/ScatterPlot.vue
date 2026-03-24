<template>
  <div class="page">
    <div class="header">
      <p class="eyebrow">NYC Housing Authority — Energy Billing</p>
      <h1>Energy consumption vs. kWh charges</h1>
      <p class="subtitle">Each point is one meter. Fetched live from NYC Open Data.</p>
    </div>

    <div v-if="loading" class="state-msg">Loading data...</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }}</div>

    <template v-else>
      <div class="card">
        <div class="filters">
          <button
            :class="['pill', activeBorough === null ? 'pill--all-active' : '']"
            @click="activeBorough = null"
          >
            All boroughs
          </button>

          <button
            v-for="b in boroughs"
            :key="b"
            class="pill"
            :style="
              activeBorough === b
                ? `background:${colorFor(b)};border-color:${colorFor(b)};color:#fff`
                : 'border-color:rgba(128,128,128,0.25)'
            "
            @click="activeBorough = activeBorough === b ? null : b"
          >
            <span class="dot" :style="`background:${colorFor(b)}`" />
            {{ capitalize(b) }}
          </button>
        </div>

        <div ref="wrapperRef" class="chart-wrapper">
          <svg ref="svgRef" style="display: block; width: 100%" />

          <div
            v-if="tooltip"
            class="tooltip"
            :style="`left:${tooltip.x + 14}px;top:${tooltip.y - 14}px`"
          >
            <div class="tt-title">{{ tooltip.d.development_name }}</div>
            <div class="tt-loc">{{ tooltip.d.location }}</div>
            <span class="tt-badge" :style="`background:${colorFor(tooltip.d.borough)}`">
              {{ capitalize(tooltip.d.borough) }}
            </span>

            <table class="tt-table">
              <tbody>
                <tr>
                  <td>Consumption</td>
                  <td>{{ Number(tooltip.d.consumption_kwh).toLocaleString() }} kWh</td>
                </tr>
                <tr>
                  <td>kWh charges</td>
                  <td>
                    ${{
                      Number(tooltip.d.kwh_charges).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }}
                  </td>
                </tr>
                <tr>
                  <td>Rate</td>
                  <td>
                    {{
                      Number(tooltip.d.consumption_kwh) > 0
                        ? '$' +
                          (
                            Number(tooltip.d.kwh_charges) / Number(tooltip.d.consumption_kwh)
                          ).toFixed(4)
                        : '—'
                    }}/kWh
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="summary-grid">
        <div v-for="m in summaryCards" :key="m.label" class="metric-card">
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-value">{{ m.value }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'

const consumers = ref([])
const loading = ref(true)
const error = ref(null)

async function getConsumers() {
  try {
    const res = await fetch('https://data.cityofnewyork.us/resource/jr24-e7cr.json?$limit=50000')
    if (!res.ok) throw new Error('Network error')
    consumers.value = await res.json()
  } catch (err) {
    error.value = 'Failed to load data: ' + err.message
  } finally {
    loading.value = false
  }
}

onMounted(getConsumers)

const validData = computed(() =>
  consumers.value.filter((d) => Number(d.consumption_kwh) > 0 && Number(d.kwh_charges) > 0),
)

const boroughs = computed(() =>
  [...new Set(validData.value.map((d) => d.borough).filter(Boolean))].sort(),
)

const PALETTE = ['#378ADD', '#1D9E75', '#D85A30', '#BA7517', '#8B5CF6', '#EC4899']

const colorFor = (b) => PALETTE[boroughs.value.indexOf(b) % PALETTE.length]

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '')

const activeBorough = ref(null)

const filteredData = computed(() =>
  activeBorough.value
    ? validData.value.filter((d) => d.borough === activeBorough.value)
    : validData.value,
)

const summaryCards = computed(() => {
  const totalKwh = d3.sum(validData.value, (d) => Number(d.consumption_kwh))
  const totalCharges = d3.sum(validData.value, (d) => Number(d.kwh_charges))

  return [
    { label: 'Meters shown', value: validData.value.length },
    { label: 'Total kWh', value: totalKwh.toLocaleString() },
    {
      label: 'Total kWh charges',
      value: '$' + totalCharges.toLocaleString(),
    },
    {
      label: 'Avg rate',
      value: totalKwh > 0 ? '$' + (totalCharges / totalKwh).toFixed(4) : '—',
    },
  ]
})

const svgRef = ref(null)
const wrapperRef = ref(null)
const tooltip = ref(null)
const dims = ref({ width: 800, height: 480 })

const MARGIN = { top: 24, right: 32, bottom: 60, left: 72 }

function drawChart() {
  if (!svgRef.value || !validData.value.length) return

  const { width, height } = dims.value
  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom
  const data = filteredData.value
  if (!data.length) return

  const allX = validData.value.map((d) => Number(d.consumption_kwh))
  const allY = validData.value.map((d) => Number(d.kwh_charges))

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(allX)])
    .range([0, innerW])
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(allY)])
    .range([innerH, 0])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  // axes
  g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(xScale))

  g.append('g').call(d3.axisLeft(yScale))

  // dots
  g.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (d) => xScale(Number(d.consumption_kwh)))
    .attr('cy', (d) => yScale(Number(d.kwh_charges)))
    .attr('r', 6)
    .attr('fill', (d) => colorFor(d.borough))
}

let ro
onMounted(() => {
  if (!wrapperRef.value) return
  ro = new ResizeObserver((entries) => {
    const { width } = entries[0].contentRect
    dims.value = { width, height: width * 0.56 }
  })
  ro.observe(wrapperRef.value)
})

onBeforeUnmount(() => ro?.disconnect())

watch([dims, filteredData], drawChart, { flush: 'post' })
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
  max-width: 960px;
  margin: 0 auto 1.5rem;
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
  max-width: 960px;
  margin: 2rem auto;
  font-size: 14px;
  color: var(--color-text-secondary, #666);
}
.state-msg--error {
  color: #c0392b;
}
.card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, rgba(0, 0, 0, 0.12));
  border-radius: 12px;
  padding: 1.25rem 1rem 1rem;
  max-width: 960px;
  margin: 0 auto;
  box-sizing: border-box;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
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
.pill--all-active {
  background: #111;
  border-color: #111;
  color: #fff;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chart-wrapper {
  width: 100%;
  position: relative;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-secondary, rgba(0, 0, 0, 0.2));
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
  min-width: 170px;
}
.tt-title {
  font-weight: 500;
  font-size: 13px;
  color: var(--color-text-primary, #111);
  margin-bottom: 4px;
}
.tt-loc {
  color: var(--color-text-secondary, #666);
  margin-bottom: 4px;
}
.tt-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  color: #fff;
  margin-bottom: 6px;
}
.tt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.tt-table td:first-child {
  color: var(--color-text-secondary, #666);
  padding-right: 8px;
}
.tt-table td:last-child {
  font-weight: 500;
  text-align: right;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  max-width: 960px;
  margin: 1.25rem auto 0;
}
.metric-card {
  background: var(--color-background-secondary, #f5f4f0);
  border-radius: 8px;
  padding: 12px 16px;
}
.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin-bottom: 4px;
}
.metric-value {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-primary, #111);
}
</style>
