<!-- src/views/information.vue -->
<template>
  <div class="details-page" v-if="consumer">
    <h1>{{ consumer.account_name }}</h1>
    <p><strong>UMIS Bill ID:</strong> {{ consumer.umis_bill_id }}</p>
    <p><strong>Borough:</strong> {{ consumer.borough }}</p>
    <p><strong>Consumption (kWh):</strong> {{ consumer.consumption_kwh }}</p>
    <p><strong>Charges:</strong> {{ consumer.current_charges }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const consumer = ref(null)

async function getConsumer(id) {
  try {
    const response = await fetch(
      `https://data.cityofnewyork.us/resource/jr24-e7cr.json?umis_bill_id=${id}`,
    )
    if (!response.ok) throw new Error('Network error')

    const data = await response.json()
    consumer.value = data[0]
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  getConsumer(route.params.id)
})

watch(
  () => route.params.id,
  (newId) => {
    getConsumer(newId)
  },
)
</script>

<style scoped>
.details-page {
  width: 60vw;
  margin: 40px auto;
  padding: 20px;
  background: aliceblue;
}
</style>
