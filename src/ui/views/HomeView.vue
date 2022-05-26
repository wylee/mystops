<template>
  <MenuComponent />
  <SearchComponent />
  <MapComponent :map="map" />
  <ErrorComponent />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, provide } from "vue";
import MapService from "../components/MapService";
import ErrorComponent from "../components/ErrorComponent.vue";
import MapComponent from "../components/MapComponent.vue";
import MenuComponent from "../components/MenuComponent.vue";
import SearchComponent from "../components/SearchComponent.vue";

const map = new MapService();

provide("map", map);

onMounted(() => {
  map.setTarget("map", "overview-map");
  map.startTracking();
});

onUnmounted(() => {
  map.cleanup();
});
</script>
