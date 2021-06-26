import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";

import OpenLayersMap from "./OpenLayersMap";

export default class OverviewSwitcher {
  map: Map;
  view: View;
  mainMap: OpenLayersMap;
  baseLayers: Array<any>;
  baseLayer: any;
  baseLayerIndex = 0;

  constructor(mainMap, target, baseLayers) {
    this.mainMap = mainMap;

    let numLayers = baseLayers.length;

    this.baseLayers = baseLayers.map((layer, i) => {
      const previous = i === 0 ? numLayers - 1 : i - 1;
      const visible = baseLayers[previous].getVisible();
      const baseLayer = new TileLayer({
        source: layer.getSource(),
        visible,
      });
      baseLayer.set("label", layer.get("label"));
      baseLayer.set("shortLabel", layer.get("shortLabel"));
      if (visible) {
        this.baseLayer = baseLayer;
        this.baseLayerIndex = i;
      }
      return baseLayer;
    });

    this.map = new Map({
      target,
      controls: [],
      interactions: [],
      layers: this.baseLayers,
      view: new View(),
    });

    this.view = this.map.getView();
  }

  initialize(target, zoomLevel) {
    const map = this.map;
    const view = this.view;
    const mainMapView = this.mainMap.getView();

    map.setTarget(target);
    view.setZoom(zoomLevel);

    mainMapView.on("change:center", () => {
      view.setCenter(mainMapView.getCenter());
    });
  }

  cleanup() {
    this.map.setTarget(undefined);
  }

  setBaseLayerByIndex(index) {
    for (let layer of this.baseLayers) {
      layer.setVisible(false);
    }
    this.baseLayer = this.baseLayers[index];
    this.baseLayerIndex = index;
    this.baseLayer.setVisible(true);
  }
}
