<template>
  <div id="map" @click="onClick" @contextmenu.prevent.stop="onContextMenu">
    <div class="controls bottom-left column" @contextmenu.stop="">
      <div class="mapbox-wordmark">
        <a
          href="https://www.mapbox.com/about/maps/"
          title="Map tiles and styling provided by Mapbox"
        >
          <img :src="MAPBOX_WORDMARK_IMAGE_DATA" height="18" alt="Mapbox" />
        </a>
      </div>

      <div id="overview-map" title="Change base map" @click="nextBaseLayer()">
        <div class="label">{{ nextBaseLayerLabel }}</div>
      </div>
    </div>

    <div class="controls bottom-right column">
      <button
        type="button"
        title="Find my location"
        class="material-icons"
        @click="zoomToUserLocation()"
      >
        my_location
      </button>

      <button
        title="Zoom to full extent"
        class="material-icons hidden-xs"
        @click="map.setInitialCenterAndZoom()"
      >
        public
      </button>

      <button
        type="button"
        title="Zoom in"
        class="material-icons"
        @click="map.zoomIn()"
      >
        add
      </button>

      <button
        type="button"
        title="Zoom out"
        class="material-icons"
        @click="map.zoomOut()"
      >
        remove
      </button>

      <button
        type="button"
        title="Change base map"
        class="material-icons visible-sm"
        @click="nextBaseLayer()"
      >
        layers
      </button>
    </div>

    <div id="attributions" @contextmenu.stop="">
      <div class="mapbox-copyright">
        © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>
      </div>

      <div class="osm-copyright">
        © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
      </div>

      <div class="mapbox-improve">
        <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>
      </div>
    </div>

    <map-context-menu :map="map" />
    <stop-info :map="map" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import VectorLayer from "ol/layer/Vector";
import { STREET_LEVEL_ZOOM, MAPBOX_WORDMARK_IMAGE_DATA } from "../const";
import { useStore } from "../store";
import Map from "./map";
import { STOP_STYLE_SELECTED } from "./map-styles";
import MapContextMenu from "./MapContextMenu.vue";
import StopInfo from "./StopInfo.vue";

