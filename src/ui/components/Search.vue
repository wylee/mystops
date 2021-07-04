<template>
  <div id="search">
    <form @submit.prevent="() => search()">
      <input
        type="text"
        title="Enter a stop ID or name"
        placeholder="Enter a stop ID or name"
        autofocus
        v-model="term"
      />

      <button
        type="submit"
        title="Search"
        class="material-icons"
        :disabled="!term.trim()"
      >
        search
      </button>

      <button
        type="reset"
        title="Clear"
        class="material-icons"
        @click="reset"
        :disabled="!(term || error)"
      >
        close
      </button>
    </form>

    <Result />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useStore } from "../store";
import Result from "./Result.vue";

export default defineComponent({
  name: "Search",
  components: { Result },
  setup() {
    const store = useStore();
    const error = computed(() => store.state.error);
    const internalTerm = ref<string | null>(null);
    const term = computed({
      get: () => internalTerm.value ?? store.state.term,
      set: (value: any) => (value ? (internalTerm.value = value) : reset()),
    });
    function search() {
      const searchTerm = term.value;
      // XXX: The search action will normalize & re-set the search term.
      internalTerm.value = null;
      store.dispatch("search", { term: searchTerm });
    }
    function reset() {
      internalTerm.value = null;
      store.commit("resetSearchState");
    }
    return { term, error, reset, search };
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#search {
  position: absolute;
  width: $panel-width;
  z-index: 3;

  form {
    @include floating-element();

    position: absolute;
    top: $standard-spacing;
    left: $standard-spacing;
    width: $panel-width - $twice-standard-spacing;
    z-index: 1;

    display: flex;
    flex-direction: row;
    margin: 0;
    padding: 0;

    background-color: white;

    input {
      border: none;
      flex: 1;
      font-size: 16px;
      line-height: 22px;
      height: 40px;
      min-width: 10em;
      outline: 0;
      margin: 0;
      padding: 0 $quarter-standard-spacing 0 (32px + $half-standard-spacing);

      @media (max-width: $xs-width - 1px) {
        font-size: 14px;
      }
    }

    span {
      color: gray;
      font-size: 22px;
      line-height: 1;
      margin: $half-standard-spacing 0;
    }

    @media (max-width: $xs-width - 1px) {
      top: $quarter-standard-spacing;
      left: $quarter-standard-spacing;
      right: $quarter-standard-spacing;
      width: auto;
    }
  }

  @media (max-width: $xs-width - 1px) {
    width: 100%;
  }
}
</style>
