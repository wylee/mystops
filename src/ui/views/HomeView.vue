<template>
  <MenuComponent />
  <SearchComponent />
  <MapComponent />
  <ErrorComponent />
</template>

<script lang="ts">
import ErrorComponent from "../components/ErrorComponent.vue";
import MapComponent from "../components/MapComponent.vue";
import MenuComponent from "../components/MenuComponent.vue";
import SearchComponent from "../components/SearchComponent.vue";

export default {
  components: {
    ErrorComponent,
    MapComponent,
    MenuComponent,
    SearchComponent,
  },
};
</script>