export default defineComponent({
  name: "Map",
  components: { MapContextMenu, StopInfo },
  setup() {
    const store = useStore();
    const map = new Map();
    const numBaseLayers = map.getBaseLayers().length;
    const nextBaseLayerLabel = ref(map.getNextBaseLayer().get("shortLabel"));
    const stopsLayer = map.getLayer("Stops") as VectorLayer;
    const stopsSource = stopsLayer.getSource();
    const userLocation = ref(null);
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      store.watch(
        (state) => state.baseLayer,
        (baseLayer) => {
          map.setBaseLayer(baseLayer);
          nextBaseLayerLabel.value = map.getNextBaseLayer().get("shortLabel");
        }
      )
    );

    unsubscribers.push(
      store.watch(
        (state) => state.result,
        (newResult, oldResult) => {
          if (oldResult) {
            oldResult.stops.forEach((stop: any) => {
              const feature = stopsSource.getFeatureById(`stop.${stop.id}`);
              if (feature) {
                feature.setStyle(undefined);
              }
            });
          }

          if (newResult && newResult.stops.length) {
            const stops = newResult.stops;
            const newExtent = map.extentOf(stops, true);

            const setStyle = () => {
              stops.forEach((stop: any) => {
                const feature = stopsSource.getFeatureById(`stop.${stop.id}`);
                if (feature) {
                  feature.setStyle(STOP_STYLE_SELECTED);
                }
              });
            };

            if (
              !map.containsExtent(newExtent) ||
              map.getZoom() < STREET_LEVEL_ZOOM
            ) {
              map.setExtent(newExtent, () =>
                map.once("rendercomplete", setStyle)
              );
            } else {
              setStyle();
            }
          }
        }
      )
    );

    function nextBaseLayer() {
      store.commit("nextBaseLayer", { numBaseLayers });
    }

    function zoomToUserLocation() {
      const userLocation = map.getUserLocation();
      if (userLocation.position) {
        map.showUserLocation(/*zoomTo*/ true);
      } else {
        store.commit("setError", {
          title: "Location Error",
          explanation: "Could not determine your location.",
          detail: "Check your browser location settings and try again.",
        });
      }
    }

    function onClick() {
      store.commit("closeMapContextMenu");
    }

    function onContextMenu(event: any) {
      const x = event.pageX;
      const y = event.pageY;
      store.commit("setMapContextMenuState", { open: true, x, y });
    }

    onMounted(() => {
      map.onFeature(
        "click",
        (map, feature) => {
          const stopID = feature.get("id");
          if (store.state.error) {
            store.commit("resetSearchState");
          }
          store.commit("toggleStopID", { stopID });
          store.dispatch("search", { term: store.state.term });
        },
        () => {
          store.commit("resetSearchState");
        },
        stopsLayer
      );

      // Initial zoom to user location
      map.addGeolocatorListener(
        "change",
        () => map.showUserLocation(/* zoomTo */ true),
        /* once */ true
      );

      map.addGeolocatorListener("change", () => map.showUserLocation());

      map.addGeolocatorListener("error", (error) => {
        let explanation;
        let detail;

        switch (error.code) {
          case 1:
            explanation =
              "Access to location services have been disabled for this site.";
            detail = "Check your browser location settings and try again.";
            break;
          case 3:
            explanation = "Could not find your location after 30 seconds.";
            break;
          default:
            explanation = "Could not determine your location.";
        }

        store.commit("setError", {
          title: "Location Error",
          explanation,
          detail,
        });
      });

      map.setTarget("map", "overview-map");
    });

    onUnmounted(() => {
      map.cleanup();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    });

    return {
      map,
      nextBaseLayerLabel,
      nextBaseLayer,
      userLocation,
      zoomToUserLocation,
      onClick,
      onContextMenu,
      MAPBOX_WORDMARK_IMAGE_DATA,
    };
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#map {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  background-color: lighten(lightseagreen, 50%);
  user-select: none;
}

#map > .controls {
  position: absolute;
  z-index: 1;

  button {
    @include floating-element();
  }

  &.row {
    display: flex;
    flex-direction: row;
    margin: 0;
    > * {
      margin: 0;
      margin-left: $quarter-standard-spacing;
    }
  }

  &.column {
    display: flex;
    flex-direction: column;
    margin: 0;
    > * {
      margin: 0;
      margin-top: $quarter-standard-spacing;
    }
  }

  &.bottom-left {
    bottom: $standard-spacing;
    left: $standard-spacing;

    #overview-map {
      @include floating-element();
      @include hidden-sm();

      position: relative;

      width: 128px;
      height: 128px;

      background-color: white;
      border: 2px solid lightgray;
      border-radius: $border-radius;
      cursor: pointer;
      margin-bottom: $quarter-standard-spacing;

      .label {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 2px;
        z-index: 10;
        color: black;
        background-color: rgba(255, 255, 255, 0.5);
        font-weight: bold;
        line-height: 1;
        text-align: center;
      }
    }
    @media (max-width: $sm-width - 1px) {
      bottom: $standard-spacing + 28px;
    }

    @media (max-width: $xs-width - 1px) {
      left: $quarter-standard-spacing;
      bottom: $half-standard-spacing + 20px;
    }
  }

  &.bottom-right {
    bottom: $standard-spacing;
    right: $standard-spacing;

    @media (max-width: $xs-width - 1px) {
      bottom: $quarter-standard-spacing;
      right: $quarter-standard-spacing;
    }
  }
}

#map > #attributions {
  @include floating-element();
  @include hidden-sm();

  position: absolute;
  bottom: $standard-spacing;
  right: $standard-spacing + $half-standard-spacing + 40px;
  z-index: 12;

  background-color: rgba(255, 255, 255, 0.75);

  font-size: 14px;
  line-height: 1;
  padding: 8px 4px;
  white-space: nowrap;

  .mapbox-improve a {
    font-weight: bold;
  }

  div {
    display: inline-block;
    margin-right: $quarter-standard-spacing;
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
