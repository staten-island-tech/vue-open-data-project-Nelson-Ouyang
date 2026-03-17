<template>
  <div class="card">
    <h2>{{ place.account_name }}</h2>
    <h3>{{ place.id }}</h3>
  </div>
</template>

<script setup>
const props = defineProps({
  place: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.card {
  width: 28%;
  height: 500px;
  background-color: aliceblue;
  margin: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  text-transform: uppercase;
}
img {
  width: 100%;
  height: 80%;
  object-fit: cover;
}
</style>
