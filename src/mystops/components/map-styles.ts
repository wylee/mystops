import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import RegularShape from "ol/style/RegularShape";
import Stroke from "ol/style/Stroke";

/* Base */

const STOP_STYLE_CACHE: { [key: string]: Style } = {};

export const STOP_STYLE = (feature: Feature, resolution: number): Style => {
  const key = resolution.toString();
  if (typeof STOP_STYLE_CACHE[key] === "undefined") {
    let radius;
    let strokeWidth = 2;
    if (resolution < 1) {
      radius = 12;
    } else if (resolution < 2) {
      radius = 10;
    } else if (resolution < 4) {
      radius = 8;
    } else if (resolution < 8) {
      radius = 6;
    } else if (resolution < 10) {
      radius = 4;
    } else if (resolution < 12) {
      radius = 3;
    } else if (resolution < 20) {
      radius = 2;
      strokeWidth = 1;
    } else {
      radius = 1;
      strokeWidth = 1;
    }
    const style = new Style({
      image: new Circle({
        radius,
        fill: new Fill({
          color: "rgb(128, 192, 255, 0.85)",
        }),
        stroke: new Stroke({ color: "rgb(8, 76, 141)", width: strokeWidth }),
      }),
    });
    STOP_STYLE_CACHE[key] = style;
  }
  return STOP_STYLE_CACHE[key];
};

/* Selected */

export const STOP_STYLE_SELECTED = new Style({
  zIndex: 100,
  image: new RegularShape({
    points: 5,
    radius: 12,
    radius2: 5,
    fill: new Fill({
      color: "white",
    }),
    stroke: new Stroke({
      color: "red",
      width: 2,
    }),
  }),
});

/* User Location */

export const USER_LOCATION_STYLE = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({
      color: "rgba(255, 10, 32, 0.75)",
    }),
    stroke: new Stroke({
      color: "white",
      width: 2,
    }),
  }),
});

export const USER_LOCATION_ACCURACY_STYLE = new Style({
  fill: new Fill({
    color: "rgba(255, 10, 32, 0.15)",
  }),
  stroke: new Stroke({
    color: "rgba(255, 10, 32, 0.75)",
    width: 1,
  }),
});
