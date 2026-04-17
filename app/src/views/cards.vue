<template>
  <div class="nav-section">
    <h1>Here are the plot links ok?</h1>
    <div class="plot-links">
      <router-link to="/scatterplot" class="plot-link">Scatter Plot</router-link>
      <router-link to="/heatmap" class="plot-link">Heatmap</router-link>
    </div>
  </div>
  <div class="container">
    <ConsumerCard v-for="place in consumers" :key="place.umis_bill_id" :place="place" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ConsumerCard from '@/components/ConsumerCard.vue'

const consumers = ref([])

async function getConsumers() {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/jr24-e7cr.json?$limit=100')
    if (!response.ok) throw new Error('Network error')

    consumers.value = await response.json()
  } catch (error) {
    console.log(error)
  }
}

onMounted(getConsumers)
</script>

<style scoped>
.nav-section {
  text-align: center;
  padding: 20px;
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.plot-links {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 15px;
}

.plot-link {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.plot-link:hover {
  background-color: #0056b3;
}

.container {
  width: 80vw;
  margin: 30px auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}
</style>
