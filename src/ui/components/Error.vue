<template>
  <div id="error" v-if="error">
    <div id="title">
      {{ error.title }}
    </div>
    <div id="message">
      <p id="explanation">
        {{ error.explanation }}
      </p>
      <p id="detail" v-if="error.detail">
        {{ error.detail }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "../store";

export default defineComponent({
  name: "Error",
  setup() {
    const store = useStore();
    const error = computed(() => store.state.error);
    return { error };
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#error {
  position: absolute;
  width: $panel-width;
  z-index: 2;
  animation: fade-in 0.75s;

  @include floating-element();

  background-color: white;
  color: red;
  margin: 0;
  padding: $standard-spacing;
  padding-top: 40px + $twice-standard-spacing;

  #title {
    font-size: 20px;
    margin-bottom: $standard-spacing;
  }

  #message:last-child {
    margin-bottom: 0;
  }

  @media (max-width: $xs-width - 1px) {
    padding: $half-standard-spacing;
    padding-top: 40px + $standard-spacing;
  }
}
</style>
