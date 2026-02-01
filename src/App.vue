<template>
  <div id="app">
    <h1>BCPS School Redistricting Tool</h1>
    <p>Modernization in progress - Vue 3 + TypeScript + Vite</p>
    <MainView />
  </div>
</template>

<script setup lang="ts">
import MainView from './components/MainView.vue'
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1 {
  color: #2c3e50;
  margin: 1rem;
}

p {
  margin: 1rem;
  color: #666;
}
</style>
