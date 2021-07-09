<template>
  <div id="result" v-if="result">
    <ul id="stops">
      <li class="updateTime">Updated at {{ result.updateTime }}</li>

      <li class="stop" v-for="stop in result.stops" :key="stop.id">
        <div class="heading">Stop {{ stop.id }}</div>

        <ul id="routes">
          <li class="route" v-for="route in stop.routes" :key="route.id">
            <div class="heading">{{ route.name }}</div>

            <ul id="arrivals">
              <li
                :class="[
                  'arrival',
                  `designation-${arrival.designation || 'none'}`,
                ]"
                v-for="(arrival, i) in route.arrivals"
                :key="i"
              >
                <div>{{ arrival.status }}</div>
                <div :title="kilometersAway(arrival)">
                  {{ milesAway(arrival) }}
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "../store";

export default defineComponent({
  name: "Result",

  setup() {
    const store = useStore();
    const result = computed(() => store.state.result);

    function milesAway(arrival: any) {
      const {
        distanceAway: { miles, feet },
      } = arrival;
      if (!miles) {
        return "N/A";
      }
      if (feet <= 300) {
        const unit = feet === 1 ? "foot" : "feet";
        return `${Math.round(feet).toFixed(1)} ${unit} away`;
      }
      const ess = miles === 1 ? "" : "s";
      return `${miles.toFixed(1)} mile${ess} away`;
    }

    function kilometersAway(arrival: any) {
      const {
        distanceAway: { kilometers, meters },
      } = arrival;
      if (!kilometers) {
        return "N/A";
      }
      if (meters <= 100) {
        return `${Math.round(meters).toFixed(0)} m away`;
      }
      return `${kilometers.toFixed(1)} km away`;
    }

    return { result, milesAway, kilometersAway };
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/variables";

ul {
  list-style: none;
  margin: 0;
  padding-left: 0;
}

#result {
  animation: fade-in 0.5s;
  max-height: 400px;
  overflow-x: hidden;
}

#result > ul#stops {
  background-color: white;
  box-shadow: 2px 2px 4px;
  padding-top: 40px + $twice-standard-spacing;

  position: absolute;
  top: 0;
  right: 0;
  left: 0;

  > li.updateTime {
    border-top: 1px solid $menu-item-border-color;
    padding: $half-standard-spacing $standard-spacing;
    text-align: right;
  }

  > li.stop {
    > .heading {
      background-color: #e0e0e0;
      border-top: 1px solid #a0a0a0;
      border-bottom: 1px solid #a0a0a0;
      font-size: 105%;
      font-weight: bold;
      padding: $half-standard-spacing $standard-spacing;
    }

    > ul#routes {
      > li.route {
        border-bottom: 1px solid $menu-item-border-color;
        padding: $half-standard-spacing $standard-spacing;

        &:last-child {
          border-bottom: none;
        }

        > .heading {
          font-weight: bold;
        }

        > ul#arrivals {
          > li.arrival {
            display: flex;
            flex-direction: row;
            padding: $quarter-standard-spacing 0;
            > div {
              flex: 50%;
            }
            &.designation-red,
            &.designation-orange,
            &.designation-yellow {
              padding-left: 2px;
              padding-right: 2px;
              border-radius: 2px;
            }
            &.designation-red {
              background-color: rgb(252, 192, 192);
            }
            &.designation-orange {
              background-color: rgb(253, 192, 124);
            }
            &.designation-yellow {
              background-color: rgb(252, 252, 124);
            }
          }
        }
      }
    }
  }

  @media (max-width: $xs-width - 1) {
    padding-top: 40px + $half-standard-spacing;
    width: 100%;
  }
}
</style>
