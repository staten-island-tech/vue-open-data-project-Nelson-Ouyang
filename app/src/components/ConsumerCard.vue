<template>
  <div class="card" @click="goToDetails">
    <h2>{{ place.account_name }}</h2>
    <p>UMIS ID: {{ place.umis_bill_id }}</p>
    <p>Borough: {{ place.borough }}</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  place: {
    type: Object,
    required: true,
  },
})

function goToDetails() {
  router.push(`/info/${props.place.umis_bill_id}`)
}
</script>

<style scoped>
.card {
  width: 28%;
  height: 200px;
  background-color: aliceblue;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-transform: uppercase;
  transition: 0.2s;
}

.card:hover {
  background-color: lightblue;
}
</style>
