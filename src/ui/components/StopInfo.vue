<template>
  <div id="stop-info" v-if="stopInfo" :style="{ ...stopInfo.position }">
    <div class="stop-info-title">Stop {{ stopInfo.id }}</div>
    <div>{{ stopInfo.name }}</div>
    <div>{{ stopInfo.direction }}</div>
    <div>Routes: {{ stopInfo.routes }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from "vue";
import Feature from "ol/Feature";
import Map from "./map";
import { useStore } from "../store";

interface StopInfo {
  id: number;
  name: string;
  direction: string | null;
  routes: Array<any>;
  position: Position;
}

interface Position {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface Setup {
  stopInfo: Ref<StopInfo | null>;
}

export default defineComponent({
  name: "Stop Info",
  props: {
    map: {
      type: Map,
      required: true,
    },
  },
  setup(props): Setup {
    const store = useStore();
    const stopInfo = ref<StopInfo | null>(null);
    onMounted(() => {
      props.map.onFeature(
        "pointermove",
        (map, feature, px) => {
          if (!store.state.mapContextMenu.open) {
            stopInfo.value = getStopInfo(map, feature, px);
          }
        },
        () => (stopInfo.value = null),
        props.map.getLayer("Stops"),
        10
      );
      props.map.on("contextmenu", () => {
        stopInfo.value = null;
      });
    });
    return { stopInfo };
  },
});

function getStopInfo(map: Map, feature: Feature, pixel: number[]): StopInfo {
  const [width, height] = map.getSize();
  const [x, y] = [width / 2, height / 2];
  const buffer = 10;
  const properties = feature.getProperties();

  let left: any = pixel[0];
  let top: any = pixel[1];
  let right: any = "auto";
  let bottom: any = "auto";

  if (left > x) {
    [left, right] = ["auto", width - left];
  }

  if (top > y) {
    [top, bottom] = ["auto", height - top];
  }

  [top, right, bottom, left] = [top, right, bottom, left].map((value) => {
    return value === "auto" ? value : `${value + buffer}px`;
  });

  return {
    id: properties.id,
    name: properties.name,
    direction: properties.direction || "N/A",
    routes: properties.routes || "N/A",
    position: { top, right, bottom, left },
  };
}
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/variables.scss";

#stop-info {
  position: absolute;
  z-index: 10;

  padding: $quarter-standard-spacing;

  color: #084c8d;
  background-color: white;
  box-shadow: 2px 2px 4px 2px #084c8d;

  animation: fade-in 0.5s;

  > * {
    line-height: 1.2;
  }

  > .stop-info-title {
    font-size: 110%;
    font-weight: bold;
    margin-bottom: $quarter-standard-spacing;
  }
}
</style>
