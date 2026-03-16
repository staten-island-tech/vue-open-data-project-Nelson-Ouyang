<template>
  <div class="container">
    <ConsumerCard v-for="(mon, index) in consumer" :key=".name" :consumer="" :id="index + 1" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PokemonCard from '@/components/PokemonCard.vue'
const consumer = ref([])
async function getConsumer() {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/jr24-e7cr.json')
    const data = await response.json()
    consumer.value = data.results
  } catch (error) {
    console.log(error)
  }
}
onMounted(() => {
  getConsumer()
})
</script>

<style scoped>
.container {
  width: 80vw;
  margin: 30px auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}
</style>
