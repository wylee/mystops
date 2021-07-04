<template>
  <Menu />
  <Search />
  <Map />
  <Error />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Error from "../components/Error.vue";
import Map from "../components/Map.vue";
import Menu from "../components/Menu.vue";
import Search from "../components/Search.vue";

export default defineComponent({
  name: "Home",
  components: {
    Error,
    Map,
    Menu,
    Search,
  },
});
</script>
