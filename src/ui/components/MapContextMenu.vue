<template>
  <ul id="map-context-menu" v-if="open" :style="{ ...style }">
    <li>
      <a href="" @click.prevent="setCenter">Center map here</a>
    </li>
    <li>
      <a href="" @click.prevent="setCenterAndZoom">Zoom in here</a>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { STREET_LEVEL_ZOOM } from "../const";
import { useStore } from "../store";
import Map from "./map";

export default defineComponent({
  name: "MapContextMenu",

  props: {
    map: {
      type: Map,
      required: true,
    },
  },

  setup(props) {
    const store = useStore();
    const open = computed(() => store.state.mapContextMenu.open);
    const style = computed(() => {
      return getStyle(props.map, store.state.mapContextMenu);
    });

    function getCoordinate() {
      const { x, y } = store.state.mapContextMenu;
      return props.map.getCoordinateFromPixel([x, y]);
    }

    function setCenter() {
      props.map.setCenter(getCoordinate());
    }

    function setCenterAndZoom() {
      const center = getCoordinate();
      if (props.map.getZoom() > STREET_LEVEL_ZOOM) {
        props.map.setCenter(center);
      } else {
        props.map.setCenterAndZoom(center, STREET_LEVEL_ZOOM);
      }
    }

    return { open, style, setCenter, setCenterAndZoom };
  },
});

function getStyle(map: Map, state: { open: boolean; x: number; y: number }) {
  if (!state.open) {
    return {
      display: "none",
      top: "auto",
      right: 0,
      bottom: 0,
      left: "auto",
    };
  }

  const { x, y } = state;
  const [containerWidth, containerHeight] = map.getSize() || [0, 0];
  const threshold = 200;

  let top = `${y}px`;
  let right = "auto";
  let bottom = "auto";
  let left = `${x}px`;

  if (containerWidth - x < threshold) {
    left = "auto";
    right = `${containerWidth - x}px`;
  }

  if (containerHeight - y < threshold) {
    top = "auto";
    bottom = `${containerHeight - y}px`;
  }

  return { display: "block", top, right, bottom, left };
}
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#map-context-menu {
  @include menu(
    $item-border: none,
    $item-padding: (
      $quarter-standard-spacing $half-standard-spacing,
    ),
    $item-link-color: $text-color
  );

  > li:first-child {
    border-top: 1px solid $menu-item-border-color;
  }

  position: absolute;
  z-index: 13;

  animation: fade-in 0.5s;
}
</style>
