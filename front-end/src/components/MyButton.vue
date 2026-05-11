<template>
  <a v-if="isExternalLink" :href="address" class="button" target="_blank">
    {{ title }}
  </a>
  <router-link v-else :to="address" class="button">
    {{ title }}
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  address: String
})

const isExternalLink = computed(() => {
  return props.address && (props.address.startsWith('http://') || props.address.startsWith('https://'))
})
</script>