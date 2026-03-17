<template>
  <div class="container">
    <ConsumerCard
      v-for="(place, index) in consumer"
      :key="place.umis_bill_id"
      :place="{ ...place, id: index + 1 }"
    />
    <Information v-if="selectedConsumer" :consumer="selectedConsumer" />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const consumer = ref([])
async function getConsumer() {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/jr24-e7cr.json')
    const data = await response.json()
    consumer.value = data
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
