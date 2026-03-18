<template>
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
.container {
  width: 80vw;
  margin: 30px auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}
</style>
