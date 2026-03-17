<template>
  <div class="details-page">
    <h1>{{ consumer.account_name }}</h1>
    <p>ID: {{ consumer.id }}</p>
    <p>UMIS Bill ID: {{ consumer.umis_bill_id }}</p>
    <p>Borough: {{ consumer.borough }}</p>
    <p>Consumption (kWh): {{ consumer.consumption_kwh }}</p>
    <p>Charges: {{ consumer.current_charges }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  consumer: {
    type: Object,
    required: true,
  },
})
</script>
