<template>
  <div id="menu" :style="{ right: menuOpen ? 0 : 'auto' }">
    <button
      type="button"
      :title="buttonTitle"
      class="material-icons"
      @click="toggleMenu()"
    >
      <template v-if="menuOpen">close</template>
      <template v-else>menu</template>
    </button>

    <div class="menu-backdrop" @click="closeMenu()" v-if="menuOpen" />

    <ul class="menu" v-if="menuOpen">
      <li class="title">MyStops</li>

      <li>
        <a href="/" class="regular-link">
          <span class="material-icons">home</span>
          <span>Home</span>
        </a>
      </li>

      <li v-for="(layer, i) in layers" :key="i">
        <div v-if="i === baseLayer">
          <span class="material-icons">layers</span>
          <span>{{ layer }}</span>
        </div>
        <a v-else href="" @click.prevent="setBaseLayer(i)">
          <span class="material-icons">layers</span>
          <span>{{ layer }}</span>
        </a>
      </li>

      <li class="section-heading">
        <span>Links</span>
      </li>

      <li>
        <a href="https://trimet.org/" class="regular-link">
          <span class="material-icons">link</span>
          <span>TriMet</span>
        </a>
      </li>

      <li class="section-heading">
        <span>Info</span>
      </li>

      <li class="info">
        <div>
          <p>
            Arrival data provided by
            <a href="https://developer.trimet.org/">TriMet</a>.
          </p>
        </div>
      </li>

      <li class="info">
        <div>
          <p>
            Map data &copy; <a href="https://mapbox.com/">Mapbox</a> &
            <a href="https://openstreetmap.org/">OpenStreetMap</a>
          </p>
        </div>
      </li>

      <li class="info">
        <div>
          <p>
            This application is currently in the initial stages of development
            and <i>should not</i> be considered a reliable source for TriMet
            arrival times or any other information. Arrival times and other
            information <i>should</i> be verified via
            <a href="https://trimet.org/">TriMet's official TransitTracker™</a>
            or by other means.
          </p>
          <p>
            Contact: <a href="mailto:contact@mystops.io">contact@mystops.io</a>
          </p>
          <p>&copy; 2018, 2021 mystops.io</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { BASE_LAYER_LABELS } from "../const";
import { useStore } from "../store";

export default defineComponent({
  name: "Menu",
  setup() {
    const store = useStore();
    return {
      menuOpen: computed(() => store.state.menuOpen),
      buttonTitle: computed(() =>
        store.state.menuOpen ? "Close menu" : "Open menu"
      ),
      layers: BASE_LAYER_LABELS,
      baseLayer: computed(() => store.state.baseLayer),
      setBaseLayer: (baseLayer: number) => {
        store.commit("setBaseLayer", { baseLayer });
        store.commit("closeMenu");
      },
      closeMenu: () => store.commit("closeMenu"),
      toggleMenu: () => store.commit("toggleMenu"),
    };
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins.scss";
@import "../assets/styles/variables.scss";

#menu {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 40;

  > button {
    position: absolute;
    top: $standard-spacing;
    left: $standard-spacing;
    z-index: 3;

    @media (max-width: $xs-width - 1px) {
      top: $quarter-standard-spacing;
      left: $quarter-standard-spacing;
    }
  }

  > div.menu-backdrop,
  ul.menu {
    animation: fade-in 0.5s;
  }

  > div.menu-backdrop {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.5);
  }

  > ul.menu {
    @include menu();

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
    z-index: 2;
    width: $menu-width;

    > li.title {
      @include title();
      text-align: right;

      &:hover {
        background-color: white;
      }
    }

    @media (max-width: $xs-width - 1px) {
      right: 0;
      width: auto;
    }
  }
}
</style>
