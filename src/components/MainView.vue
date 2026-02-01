<template>
  <div class="main-view">
    <div class="map-container">
      <LMap 
        ref="map"
        :zoom="zoom"
        :center="center"
        style="height: 600px; width: 100%"
      >
        <LTileLayer :url="tileUrl" :attribution="attribution" />
      </LMap>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'

const zoom = ref(12)
const center = ref([39.271697, -76.730514])
const tileUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=***REMOVED_MAPBOX_SECRET_KEY***'
const attribution = '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
</script>

<style scoped>
.main-view {
  padding: 1rem;
}

.map-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}
</style>
